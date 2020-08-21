#!/usr/bin/env ts-node

import {
  PuppetGitter,
  VERSION,
}                 from 'wechaty-puppet-gitter'

async function main () {
  if (VERSION === '0.0.0') {
    throw new Error('version should not be 0.0.0 when prepare for publishing')
  }

  const puppet = new PuppetGitter()
  console.info(`Puppet v${puppet.version()} smoke testing passed.`)
  return 0
}

main()
  .then(process.exit)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
