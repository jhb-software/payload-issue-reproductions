import type { CollectionConfig } from 'payload'

// Bug 1: a `json` field named `data` plus any field that is loaded through a lateral join
// (array, blocks, hasMany relationship, localized field, ...). The lateral subqueries name their
// output column `data`, which collides with the unqualified `data` in the generated where clause.
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    { name: 'data', type: 'json' },
    { name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] },
  ],
}
