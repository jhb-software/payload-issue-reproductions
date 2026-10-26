import { beforeAll, describe, expect, it } from 'vitest'

const publishedAt = '2026-10-26T00:00:00.000Z'
const later = '2026-10-26T00:10:00.000Z'

describe('bug 1: JSON key filter uses an unqualified column', () => {
  beforeAll(async () => {
    await payload.create({ collection: 'posts', data: { data: { publishedAt } } })
  })

  it('finds the post by a nested JSON key', async () => {
    // Expected: 1 doc. Actual: `column reference "data" is ambiguous`, because the generated
    // `jsonb_path_exists(data, ...)` also matches the `data` column of the `items` lateral join.
    const result = await payload.find({
      collection: 'posts',
      where: { 'data.publishedAt': { exists: true } },
    })

    expect(result.totalDocs).toBe(1)
  })
})

describe('bug 2: JSON key filter has no range operators', () => {
  beforeAll(async () => {
    await payload.create({ collection: 'pages', data: { data: { publishedAt } } })
  })

  it('control: equals works on the same key', async () => {
    const result = await payload.find({
      collection: 'pages',
      where: { 'data.publishedAt': { equals: publishedAt } },
    })

    expect(result.totalDocs).toBe(1)
  })

  it.each([
    ['less_than', later, 1],
    ['less_than_equal', publishedAt, 1],
    ['greater_than', later, 0],
    ['greater_than_equal', publishedAt, 1],
  ] as const)('%s compares the JSON key', async (operator, value, expected) => {
    // Expected: a working comparison. Actual: the operator is missing from `operatorMap` in
    // createJSONQuery, so the jsonpath becomes `(@ undefined "...")` and Postgres rejects it.
    const result = await payload.find({
      collection: 'pages',
      where: { 'data.publishedAt': { [operator]: value } },
    })

    expect(result.totalDocs).toBe(expected)
  })
})
