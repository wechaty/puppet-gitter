/* eslint-disable semi */
// import fs from 'fs'
import path from 'path'

import { v4 } from 'uuid'
import Axios from 'axios'
import FormData from 'form-data'

import { FileBox } from 'file-box'

import {
  Gitter,
  Client,
}             from '../src/gitter'

import { getJsonFromJsonP } from '../src/node-jsonp'

require('dotenv').config()

void path

async function main () {

  const token = process.env.WECHATY_PUPPET_GITTER_TOKEN
  if (!token) {
    throw new Error('token needed')
  }

  const gitter = new Gitter(token)

  const client = new Client(token, {
    // host: 'gitter.im',
    // prefix: true,
    version: 'private',
  })

  const bot = await gitter.currentUser()
  void bot
  // console.info('bot:', bot)

  // console.info('repos', await bot.repos())
  // console.info('orgs', await bot.orgs())

  // const huan = await gitter.users.find('huan')
  // console.info('huan', huan)

  // gitter.rooms.join('gitterhq/sandbox')
  // const room = gitter.rooms.join('gitterhq/sandbox')

  // const roomList = (await bot.rooms())
  // console.info('User.rooms().length', roomList)

  const room = await gitter.rooms.findByUri('wechaty/ChatOps')
  // const room = roomList
  //   .filter(room => /^wechaty\/wechaty$/i.test(room.uri ?? ''))[0]

  // const r = await gitter.rooms.findByUri(room.uri!)
  // const ret = await r.send('[Huan@Headquarters]:\nHello~')
  // console.info(ret)
  /**
   *
   *
「${name}: ${text}]」
—————————

「Huan (李卓桓): 「huan: Cool...」
—————————
You will be very famous for creating this concept for our logo in the future, when the Wechaty becomes the largest Chatbot SDK all over the earth! 」
—————————

*/

  // const users = await r.users()
  // console.info('users', users)

  // const messages = await r.chatMessages()
  // console.info('messages', messages)
  // room.removeUser(currentUser.id);

  // // The 'snapshot' event is emitted once, with the last messages in the room
  // events.on('snapshot', function(snapshot) {
  //   console.log(snapshot.length + ' messages in the snapshot');
  // });

  room.subscribe()
  // The 'chatMessages' event is emitted on each new message
  room.on('chatMessages', function (message) {
    console.info(message)
    // console.info(message.model.mentions)
    // console.info('A message was ' + message.operation)
    // console.info('Text: ', message.model.text)
  })


  // https://api.gitter.im/private/generate-signature
  const generateSignature = `/generate-signature?room_id=${room.id}&type=image`
  console.info(generateSignature)
  const { sig, params } = await client.get(generateSignature) as {
    sig: string,
    params: Object,
  }

  const cleanedUuid = v4().replace(/-/g, '')
  const jsonpUrl = `https://api2.transloadit.com/instances/bored?callback=callback&${cleanedUuid}`
  const json = await getJsonFromJsonP(jsonpUrl) as {
    // eslint-disable-next-line camelcase
    api2_host: string,
    ok: string,
    host: string,
  }

  console.info('json', json)

  const uploadUrl = `https://${json.api2_host}/assemblies/${cleanedUuid}?redirect=false`

  const form = new FormData()
  form.append('signature', sig)
  form.append('params', params)

  // const stream = fs.createReadStream(
  // )

  // const filePath = path.join(__dirname, '../docs/images/wechaty-puppet-gitter.png')
  // const filePath = path.join(__dirname, '../../wechaty/docs/images/qrcode_for_chatie.jpg')
  const filePath = '/Users/huan/Downloads/mustache.gif'
  const fileBox = FileBox.fromFile(filePath)
  form.append('file', await fileBox.toStream())

  const ret = await Axios.post(uploadUrl, form, { headers: form.getHeaders() })
  if (ret.status < 200 || ret.status > 200) {
    throw new Error(ret.statusText)
  }

  console.info('uploaded', ret)

  await new Promise(resolve => setTimeout(resolve, 1000 * 1000))
}

main()
  .catch(console.error)
