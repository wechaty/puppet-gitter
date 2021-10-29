#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { test }  from 'tstest'

import { WechatyBuilder } from 'wechaty'

import {
  PuppetGitter,
}                         from '../src/mod.js'

test('integration testing', async t => {
  const puppet = new PuppetGitter({ token: 'test' })
  const wechaty = WechatyBuilder.build({ puppet })

  t.ok(wechaty, 'should instantiate wechaty with puppet gitter')
})
