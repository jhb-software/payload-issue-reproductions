import { describe, expect, it } from 'vitest'

import { seedPage } from '../src/seed'

describe('stale data check with localizeStatus', () => {
  it('reads the same updatedAt as the edit view for a non-default locale', async () => {
    const page = await seedPage(payload)

    // What the edit view stores as `originalUpdatedAt` on page load
    // (@payloadcms/next/dist/views/Document/getDocumentData.js)
    const onLoad = await payload.findByID({
      id: page.id,
      collection: 'pages',
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: 'de',
    })

    // What the stale data check reads on the first form state request
    // (@payloadcms/ui/dist/utilities/handleStaleDataCheck.js) - no locale is passed,
    // so it falls back to the default locale `en`
    const onStaleCheck = await payload.findByID({
      id: page.id,
      collection: 'pages',
      depth: 0,
      draft: true,
      select: { updatedAt: true },
    })

    // Nobody changed the document in between, so the check must not report it as stale
    expect(onStaleCheck.updatedAt).toBe(onLoad.updatedAt)
  })
})
