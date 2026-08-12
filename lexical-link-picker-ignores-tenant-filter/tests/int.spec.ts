import type { PayloadRequest, RelationshipField, Where } from 'payload'
import { createLocalReq } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

let tenantA: number | string
let req: PayloadRequest

/**
 * Returns the `doc` relationship field of the LinkFeature of the given richText field
 * of the `posts` collection, as it ends up in the sanitized config.
 */
const getLinkDocField = (fieldName: string): RelationshipField => {
  const posts = payload.config.collections.find(({ slug }) => slug === 'posts')!
  const richTextField = posts.flattenedFields.find(
    (field) => 'name' in field && field.name === fieldName,
  ) as any

  const linkFeature = richTextField.editor.editorConfig.resolvedFeatureMap.get('link')
  const fields = (linkFeature.sanitizedServerFeatureProps ?? linkFeature).fields

  return fields.find((field: any) => field.name === 'doc') as RelationshipField
}

const runFilterOptions = async (field: RelationshipField): Promise<boolean | Where> => {
  if (typeof field.filterOptions !== 'function') {
    return field.filterOptions as boolean | Where
  }

  return (await field.filterOptions({
    blockData: undefined,
    data: {},
    relationTo: 'pages',
    req,
    siblingData: {},
    user: req.user,
  } as any)) as boolean | Where
}

beforeAll(async () => {
  const tenant = await payload.create({
    collection: 'tenants',
    data: { name: 'Tenant A' },
  })
  tenantA = tenant.id

  req = await createLocalReq({}, payload)
  // the admin tenant switcher stores the selected tenant in this cookie
  req.headers = new Headers({ cookie: `payload-tenant=${tenantA}` })
})

describe('tenant filtering of relationship pickers', () => {
  it('filters a plain relationship field by the selected tenant (control)', async () => {
    const posts = payload.config.collections.find(({ slug }) => slug === 'posts')!
    const relatedPage = posts.flattenedFields.find(
      (field) => 'name' in field && field.name === 'relatedPage',
    ) as RelationshipField

    expect(await runFilterOptions(relatedPage)).toEqual({ tenant: { in: [tenantA] } })
  })

  it('filters the lexical link picker of the default LinkFeature by the selected tenant (control)', async () => {
    const doc = getLinkDocField('contentDefaultLinkFeature')

    // filterOptions is set here and falls through to `pages.admin.baseFilter`,
    // which the multi-tenant plugin populates.
    expect(typeof doc.filterOptions).toBe('function')
    expect(await runFilterOptions(doc)).toEqual({ and: [{ tenant: { in: [tenantA] } }] })
  })

  it('filters the lexical link picker by the selected tenant when enabledCollections is set', async () => {
    const doc = getLinkDocField('contentEnabledCollections')

    // Currently FAILS: getBaseFields() sets `filterOptions: null` whenever
    // enabledCollections (or disabledCollections) is passed, so the picker lists
    // the pages of every tenant. The multi-tenant plugin cannot compensate — it
    // never recurses into richText fields.
    expect(doc.filterOptions).not.toBeNull()
    expect(await runFilterOptions(doc)).toEqual({ and: [{ tenant: { in: [tenantA] } }] })
  })
})
