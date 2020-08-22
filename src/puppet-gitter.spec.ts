#!/usr/bin/env ts-node

import test  from 'blue-tape'

import { PuppetGitter } from './puppet-gitter'

class PuppetGitterTest extends PuppetGitter {
}

test('PuppetGitter perfect restart testing', async (t) => {
  const puppet = new PuppetGitterTest()
  try {

    for (let i = 0; i < 3; i++) {
      await puppet.start()
      t.true(puppet.state.on(), 'should be turned on after start()')

      await puppet.stop()
      t.true(puppet.state.off(), 'should be turned off after stop()')

      t.pass('start/stop-ed at #' + i)
    }

    t.pass('PuppetGitter() perfect restart pass.')

  } catch (e) {
    t.fail(e)
  }
})
