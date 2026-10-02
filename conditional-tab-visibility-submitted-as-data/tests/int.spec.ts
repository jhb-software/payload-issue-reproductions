import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'
import { createLocalReq } from 'payload'
import { reduceFieldsToValues } from 'payload/shared'
import { describe, expect, it } from 'vitest'

/**
 * Builds form state the way the admin edit view does, then reduces it to the data the `Form`
 * component submits on save (`reduceFieldsToValues(fields, true)`).
 */
const getSubmittedData = async (data: Record<string, unknown>) => {
  const req = await createLocalReq({}, payload)
  const fields = payload.collections.pages.config.fields

  const formState = await fieldSchemasToFormState({
    collectionSlug: 'pages',
    data,
    fields,
    fieldSchemaMap: undefined,
    operation: 'create',
    permissions: true,
    preferences: { fields: {} },
    renderAllFields: false,
    req,
    schemaPath: 'pages',
    skipValidation: true,
  })

  return reduceFieldsToValues(formState, true)
}

describe('conditional tab visibility in submitted data', () => {
  it('does not submit a root-level tab visibility entry', async () => {
    const submitted = await getSubmittedData({ title: 'Hello' })

    // The tab's visibility is stored in form state as `_index-2.extra: { passesCondition }` without
    // `disableFormData`. Expected: only configured fields. Actual: `_index-2: {}` is included.
    expect(Object.keys(submitted).filter((key) => key.startsWith('_index-'))).toEqual([])
  })

  it('does not submit a root-level entry for a conditional tab inside a block', async () => {
    const submitted = await getSubmittedData({
      layout: [{ blockType: 'section', heading: 'Section' }],
      title: 'Hello',
    })

    // Expected: no `_index-0` key. Actual: `_index-0: {}` at the document root, not inside the row.
    expect(Object.keys(submitted).filter((key) => key.startsWith('_index-'))).toEqual([])
  })
})
