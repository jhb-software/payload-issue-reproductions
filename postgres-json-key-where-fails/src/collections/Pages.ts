import type { CollectionConfig } from 'payload'

// Bug 2: only a `json` field, no joins, so the ambiguous-column bug cannot hide the operator bug.
export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [{ name: 'data', type: 'json' }],
}
