import { Gitter } from '../src/gitter'

require('dotenv').config()

async function main () {

  const gitter = new Gitter(
    process.env.WECHATY_PUPPET_GITTER_TOKEN!,
  )

  const bot = await gitter.currentUser()
  void bot
  // console.info('bot:', bot)

  // console.info('repos', await bot.repos())
  // console.info('orgs', await bot.orgs())

  // const huan = await gitter.users.find('huan')
  // console.info('huan', huan)

  // gitter.rooms.join('gitterhq/sandbox')
  // const room = gitter.rooms.join('gitterhq/sandbox')

  const roomList = (await bot.rooms())
    .filter(room => /^wechaty\/wechaty$/i.test(room.uri ?? ''))

  if (roomList.length <= 0) {
    throw new Error('room not found')
  }

  const room = roomList[0]
  // console.info(room)

  const r = await gitter.rooms.findByUri(room.uri!)
  // const ret = await r.send('[Huan@Headquarters]:\nHelo~')
  // console.info(ret)
  /**
   *
   *
「${name}: ${text}]」
—————————

「Huan (李卓桓): 「Gcaufy: Cool...」
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

  r.subscribe()
  // The 'chatMessages' event is emitted on each new message
  r.on('chatMessages', function (message) {
    console.info(message)
    console.info(message.model.mentions)
    console.info('A message was ' + message.operation)
    console.info('Text: ', message.model.text)
  })

  await new Promise(resolve => setTimeout(resolve, 1000 * 1000))
}

main()
  .catch(console.error)
