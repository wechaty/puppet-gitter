import { GitterRoomMessagePayload } from '../gitter'

function isGitterImageMessagePayload (payload: GitterRoomMessagePayload): false | string {
  // text: '[![image.png](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/thumb/image.png)](https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/image.png)',
  // const RE = /^\[!\[[^]]+\]\(https:\/\/files\.gitter\.im\/[^)]+\)\]\(([^)]+)\)$/
  const RE = /^\[!\[[^\]]+\]\(https:\/\/files\.gitter\.im\/[^)]+\)\]\(([^)]+)\)$/

  const matches = payload.text.match(RE)
  if (matches) {
    return matches[1]
  }
  return false
}

export { isGitterImageMessagePayload }
