import { GitterRoomMessagePayload } from '../gitter'

function isGitterImageMessagePayload (payload: GitterRoomMessagePayload): false | string {
  // text: '[![image.png](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/thumb/image.png)](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/image.png)',
  const RE_GITTER = /^\[!\[[^\]]+\]\(https:\/\/files\.gitter\.im\/[^)]+\)\]\(([^)]+)\)$/
  // text: '![gif.gif](https://domain.com/image.gif)'
  const RE_MD = /^!\[[^\]]*\]\(([^)]+)\)$/
  // text: [![我如何用Chatbot在奇绩创坛重构销售体系](https://wechaty.js.org/assets/2020/qijibot/qijibot.jpg)](https://wechaty.js.org/2020/08/08/qijibot/)
  const RE_MD_LINK = /^\[!\[[^\]]*\]\(([^)]+)\)\]\([^)]+\)$/

  const RE_LIST = [
    RE_GITTER,
    RE_MD,
    RE_MD_LINK,
  ]

  let matches

  for (const RE of RE_LIST) {
    matches = payload.text.match(RE)
    if (matches) {
      return matches[1]
    }
  }

  return false
}

export { isGitterImageMessagePayload }
