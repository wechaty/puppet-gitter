import {
  FileBox,
}             from 'wechaty-puppet'

import { VERSION } from './version'

const CHATIE_OFFICIAL_ACCOUNT_QRCODE = 'http://weixin.qq.com/r/qymXj7DEO_1ErfTs93y5'

function qrCodeForChatie (): FileBox {
  return FileBox.fromQRCode(CHATIE_OFFICIAL_ACCOUNT_QRCODE)
}

export {
  VERSION,
  CHATIE_OFFICIAL_ACCOUNT_QRCODE,
  qrCodeForChatie,
}
