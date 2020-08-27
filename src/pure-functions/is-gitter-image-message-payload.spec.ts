#!/usr/bin/env ts-node

import test from 'blue-tape'

import { GitterRoomMessagePayload } from '../gitter'

import { isGitterImageMessagePayload } from './is-gitter-image-message-payload'

test('isGitterImageMessagePayload', async (t) => {
  const URL_THUMB = 'https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/thumb/image.png'
  const URL       = 'https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/image.png'

  const TEXT = `[![image.png](${URL_THUMB})](${URL})`

  const payload = {
    text: TEXT,
  } as GitterRoomMessagePayload

  const ret = isGitterImageMessagePayload(payload)
  t.true(ret, 'should identify image payload')
  t.equal(ret, URL, 'should get image url')
})
