import { describe, expect, it } from 'vitest'

describe('variants duplicate options check', () => {
  it("compares against the latest draft of the other variants' options", async () => {
    const size = await payload.create({ collection: 'variantTypes', data: { label: 'Size', name: 'size' } })
    const small = await payload.create({
      collection: 'variantOptions',
      data: { label: 'Small', value: 'small', variantType: size.id },
    })
    const large = await payload.create({
      collection: 'variantOptions',
      data: { label: 'Large', value: 'large', variantType: size.id },
    })
    const product = await payload.create({
      collection: 'products',
      data: { _status: 'published', enableVariants: true, title: 'Shirt', variantTypes: [size.id] },
    })

    // Variant A is published as "Small", then corrected to "Large" in a draft (not published yet)
    const variantA = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id },
    })
    await payload.update({
      id: variantA.id,
      collection: 'variants',
      data: { options: [large.id] },
      draft: true,
    })

    // Variant B is created as a draft with "Small", which no other variant uses any more
    const variantB = await payload.create({
      collection: 'variants',
      data: { options: [small.id], product: product.id },
      draft: true,
    })

    // Expected: publishing B succeeds, the latest version of A uses "Large"
    // Actual: "The following field is invalid: Variant options", the check reads A's published
    // options ("Small") because the product's `variants` join is loaded without `draft: true`
    await expect(
      payload.update({
        id: variantB.id,
        collection: 'variants',
        data: { _status: 'published' },
      }),
    ).resolves.toMatchObject({ _status: 'published' })
  })
})
