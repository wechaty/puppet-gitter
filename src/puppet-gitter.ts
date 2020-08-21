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
}                           from 'wechaty-puppet'

import {
  CHATIE_OFFICIAL_ACCOUNT_QRCODE,
  qrCodeForChatie,
  VERSION,
}                                   from './config'

// import { Attachment } from './mock/user/types'

import {
  Mocker,
  // ContactMock,
}                     from './mock/mod'
// import { UrlLink, MiniProgram } from 'wechaty'

export type PuppetGitterOptions = PuppetOptions & {
  mocker?: Mocker,
}

class PuppetGitter extends Puppet {

  public static readonly VERSION = VERSION

  private loopTimer?: NodeJS.Timer

  public mocker: Mocker

  constructor (
    public options: PuppetGitterOptions = {},
  ) {
    super(options)
    log.verbose('PuppetGitter', 'constructor()')

    if (options.mocker) {
      log.verbose('PuppetGitter', 'constructor() use options.mocker')
      this.mocker = options.mocker
    } else {
      log.verbose('PuppetGitter', 'constructor() creating the default mocker')
      this.mocker = new Mocker()
      // this.mocker.use(SimpleBehavior())
    }
    this.mocker.puppet = this
  }

  public async start (): Promise<void> {
    log.verbose('PuppetGitter', 'start()')

    if (this.state.on()) {
      log.warn('PuppetGitter', 'start() is called on a ON puppet. await ready(on) and return.')
      await this.state.ready('on')
      return
    }

    this.state.on('pending')

    // Do some async initializing tasks

    this.state.on(true)

    /**
     * Start mocker after the puppet fully turned ON.
     */
    setImmediate(() => this.mocker.start())
  }

  public async stop (): Promise<void> {
    log.verbose('PuppetGitter', 'stop()')

    if (this.state.off()) {
      log.warn('PuppetGitter', 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    if (this.loopTimer) {
      clearInterval(this.loopTimer)
    }

    this.mocker.stop()

    if (this.logonoff()) {
      await this.logout()
    }

    // await some tasks...
    this.state.off(true)
  }

  public login (contactId: string): Promise<void> {
    log.verbose('PuppetGitter', 'login()')
    return super.login(contactId)
  }

  public async logout (): Promise<void> {
    log.verbose('PuppetGitter', 'logout()')

    if (!this.id) {
      throw new Error('logout before login?')
    }

    this.emit('logout', { contactId: this.id, data: 'test' }) // before we will throw above by logonoff() when this.user===undefined
    this.id = undefined

    // TODO: do the logout job
  }

  public ding (data?: string): void {
    log.silly('PuppetGitter', 'ding(%s)', data || '')
    setTimeout(() => this.emit('dong', { data: data || '' }), 1000)
  }

  public unref (): void {
    log.verbose('PuppetGitter', 'unref()')
    super.unref()
    if (this.loopTimer) {
      this.loopTimer.unref()
    }
  }

  /**
   *
   * ContactSelf
   *
   *
   */
  public async contactSelfQRCode (): Promise<string> {
    log.verbose('PuppetGitter', 'contactSelfQRCode()')
    return CHATIE_OFFICIAL_ACCOUNT_QRCODE
  }

  public async contactSelfName (name: string): Promise<void> {
    log.verbose('PuppetGitter', 'contactSelfName(%s)', name)
  }

  public async contactSelfSignature (signature: string): Promise<void> {
    log.verbose('PuppetGitter', 'contactSelfSignature(%s)', signature)
  }

  /**
   *
   * Contact
   *
   */
  public contactAlias (contactId: string)                      : Promise<string>
  public contactAlias (contactId: string, alias: string | null): Promise<void>

  public async contactAlias (contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose('PuppetGitter', 'contactAlias(%s, %s)', contactId, alias)

    if (typeof alias === 'undefined') {
      return 'mock alias'
    }
  }

  public async contactList (): Promise<string[]> {
    log.verbose('PuppetGitter', 'contactList()')
    return [...this.mocker.cacheContactPayload.keys()]
  }

  public async contactQRCode (contactId: string): Promise<string> {
    log.verbose('PuppetGitter', 'contactQRCode(%s)', contactId)
    if (contactId !== this.selfId()) {
      throw new Error('can not set avatar for others')
    }

    throw new Error('not supported')
    // return await this.bridge.WXqr
  }

  public async contactAvatar (contactId: string)                : Promise<FileBox>
  public async contactAvatar (contactId: string, file: FileBox) : Promise<void>

  public async contactAvatar (contactId: string, file?: FileBox): Promise<void | FileBox> {
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

  public async contactRawPayloadParser (payload: ContactPayload) { return payload }
  public async contactRawPayload (id: string): Promise<ContactPayload> {
    log.verbose('PuppetGitter', 'contactRawPayload(%s)', id)
    return this.mocker.contactPayload(id)
  }

  /**
   *
   * Message
   *
   */
  public async messageContact (
    messageId: string,
  ): Promise<string> {
    log.verbose('PuppetGitter', 'messageContact(%s)', messageId)
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof ContactMock) {
    //   return attachment.id
    // }
    return ''
  }

  public async messageImage (
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

  public async messageRecall (
    messageId: string,
  ): Promise<boolean> {
    log.verbose('PuppetGitter', 'messageRecall(%s)', messageId)
    return false
  }

  public async messageFile (id: string): Promise<FileBox> {
    // const attachment = this.mocker.MockMessage.loadAttachment(id)
    // if (attachment instanceof FileBox) {
    //   return attachment
    // }
    return FileBox.fromBase64(
      'cRH9qeL3XyVnaXJkppBuH20tf5JlcG9uFX1lL2IvdHRRRS9kMMQxOPLKNYIzQQ==',
      'mock-file' + id + '.txt',
    )
  }

  public async messageUrl (messageId: string)  : Promise<UrlLinkPayload> {
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

  public async messageMiniProgram (messageId: string): Promise<MiniProgramPayload> {
    log.verbose('PuppetGitter', 'messageMiniProgram(%s)', messageId)
    // const attachment = this.mocker.MockMessage.loadAttachment(messageId)
    // if (attachment instanceof MiniProgram) {
    //   return attachment.payload
    // }
    return {
      title : 'mock title for ' + messageId,
    }
  }

  public async messageRawPayloadParser (payload: MessagePayload) { return payload }
  public async messageRawPayload (id: string): Promise<MessagePayload> {
    log.verbose('PuppetGitter', 'messageRawPayload(%s)', id)
    return this.mocker.messagePayload(id)
  }

  private async messageSend (
    conversationId: string,
    something: string | FileBox, // | Attachment
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageSend(%s, %s)', conversationId, something)
    if (!this.id) {
      throw new Error('no this.id')
    }

    const user = this.mocker.ContactMock.load(this.id)
    let conversation

    if (/@/.test(conversationId)) {
      // FIXME: extend a new puppet method messageRoomSendText, etc, for Room message?
      conversation = this.mocker.RoomMock.load(conversationId)
    } else {
      conversation = this.mocker.ContactMock.load(conversationId)
    }
    user.say(something).to(conversation)
  }

  public async messageSendText (
    conversationId: string,
    text     : string,
  ): Promise<void> {
    return this.messageSend(conversationId, text)
  }

  public async messageSendFile (
    conversationId: string,
    file     : FileBox,
  ): Promise<void> {
    return this.messageSend(conversationId, file)
  }

  public async messageSendContact (
    conversationId: string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageSendUrl(%s, %s)', conversationId, contactId)

    // const contact = this.mocker.MockContact.load(contactId)
    // return this.messageSend(conversationId, contact)
  }

  public async messageSendUrl (
    conversationId: string,
    urlLinkPayload: UrlLinkPayload,
  ) : Promise<void> {
    log.verbose('PuppetGitter', 'messageSendUrl(%s, %s)', conversationId, JSON.stringify(urlLinkPayload))

    // const url = new UrlLink(urlLinkPayload)
    // return this.messageSend(conversationId, url)
  }

  public async messageSendMiniProgram (
    conversationId: string,
    miniProgramPayload: MiniProgramPayload,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'messageSendMiniProgram(%s, %s)', conversationId, JSON.stringify(miniProgramPayload))
    // const miniProgram = new MiniProgram(miniProgramPayload)
    // return this.messageSend(conversationId, miniProgram)
  }

  public async messageForward (
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
  public async roomRawPayloadParser (payload: RoomPayload) { return payload }
  public async roomRawPayload (id: string): Promise<RoomPayload> {
    log.verbose('PuppetGitter', 'roomRawPayload(%s)', id)
    return this.mocker.roomPayload(id)
  }

  public async roomList (): Promise<string[]> {
    log.verbose('PuppetGitter', 'roomList()')
    return [...this.mocker.cacheRoomPayload.keys()]
  }

  public async roomDel (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'roomDel(%s, %s)', roomId, contactId)
  }

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.verbose('PuppetGitter', 'roomAvatar(%s)', roomId)

    const payload = await this.roomPayload(roomId)

    if (payload.avatar) {
      return FileBox.fromUrl(payload.avatar)
    }
    log.warn('PuppetGitter', 'roomAvatar() avatar not found, use the chatie default.')
    return qrCodeForChatie()
  }

  public async roomAdd (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'roomAdd(%s, %s)', roomId, contactId)
  }

  public async roomTopic (roomId: string)                : Promise<string>
  public async roomTopic (roomId: string, topic: string) : Promise<void>

  public async roomTopic (
    roomId: string,
    topic?: string,
  ): Promise<void | string> {
    log.verbose('PuppetGitter', 'roomTopic(%s, %s)', roomId, topic)

    if (typeof topic === 'undefined') {
      return 'mock room topic'
    }

    await this.roomPayloadDirty(roomId)
  }

  public async roomCreate (
    contactIdList : string[],
    topic         : string,
  ): Promise<string> {
    log.verbose('PuppetGitter', 'roomCreate(%s, %s)', contactIdList, topic)

    return 'mock_room_id'
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.verbose('PuppetGitter', 'roomQuit(%s)', roomId)
  }

  public async roomQRCode (roomId: string): Promise<string> {
    log.verbose('PuppetGitter', 'roomQRCode(%s)', roomId)
    return roomId + ' mock qrcode'
  }

  public async roomMemberList (roomId: string) : Promise<string[]> {
    log.verbose('PuppetGitter', 'roomMemberList(%s)', roomId)
    return []
  }

  public async roomMemberRawPayload (roomId: string, contactId: string): Promise<RoomMemberPayload>  {
    log.verbose('PuppetGitter', 'roomMemberRawPayload(%s, %s)', roomId, contactId)
    return {
      avatar    : 'mock-avatar-data',
      id        : 'xx',
      name      : 'mock-name',
      roomAlias : 'yy',
    }
  }

  public async roomMemberRawPayloadParser (rawPayload: RoomMemberPayload): Promise<RoomMemberPayload>  {
    log.verbose('PuppetGitter', 'roomMemberRawPayloadParser(%s)', rawPayload)
    return rawPayload
  }

  public async roomAnnounce (roomId: string)                : Promise<string>
  public async roomAnnounce (roomId: string, text: string)  : Promise<void>

  public async roomAnnounce (roomId: string, text?: string) : Promise<void | string> {
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
  public async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.verbose('PuppetGitter', 'roomInvitationAccept(%s)', roomInvitationId)
  }

  public async roomInvitationRawPayload (roomInvitationId: string): Promise<any> {
    log.verbose('PuppetGitter', 'roomInvitationRawPayload(%s)', roomInvitationId)
  }

  public async roomInvitationRawPayloadParser (rawPayload: any): Promise<RoomInvitationPayload> {
    log.verbose('PuppetGitter', 'roomInvitationRawPayloadParser(%s)', JSON.stringify(rawPayload))
    return rawPayload
  }

  /**
   *
   * Friendship
   *
   */
  public async friendshipRawPayload (id: string): Promise<any> {
    return { id } as any
  }

  public async friendshipRawPayloadParser (rawPayload: any): Promise<FriendshipPayload> {
    return rawPayload
  }

  public async friendshipSearchPhone (
    phone: string,
  ): Promise<null | string> {
    log.verbose('PuppetGitter', 'friendshipSearchPhone(%s)', phone)
    return null
  }

  public async friendshipSearchWeixin (
    weixin: string,
  ): Promise<null | string> {
    log.verbose('PuppetGitter', 'friendshipSearchWeixin(%s)', weixin)
    return null
  }

  public async friendshipAdd (
    contactId : string,
    hello     : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'friendshipAdd(%s, %s)', contactId, hello)
  }

  public async friendshipAccept (
    friendshipId : string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'friendshipAccept(%s)', friendshipId)
  }

  /**
   *
   * Tag
   *
   */
  public async tagContactAdd (
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactAdd(%s)', tagId, contactId)
  }

  public async tagContactRemove (
    tagId: string,
    contactId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactRemove(%s)', tagId, contactId)
  }

  public async tagContactDelete (
    tagId: string,
  ): Promise<void> {
    log.verbose('PuppetGitter', 'tagContactDelete(%s)', tagId)
  }

  public async tagContactList (
    contactId?: string,
  ): Promise<string[]> {
    log.verbose('PuppetGitter', 'tagContactList(%s)', contactId)
    return []
  }

}

export { PuppetGitter }
export default PuppetGitter
