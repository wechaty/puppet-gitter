#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import {
  PuppetGitter,
  VERSION,
}                 from 'wechaty-puppet-gitter'

async function main () {
  const puppet = new PuppetGitter({ token: 'dummy' })

  if (VERSION === '0.0.0') {
    throw new Error('version should not be 0.0.0 when prepare for publishing')
  }

  console.info(`Puppet v${puppet.version()} smoke testing passed.`)
  return 0
}

main()
  .then(process.exit)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
