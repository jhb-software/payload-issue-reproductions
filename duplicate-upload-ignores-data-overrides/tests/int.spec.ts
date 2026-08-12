import { describe, expect, it } from 'vitest'

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

describe('payload.duplicate() with data overrides', () => {
  it('respects data overrides on a NON-upload collection (control)', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: { owner: 'source-owner' },
    })

    const duplicated = await payload.duplicate({
      collection: 'posts',
      id: post.id,
      data: { owner: 'override-owner' },
    })

    expect(duplicated.owner).toBe('override-owner')
  })

  it('respects data overrides on an UPLOAD collection', async () => {
    const media = await payload.create({
      collection: 'media',
      data: { owner: 'source-owner' },
      file: {
        data: PNG,
        mimetype: 'image/png',
        name: 'repro.png',
        size: PNG.byteLength,
      },
    })

    const duplicated = await payload.duplicate({
      collection: 'media',
      id: media.id,
      data: { owner: 'override-owner' },
    })

    // Currently FAILS: the duplicate keeps "source-owner".
    // create.ts replaces `data` wholesale with the source document when
    // duplicating an upload, so every caller override is discarded — silently,
    // the operation still reports success.
    expect(duplicated.owner).toBe('override-owner')
  })
})
