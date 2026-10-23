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

  it('marks the always-generated title field as read-only', async () => {
    const product = await createProduct()
    const variant = await payload.create({
      collection: 'variants',
      data: { _status: 'published', options: [small.id], product: product.id } as any,
    })

    // An edit to the title is silently discarded: the hook regenerates it on every save
    // (`options` is required, so it is always present)
    const updated = await payload.update({
      id: variant.id,
      collection: 'variants',
      data: { title: 'Edited title' },
    })
    expect(updated.title).toBe('Shirt — Small')

    const titleField = payload.collections.variants.config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )

    // Expected: the field is read-only, so the admin panel doesn't offer an edit that is thrown away
    // Actual: the field is editable, and its description ("This is populated by default") suggests
    // the generated value is only a default that can be overridden
    expect(titleField?.admin?.readOnly).toBe(true)
  })
})
