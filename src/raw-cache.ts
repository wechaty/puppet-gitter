import path from 'path'
import os from 'os'
import fs from 'fs'

import { log } from 'wechaty-puppet'

import { FlashStore } from 'flash-store'
import LRU from 'lru-cache'

import type {
  Gitter,
  GitterRoomMessagePayload,
}                           from './gitter.js'

class RawCache {

  get contactPayloads ()  { return this._contactPayloads! }
  get messagePayloads ()  { return this._messagePayloads! }
  get roomPayloads ()     { return this._roomPayloads! }

  private _contactPayloads? : FlashStore<string, Gitter.UserPayload>
  private _messagePayloads? : LRU<string, GitterRoomMessagePayload>
  private _roomPayloads?    : FlashStore<string, Gitter.RoomPayload>

  constructor (
    public puppetId: string,
    public botId: string,
  ) {
    log.verbose('RawCache', 'constructor(%s, %s)', puppetId, botId)
  }

  async start () {
    log.verbose('RawCache', 'start()')

    if (this._messagePayloads) {
      throw new Error('RawCache should be stop() before start() again.')
    }

    // 1.2.3 => 1.2
    const flashStoreVersion = 'flash-store-v' + FlashStore.VERSION.replace(/\.\d+$/, '')

    /**
     * FlashStore
     */
    const baseDir = path.join(
      os.homedir(),
      '.wechaty',
      this.puppetId,
      this.botId,
      flashStoreVersion,
    )
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }

    this._contactPayloads = new FlashStore(path.join(baseDir, 'contact-raw-payload'))
    this._roomPayloads    = new FlashStore(path.join(baseDir, 'room-raw-payload'))

    /**
     * LRU
     */
    const lruOptions: LRU.Options<string, GitterRoomMessagePayload> = {
      // dispose (key: string, val: any) {
      //   log.silly('RawCache', `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      // },
      max:    1000,
      maxAge: 1000 * 60 * 60,
    }

    this._messagePayloads = new LRU<string, GitterRoomMessagePayload>(lruOptions)
  }

  async stop () {
    log.verbose('RawCache', 'stop()')

    if (this._contactPayloads) { await this._contactPayloads.close()  }
    if (this._roomPayloads)    { await this._roomPayloads.close()     }

    this._contactPayloads = undefined
    this._messagePayloads = undefined
    this._roomPayloads    = undefined
  }

}

export { RawCache }
