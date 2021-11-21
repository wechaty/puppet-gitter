#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { test }  from 'tstest'

import {
  PuppetGitter,
}                         from '../src/mod.js'

test('integration testing', async t => {
  const puppet = new PuppetGitter({ token: 'test' })
  t.ok(puppet, 'should instantiate puppet gitter')
})
