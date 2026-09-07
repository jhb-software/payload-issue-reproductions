'use client'

import { useField } from '@payloadcms/ui'
import React from 'react'

/**
 * A minimal custom field component of the same shape as plugin-seo's
 * MetaTitleComponent / MetaDescriptionComponent / MetaImageComponent:
 * it calls `useField()` without a `path`, relying on `FieldPathContext`.
 *
 * In the document edit view `RenderFields` provides that context, so this works.
 * In the bulk edit drawer `EditMany/DrawerContent` calls `RenderField` directly,
 * so there is no provider -- `useField()` resolves `path` to `undefined` and
 * `setValue` writes to the form-state key `undefined`, which the server discards.
 */
export const CustomTextField: React.FC = () => {
  const { setValue, value } = useField<string>()

  return (
    <div className="field-type text">
      <label className="field-label" htmlFor="field-customText">
        Custom Text (custom component)
      </label>
      <input
        id="field-customText"
        onChange={(e) => setValue(e.target.value)}
        type="text"
        value={(value as string) ?? ''}
      />
    </div>
  )
}
