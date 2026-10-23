import { beforeAll, describe, expect, it } from 'vitest'

let sizeType: { id: number }
let small: { id: number }

// A published product "Shirt" with one variant type "Size" (option "Small")
const createProduct = async () => {
  const product = await payload.create({
    collection: 'products',
    data: { _status: 'published', enableVariants: true, title: 'Shirt', variantTypes: [sizeType.id] } as any,
  })
  return product
}

describe('variants collection title hook', () => {
  beforeAll(async () => {
    sizeType = (await payload.create({
      collection: 'variantTypes',
      data: { label: 'Size', name: 'size' } as any,
    })) as any
    small = (await payload.create({
      collection: 'variantOptions',
      data: { label: 'Small', value: 'small', variantType: sizeType.id } as any,
    })) as any
  })

  it('uses the latest draft of the product', async () => {
    const product = await createProduct()

    // Rename the product in a draft, as the admin panel's autosave does
    await payload.update({
      id: product.id,
      collection: 'products',
      data: { title: 'T-Shirt' },
      draft: true,
    })

    const variant = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id } as any,
      draft: true,
    })

    // Expected: "T-Shirt — Small" (the product as the editor currently sees it)
    // Actual: "Shirt — Small", the hook's findByID has no `draft: true` and reads the published product
    expect(variant.title).toBe('T-Shirt — Small')
  })

  it('updates the variant title when the product is renamed', async () => {
    const product = await createProduct()
    const variant = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id } as any,
    })
    expect(variant.title).toBe('Shirt — Small')

    await payload.update({
      id: product.id,
      collection: 'products',
      data: { _status: 'published', title: 'T-Shirt' } as any,
    })

    const reloaded = await payload.findByID({ id: variant.id, collection: 'variants' })

    // Expected: "T-Shirt — Small"
    // Actual: "Shirt — Small", the title is only generated when the variant itself is saved
    expect(reloaded.title).toBe('T-Shirt — Small')
  })

  it('keeps a manually entered title on create', async () => {
    const product = await createProduct()

    // The field description says "This is populated by default", implying it can be set by hand
    const variant = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id, title: 'Custom title' } as any,
    })

    // Expected: "Custom title"
    // Actual: "Shirt — Small", the hook overwrites `title` whenever `options` is set
    expect(variant.title).toBe('Custom title')
  })

  it('keeps a manually edited title on update', async () => {
    const product = await createProduct()
    const variant = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id } as any,
    })

    const updated = await payload.update({
      id: variant.id,
      collection: 'variants',
      data: { title: 'Edited title' },
    })

    // Expected: "Edited title"
    // Actual: "Shirt — Small"
    expect(updated.title).toBe('Edited title')
  })
})
