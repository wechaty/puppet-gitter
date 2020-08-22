/// <reference path="./node-gitter.d.ts" />

import Gitter from 'node-gitter'

type MessageModelPayload = Gitter.MessagePayload['model']

export interface GitterRoomMessagePayload extends MessageModelPayload {
  roomId: string
}

export {
  Gitter,
}
