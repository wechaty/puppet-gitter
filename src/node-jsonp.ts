/**
 * Credit: Matt Self
 *  https://stackoverflow.com/a/16381073/1123955
 */
import Axios from 'axios'

async function getJsonFromJsonP (url: string): Promise<Object> {
  const { status, data } = await Axios.get(url)
  if (status < 200 || status > 299) {
    throw new Error('non 2xx')
  }

  const startPos = data.indexOf('({')
  const endPos = data.indexOf('})')

  const jsonString = data.substring(
    startPos + 1,
    endPos + 1,
  )

  const obj = JSON.parse(jsonString)

  return obj
}

export { getJsonFromJsonP }
