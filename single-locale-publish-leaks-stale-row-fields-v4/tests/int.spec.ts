import { describe, expect, it } from 'vitest'

describe('single-locale publish (v4)', () => {
  it('does not carry fields of the previous block at the same index into a new block', async () => {
    // Published in `en` with an `alpha` block at index 0
    const page = await payload.create({
      collection: 'pages',
      locale: 'en',
      data: {
        _status: 'published',
        title: 'Page',
        content: [{ blockType: 'alpha', a: 'from alpha', alphaLabel: 'alpha label' }],
      },
    })

    // Publish `en` again, replacing the `alpha` block with a `beta` block
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'en',
      data: {
        _status: 'published',
        content: [{ blockType: 'beta', b: 'from beta' }],
      },
    })

    const raw = await payload.db.findOne({
      collection: 'pages',
      where: { id: { equals: page.id } },
    })
    const block = (raw as any).content[0]

    console.log('stored block:', block)

    expect(block.blockType).toBe('beta')
    expect(block.b).toBe('from beta')
    // Expected: the `beta` block only has its own fields.
    // Actual: it inherits `a` and `alphaLabel` from the `alpha` block that was at index 0.
    expect(block).not.toHaveProperty('a')
    expect(block).not.toHaveProperty('alphaLabel')
  })

  it('keeps the other locale of an array row with that row when rows are reordered', async () => {
    const page = await payload.create({
      collection: 'pages',
      locale: 'en',
      data: {
        _status: 'published',
        title: 'Page',
        items: [
          { key: 'first', label: 'First' },
          { key: 'second', label: 'Second' },
        ],
      },
    })
    const [first, second] = page.items!

    // Add the `de` labels and publish `de`
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'de',
      data: {
        _status: 'published',
        title: 'Seite',
        items: [
          { id: first.id, key: 'first', label: 'Erste' },
          { id: second.id, key: 'second', label: 'Zweite' },
        ],
      },
    })

    // Swap the two rows and publish `en` only
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'en',
      data: {
        _status: 'published',
        items: [
          { id: second.id, key: 'second', label: 'Second' },
          { id: first.id, key: 'first', label: 'First' },
        ],
      },
    })

    const de = await payload.findByID({ collection: 'pages', id: page.id, locale: 'de' })

    console.log('de items after en publish:', de.items)

    // Expected: each row keeps its own `de` label.
    // Actual: the `de` labels stay at their index, so they end up on the wrong rows.
    expect(de.items!.map((row) => [row.key, row.label])).toEqual([
      ['second', 'Zweite'],
      ['first', 'Erste'],
    ])
  })
})
