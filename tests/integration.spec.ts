#!/usr/bin/env ts-node

import { test }  from 'tstest'

import { Wechaty } from 'wechaty'

import {
  PuppetGitter,
}                         from '../src/mod'

test('integration testing', async t => {
  const puppet = new PuppetGitter({ token: 'test' })
  const wechaty = new Wechaty({ puppet })

  t.ok(wechaty, 'should instantiate wechaty with puppet gitter')
})
