#!/usr/bin/env ts-node

import test from 'blue-tape'

import { GitterRoomMessagePayload } from '../gitter'

import { isMarkdownImageMessagePayload } from './is-markdown-image-message-payload'

test('isMarkdownImageMessagePayload Gitter.im transloadit image', async (t) => {
  const URL_THUMB = 'https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/thumb/image.png'
  const URL       = 'https://files.gitter.im/5d007267d73408ce4fc3056f/7rkf/image.png'

  const TEXT = `[![image.png](${URL_THUMB})](${URL})`

  const payload = {
    text: TEXT,
  } as GitterRoomMessagePayload

  const ret = isMarkdownImageMessagePayload(payload)
  t.true(ret, 'should identify image payload')
  t.equal(ret, URL, 'should get image url')
})

test('isMarkdownImageMessagePayload: markdown image', async (t) => {
  const URL  = 'https://developers.google.com/assistant/interactivecanvas/images/interactivecanvasgame.gif'
  const TEXT = `![Interactive Canvas](${URL})`

  const payload = {
    text: TEXT,
  } as GitterRoomMessagePayload

  const ret = isMarkdownImageMessagePayload(payload)
  t.true(ret, 'should identify image payload')
  t.equal(ret, URL, 'should get image url')
})

test('isMarkdownImageMessagePayload markdown image with link', async (t) => {
  const URL  = 'https://wechaty.js.org/assets/2020/qijibot/qijibot.jpg'
  const TEXT = `[![我如何用Chatbot在奇绩创坛重构销售体系](${URL})](https://wechaty.js.org/2020/08/08/qijibot/)`

  const payload = {
    text: TEXT,
  } as GitterRoomMessagePayload

  const ret = isMarkdownImageMessagePayload(payload)
  t.true(ret, 'should identify image payload')
  t.equal(ret, URL, 'should get image url')
})
