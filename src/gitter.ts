/// <reference path="./node-gitter.d.ts" />

import Gitter from 'node-gitter'
import Client from 'node-gitter/lib/client.js'

type MessageModelPayload = Gitter.MessagePayload['model']

export interface GitterRoomMessagePayload extends MessageModelPayload {
  roomId: string
}

export {
  Gitter,
  Client,
}
