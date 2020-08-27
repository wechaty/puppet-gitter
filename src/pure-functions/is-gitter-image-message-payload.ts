import { GitterRoomMessagePayload } from '../gitter'

function isGitterImageMessagePayload (payload: GitterRoomMessagePayload): false | string {
  // text: '[![image.png](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/thumb/image.png)](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/image.png)',
  const RE_GITTER = /^\[!\[[^\]]+\]\(https:\/\/files\.gitter\.im\/[^)]+\)\]\(([^)]+)\)$/
  // text: '![gif.gif](https://domain.com/image.gif)'
  const RE_MD = /^!\[[^\]]*\]\(([^)]+)\)$/

  let matches = payload.text.match(RE_GITTER)
  if (!matches) {
    matches = payload.text.match(RE_MD)
  }

  if (matches) {
    return matches[1]
  }
  return false
}

export { isGitterImageMessagePayload }
