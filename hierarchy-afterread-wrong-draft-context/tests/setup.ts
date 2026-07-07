import { afterAll, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

declare global {
  // eslint-disable-next-line no-var
  var payload: Payload
}

beforeAll(async () => {
  global.payload = await getPayload({ config })
})

afterAll(async () => {
  await global.payload.db.destroy()
})
