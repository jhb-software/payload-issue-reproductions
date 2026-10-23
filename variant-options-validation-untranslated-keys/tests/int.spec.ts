import { describe, expect, it } from 'vitest'

describe('variant options validation messages', () => {
  it('returns the translated message for a duplicate options combination', async () => {
    const size = await payload.create({ collection: 'variantTypes', data: { label: 'Size', name: 'size' } })
    const small = await payload.create({
      collection: 'variantOptions',
      data: { label: 'Small', value: 'small', variantType: size.id },
    })
    const product = await payload.create({
      collection: 'products',
      data: { _status: 'published', enableVariants: true, title: 'Shirt', variantTypes: [size.id] },
    })
    await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id },
    })

    // A second variant with the same options is rejected, which is correct
    const error = await payload
      .create({
        collection: 'variants',
        data: { _status: 'published', options: [small.id], product: product.id },
      })
      .catch((err) => err)

    // Expected: the plugin's English translation for `plugin-ecommerce:variantOptionsAlreadyExists`
    // Actual: the raw key "ecommerce:variantOptionsAlreadyExists" (and "key not found" is logged),
    // because the plugin registers its translations under `plugin-ecommerce`, not `ecommerce`
    expect(error.data.errors[0].message).toBe(
      'This variant combo is already in use by another variant. Please select different options.',
    )
  })
})
