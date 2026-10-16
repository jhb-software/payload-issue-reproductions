import { createPayloadRequest, handleEndpoints } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '../src/payload.config.js'

describe('Local API call with req and no fallbackLocale', () => {
  beforeAll(async () => {
    // The post only has a title in `de`
    await payload.create({
      collection: 'posts',
      locale: 'de',
      data: { title: 'Nur auf Deutsch' },
      overrideAccess: true,
    })
  })

  it('keeps the request fallback locale (custom endpoint, ?locale=en&fallback-locale=de)', async () => {
    const response = await handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/fallback-probe?locale=en&fallback-locale=de'),
    })
    const body = await response.json()

    console.log('endpoint response:', body)

    // Expected: the nested find falls back to the request's fallback locale `de`, and leaves it on req.
    // Actual: it falls back to `defaultLocale` (`en`, i.e. itself) and writes `en` onto req.fallbackLocale.
    expect(body).toEqual({ fallbackAfter: 'de', fallbackBefore: 'de', title: 'Nur auf Deutsch' })
  })

  it('createPayloadRequest keeps req.fallbackLocale when no fallbackLocale is passed', async () => {
    const req = await createPayloadRequest({ payload, req: { fallbackLocale: 'de', locale: 'en' } })

    // `locale` is inherited from req, `fallbackLocale` is replaced with `defaultLocale`
    expect(req.locale).toBe('en')
    expect(req.fallbackLocale).toBe('de')
  })
})
