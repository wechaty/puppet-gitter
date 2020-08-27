/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
import path  from 'path'
import { v4 } from 'uuid'

import Axios    from 'axios'
import FormData from 'form-data'

import {
  ContactPayload,

  FileBox,

  FriendshipPayload,

  ImageType,

  MessagePayload,

  Puppet,
  PuppetOptions,

  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,

  UrlLinkPayload,
  MiniProgramPayload,

  log,
  ContactGender,
  ContactType,
  MessageType,
  PayloadType,
  throwUnsupportedError,
}                           from 'wechaty-puppet'

import {
  Gitter,
  GitterRoomMessagePayload,
  Client,
}                             from './gitter'

import {
  CHATIE_OFFICIAL_ACCOUNT_QRCODE,
  qrCodeForChatie,
  VERSION,
}                                   from './config'
import { RawCache }                 from './raw-cache'
import { getJsonFromJsonP }         from './node-jsonp'
import { isGitterImageMessagePayload } from './pure-functions/is-gitter-image-message-payload'

export type PuppetGitterOptions = PuppetOptions

class PuppetGitter extends Puppet {

  static readonly VERSION = VERSION

  private token : string

  private get gitter () { return this._gitter! }
  private _gitter?: Gitter

  private get privateClient () { return this._privateClient! }
  private _privateClient?: Client

  private get rawCache () { return this._rawCache! }
  private _rawCache?: RawCache

  private cleanerCallbackList: (() => void)[]

  constructor (
    options: PuppetGitterOptions = {},
  ) {
    super(options)
    log.verbose('PuppetGitter', 'constructor(%s)', JSON.stringify(options))

    if (options.token) {
      this.token = options.token
    } else if (process.env.WECHATY_PUPPET_GITTER_TOKEN) {
      this.token = process.env.WECHATY_PUPPET_GITTER_TOKEN
    } else {
      throw new Error('wechaty-puppet-gitter need a gitter token')
    }

    this.cleanerCallbackList = []
  }

  async start (): Promise<void> {
    log.verbose('PuppetGitter', 'start()')

    if (this.state.on()) {
      log.warn('PuppetGitter', 'start() is called on a ON puppet. await ready(on) and return.')
      await this.state.ready('on')
      return
    }

    this.state.on('pending')

    try {
      const gitter = new Gitter(this.token)
      this._gitter = gitter

      const privateClient = new Client(this.token, {
        version: 'private',
      })
      this._privateClient = privateClient

      const currentUser = await gitter.currentUser()
      await this.login(currentUser.id)

      await this.bridgeEvents(gitter)

      this.state.on(true)

    } catch (e) {
      log.error('PuppetGitter', 'start() rejection %s', e)
      console.error(e)
      this.state.off(true)
    }
  }

  private async bridgeEvents (gitter: Gitter): Promise<void> {
    log.verbose('PuppetGitter', 'bridgeEvents()')

    const gitterRoomPayloadList = await gitter.rooms.findAll()
    const gitterRoomList = await Promise.all(
      gitterRoomPayloadList
        .map(payload => gitter.rooms.find(payload.id))
    )

    /**
     * Subscribe to all room message events
     */
    for (const gitterRoom of gitterRoomList) {
      gitterRoom.subscribe()
      this.cleanerCallbackList.push(() => gitterRoom.unsubscribe())

      const onChatMessage = async (payload: Gitter.MessagePayload) => {
        if (payload.operation !== 'create') { return }

        await this.rawCache.messagePayloads.set(payload.model.id, {
          ...payload.model,
          roomId: gitterRoom.id,
        })
        this.emit('message', { messageId: payload.model.id })

        /**
          * Huan(202008): Gitter API seems does not permit to get user payload from API,
          *   so we store it when we received a message from the message payload
          */
        if ('fromUser' in payload.model) {
          const userPayload = payload.model.fromUser as Gitter.UserPayload
          if (!this.cacheContactPayload.has(userPayload.id)) {
            await this.rawCache.contactPayloads.set(userPayload.id, userPayload)
          }
        }

      }
      gitterRoom.on('chatMessages', onChatMessage)
      this.cleanerCallbackList.push(() => gitterRoom.off('chatMessages', onChatMessage))
    }

  }

  async stop (): Promise<void> {
    log.verbose('PuppetGitter', 'stop()')

    if (this.state.off()) {
      log.warn('PuppetGitter', 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    try {
      while (this.cleanerCallbackList.length > 0) {
        const cleanerCallback = this.cleanerCallbackList.pop()
        if (cleanerCallback) {
          await cleanerCallback()
        }
      }

      /**
        * Huan(202008): clean faye timer and intervals
        */
      if (this._gitter) {
        this._gitter.faye.disconnect()
        await this._gitter.faye.client.disconnect()
        this._gitter = undefined
      }

      if (this._privateClient) {
        this._privateClient = undefined
      }

      if (this.logonoff()) {
        await this.logout()
      }

    } finally {
      this.state.off(true)
    }

  }

  async login (userId: string): Promise<void> {
    log.verbose('PuppetGitter', 'login(%s)', userId)

    const rawCache = new RawCache(
      this.constructor.name,
      userId,
    )
    await rawCache.start()
    this._rawCache = rawCache

    return super.login(userId)
  }

  async logout (): Promise<void> {
    log.verbose('PuppetGitter', 'logout()')

    await super.logout()

    if (this._rawCache) {
      await this._rawCache.stop()
      this._rawCache = undefined
    }
  }

  ding (data?: string): void {
    log.silly('PuppetGitter', 'ding(%s)', data || '')
    setTimeout(() => this.emit('dong', { data: data || '' }), 1000)
  }

  unref (): void {
    log.verbose('PuppetGitter', 'unref()')
    super.unref()
  }

  /**
   *
   * ContactSelf
   *
   *
   */
  async contactSelfQRCode (): Promise<string> {
    log.verbose('PuppetGitter', 'contactSelfQRCode()')
    return CHATIE_OFFICIAL_ACCOUNT_QRCODE
  }

  async contactSelfName (name: string): Promise<void> {
    log.verbose('PuppetGitter', 'contactSelfName(%s)', name)
  }

  async contactSelfSignature (signature: string): Promise<void> {
    log.verbose('PuppetGitter', 'contactSelfSignature(%s)', signature)
  }

  /**
   *
   * Contact
   *
   */
  contactAlias (contactId: string)                      : Promise<string>
  contactAlias (contactId: string, alias: string | null): Promise<void>

  async contactAlias (contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose('PuppetGitter', 'contactAlias(%s, %s)', contactId, alias)

    if (typeof alias === 'undefined') {
      return 'mock alias'
    }
  }

  async contactList (): Promise<string[]> {
    log.verbose('PuppetGitter', 'contactList()')

    return [...this.cacheContactPayload.keys()]
  }

  async contactQRCode (contactId: string): Promise<string> {
    log.verbose('PuppetGitter', 'contactQRCode(%s)', contactId)
    if (contactId !== this.selfId()) {
      throw new Error('can not set avatar for others')
    }

    throw new Error('not supported')
    // return await this.bridge.WXqr
  }

  async contactAvatar (contactId: string)                : Promise<FileBox>
  async contactAvatar (contactId: string, file: FileBox) : Promise<void>

  async contactAvatar (contactId: string, file?: FileBox): Promise<void | FileBox> {
    log.verbose('PuppetGitter', 'contactAvatar(%s)', contactId)

    /**
     * 1. set
     */
    if (file) {
      return
    }

    /**
     * 2. get
     */
    const WECHATY_ICON_PNG = path.resolve('../../docs/images/wechaty-icon.png')
    return FileBox.fromFile(WECHATY_ICON_PNG)
  }

  public async contactPhone (contactId: string, phoneList: string[]): Promise<void> {
    throwUnsupportedError(contactId, phoneList)
  }

  public async contactCorporationRemark (contactId: string, corporationRemark: string | null) : Promise<void> {
    throwUnsupportedError(contactId, corporationRemark)
  }

  public async contactDescription (contactId: string, description: string | null): Promise<void> {
    throwUnsupportedError(contactId, description)
  }

  async contactRawPayloadParser (rawPayload: Gitter.UserPayload): Promise<ContactPayload> {
    log.silly('PuppetGitter', 'contactRawPayload(%s)', rawPayload)

    const payload: ContactPayload = {
      avatar : rawPayload.avatarUrlMedium,
      gender : ContactGender.Unknown,
      id     : rawPayload.id,
      name   : rawPayload.displayName,
      phone  : [],
      type   : ContactType.Individual,
      weixin : rawPayload.username,
    }

    return payload
  }

  async contactRawPayload (id: string): Promise<Gitter.UserPayload> {
    log.verbose('PuppetGitter', 'contactRawPayload(%s)', id)

    let rawPayload = await this.rawCache.contactPayloads.get(id)
    if (rawPayload) { return rawPayload }

    rawPayload = await this.gitter.users.find(id)
    if (!rawPayload) { throw new Error('contactRawPayload can not load id ' + id) }

    await this.rawCache.contactPayloads.set(id, rawPayload)
    return rawPayload
  }

  /**
   *
   * Message
   *
   */
  async messageContact (
    messageId: string,
  ): Promise<string> {
    log.verbose('PuppetGitter', 'messageContact(%s)', messageId)
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof ContactMock) {
    //   return attachment.id
    // }
    return ''
  }

  async messageImage (
    messageId: string,
    imageType: ImageType,
  ) : Promise<FileBox> {
    log.verbose('PuppetGitter', 'messageImage(%s, %s[%s])',
      messageId,
      imageType,
      ImageType[imageType],
    )
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof FileBox) {
    //   return attachment
    // }
    return FileBox.fromQRCode('fake-qrcode')
  }

  async messageRecall (
    messageId: string,
  ): Promise<boolean> {
    log.verbose('PuppetGitter', 'messageRecall(%s)', messageId)
    return false
  }

  async messageFile (id: string): Promise<FileBox> {
    const rawPayload = await this.rawCache.messagePayloads.get(id)
    if (!rawPayload) {
      throw new Error('message has no raw payload. id: ' + id)
    }

    const imageUrl = isGitterImageMessagePayload(rawPayload)
    if (!imageUrl) {
      throw new Error('message is not a file. id: ' + id)
    }

    return FileBox.fromUrl(imageUrl)
  }

  async messageUrl (messageId: string)  : Promise<UrlLinkPayload> {
    log.verbose('PuppetGitter', 'messageUrl(%s)', messageId)
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof UrlLink) {
    //   return attachment.payload
    // }
    return {
      title : 'mock title for ' + messageId,
      url   : 'https://mock.url',
    }
  }

  async messageMiniProgram (messageId: string): Promise<MiniProgramPayload> {
    log.verbose('PuppetGitter', 'messageMiniProgram(%s)', messageId)
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof MiniProgram) {
    //   return attachment.payload
    // }
    return {
      title : 'mock title for ' + messageId,
    }
  }

  async messageRawPayloadParser (rawPayload: GitterRoomMessagePayload): Promise<MessagePayload> {
    log.silly('PuppetGitter', 'messageRawPayloadParser(%s)', JSON.stringify(rawPayload))

    const basePayload = {
      fromId        : rawPayload.fromUser.id,
      id            : rawPayload.id,
      mentionIdList : rawPayload.mentions.map(m => m.userId),
      roomId        : rawPayload.roomId!,
      text          : rawPayload.text,
      timestamp     : Date.now(),
    }

    let payload: MessagePayload

    const imageUrl = isGitterImageMessagePayload(rawPayload)
    if (imageUrl) {
      payload = {
        ...basePayload,
        type: MessageType.Image,
      }
    } else {
      payload = {
        ...basePayload,
        type: MessageType.Text,
      }
    }
    return payload
  }

  async messageRawPayload (id: string): Promise<GitterRoomMessagePayload> {
    log.verbose('PuppetGitter', 'messageRawPayload(%s)', id)

    const rawPayload = await this.rawCache.messagePayloads.get(id)
    if (rawPayload) { return rawPayload }

    throw new Error('messageRawPayload can not find payload for ' + id)
  }

  async messageSendText (
    conversationId: string,
    text          : string,
  ): Promise<void> {
    log.silly('PuppetGitter', 'messageSendText(%s, %s)', conversationId, text)

    const room = await this.gitter.rooms.find(conversationId)
    if (!room) {
      throw new Error('gitter room not found for conversationId ' + conversationId)
    }
    await room.send(text)
  }

  /**
   * https://github.com/Odonno/modern-gitter-winjs/issues/3#issuecomment-174939610
   *  The process seems to be a little complicated.
   *  GET request to https://gitter.im/api/private/generate-signature?room_uri=Odonno/modern-gitter-test&room_id=5688645016b6c7089cc0e846&type=image
   *  GET request to something like https://api2.transloadit.com/instances/bored?callback=_jqjsp&_...=
   *  finally POST the image to something like https://breagh.transloadit.com/assemblies/...?redirect=false
   *  send GET requests every x seconds to know if the upload succeed
   */
  async messageSendFile (
    conversationId : string,
    fileBox        : FileBox,
  ): Promise<void> {
    log.silly('PuppetGitter', 'messageSendFile(%s, %s)', conversationId, fileBox.name)

    /**
     * 1. Generate Signature
     */
    const generateSignature = `/generate-signature?room_id=${conversationId}&type=image`
    const { sig, params } = await this.privateClient.get(generateSignature) as {
      sig: string,
      params: Object,
    }

    /**
     * 2. Get Transloadit Instance
     */
    const cleanedUuid = v4().replace(/-/g, '')
    const jsonpUrl = `https://api2.transloadit.com/instances/bored?callback=callback&${cleanedUuid}`
    const json = await getJsonFromJsonP(jsonpUrl) as {
      // eslint-disable-next-line camelcase
      api2_host: string,
      ok: string,
      host: string,
    }

    /**
     * Upload file
     */
    const uploadUrl = `https://${json.api2_host}/assemblies/${cleanedUuid}?redirect=false`

    const form = new FormData()
    form.append('signature', sig)
    form.append('params', params)
    form.append('file', await fileBox.toStream())

    const { status, statusText } = await Axios.post(uploadUrl, form, { headers: form.getHeaders() })
    if (status < 200 || status > 200) {
      throw new Error(statusText)
    }
  }

  async messageSendContact (
    conversationId: string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageSendUrl(%s, %s)', conversationId, contactId)

    // const contact = this.mocker.MockContact.load(contactId)
    // return this.messageSend(conversationId, contact)
  }

  async messageSendUrl (
    conversationId: string,
    urlLinkPayload: UrlLinkPayload,
  ) : Promise<void> {
    log.verbose('PuppetGitter', 'messageSendUrl(%s, %s)', conversationId, JSON.stringify(urlLinkPayload))

    // const url = new UrlLink(urlLinkPayload)
    // return this.messageSend(conversationId, url)
  }

  async messageSendMiniProgram (
    conversationId: string,
    miniProgramPayload: MiniProgramPayload,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageSendMiniProgram(%s, %s)', conversationId, JSON.stringify(miniProgramPayload))
    // const miniProgram = new MiniProgram(miniProgramPayload)
    // return this.messageSend(conversationId, miniProgram)
  }

  async messageForward (
    conversationId: string,
    messageId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageForward(%s, %s)',
      conversationId,
      messageId,
    )
  }

  /**
   *
   * Room
   *
   */
  async roomRawPayloadParser (rawPayload: Gitter.RoomPayload): Promise<RoomPayload> {
    const payload: RoomPayload = {
      adminIdList  : [],
      avatar       : undefined,
      id           : rawPayload.id,
      memberIdList : [],
      ownerId      : undefined,
      topic        : rawPayload.name,
    }
    return payload
  }

  async roomRawPayload (id: string): Promise<Gitter.RoomPayload> {
    log.verbose('PuppetGitter', 'roomRawPayload(%s)', id)

    const rawPayload = await this.rawCache.roomPayloads.get(id)
    if (rawPayload) { return rawPayload }

    const gitterRoom = await this.gitter.rooms.find(id)
    if (!gitterRoom) { throw Error('rooRawPayload can not load payload for id ' + id) }

    const newPayload = {
      githubType  : gitterRoom.githubType,
      id          : gitterRoom.id,
      lurk        : gitterRoom.lurk,
      mentions    : gitterRoom.mentions,
      name        : gitterRoom.name,
      oneToOne    : gitterRoom.oneToOne,
      topic       : gitterRoom.topic,
      unreadItems : gitterRoom.unreadItems,
      uri         : gitterRoom.uri,
      url         : gitterRoom.url,
      user: gitterRoom.user ? {
        avatarUrlMedium : gitterRoom.user.avatarUrlMedium,
        avatarUrlSmall  : gitterRoom.user.avatarUrlSmall,
        displayName     : gitterRoom.user.displayName,
        id              : gitterRoom.user.id,
        url             : gitterRoom.user.url,
        username        : gitterRoom.user.username,
      } : undefined,
    }

    await this.rawCache.roomPayloads.set(id, newPayload)
    return newPayload
  }

  async roomList (): Promise<string[]> {
    log.verbose('PuppetGitter', 'roomList()')
    const list = await this.gitter.rooms.findAll()
    return list.map(l => l.id)
  }

  async roomDel (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'roomDel(%s, %s)', roomId, contactId)
  }

  async roomAvatar (roomId: string): Promise<FileBox> {
    log.verbose('PuppetGitter', 'roomAvatar(%s)', roomId)

    const payload = await this.roomPayload(roomId)

    if (payload.avatar) {
      return FileBox.fromUrl(payload.avatar)
    }
    log.warn('PuppetGitter', 'roomAvatar() avatar not found, use the chatie default.')
    return qrCodeForChatie()
  }

  async roomAdd (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'roomAdd(%s, %s)', roomId, contactId)
  }

  async roomTopic (roomId: string)                : Promise<string>
  async roomTopic (roomId: string, topic: string) : Promise<void>

  async roomTopic (
    roomId: string,
    topic?: string,
  ): Promise<void | string> {
    log.verbose('PuppetGitter', 'roomTopic(%s, %s)', roomId, topic)

    if (typeof topic === 'undefined') {
      return 'mock room topic'
    }

    await this.dirtyPayload(PayloadType.Room, roomId)
  }

  async roomCreate (
    contactIdList : string[],
    topic         : string,
  ): Promise<string> {
    log.verbose('PuppetGitter', 'roomCreate(%s, %s)', contactIdList, topic)

    return 'mock_room_id'
  }

  async roomQuit (roomId: string): Promise<void> {
    log.verbose('PuppetGitter', 'roomQuit(%s)', roomId)
  }

  async roomQRCode (roomId: string): Promise<string> {
    log.verbose('PuppetGitter', 'roomQRCode(%s)', roomId)
    return roomId + ' mock qrcode'
  }

  async roomMemberList (roomId: string) : Promise<string[]> {
    log.verbose('PuppetGitter', 'roomMemberList(%s)', roomId)
    return []
  }

  async roomMemberRawPayload (roomId: string, contactId: string): Promise<RoomMemberPayload>  {
    log.verbose('PuppetGitter', 'roomMemberRawPayload(%s, %s)', roomId, contactId)
    return {
      avatar    : 'mock-avatar-data',
      id        : 'xx',
      name      : 'mock-name',
      roomAlias : 'yy',
    }
  }

  async roomMemberRawPayloadParser (rawPayload: RoomMemberPayload): Promise<RoomMemberPayload>  {
    log.verbose('PuppetGitter', 'roomMemberRawPayloadParser(%s)', rawPayload)
    return rawPayload
  }

  async roomAnnounce (roomId: string)                : Promise<string>
  async roomAnnounce (roomId: string, text: string)  : Promise<void>

  async roomAnnounce (roomId: string, text?: string) : Promise<void | string> {
    if (text) {
      return
    }
    return 'mock announcement for ' + roomId
  }

  /**
   *
   * Room Invitation
   *
   */
  async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.verbose('PuppetGitter', 'roomInvitationAccept(%s)', roomInvitationId)
  }

  async roomInvitationRawPayload (roomInvitationId: string): Promise<any> {
    log.verbose('PuppetGitter', 'roomInvitationRawPayload(%s)', roomInvitationId)
  }

  async roomInvitationRawPayloadParser (rawPayload: any): Promise<RoomInvitationPayload> {
    log.verbose('PuppetGitter', 'roomInvitationRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  /**
   *
   * Friendship
   *
   */
  async friendshipRawPayload (id: string): Promise<any> {
    return { id } as any
  }

  async friendshipRawPayloadParser (rawPayload: any): Promise<FriendshipPayload> {
    return rawPayload
  }

  async friendshipSearchPhone (
    phone: string,
  ): Promise<null | string> {
    log.verbose('PuppetGitter', 'friendshipSearchPhone(%s)', phone)
    return null
  }

  async friendshipSearchWeixin (
    weixin: string,
  ): Promise<null | string> {
    log.verbose('PuppetGitter', 'friendshipSearchWeixin(%s)', weixin)
    return null
  }

  async friendshipAdd (
    contactId : string,
    hello     : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'friendshipAdd(%s, %s)', contactId, hello)
  }

  async friendshipAccept (
    friendshipId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'friendshipAccept(%s)', friendshipId)
  }

  /**
   *
   * Tag
   *
   */
  async tagContactAdd (
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactAdd(%s)', tagId, contactId)
  }

  async tagContactRemove (
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactRemove(%s)', tagId, contactId)
  }

  async tagContactDelete (
    tagId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactDelete(%s)', tagId)
  }

  async tagContactList (
    contactId?: string,
  ): Promise<string[]> {
    log.verbose('PuppetGitter', 'tagContactList(%s)', contactId)
    return []
  }

}

export { PuppetGitter }
export default PuppetGitter
