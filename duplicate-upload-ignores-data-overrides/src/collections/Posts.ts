import type { CollectionConfig } from 'payload'

/** Control collection: a non-upload collection, where `data` overrides are respected. */
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'owner',
      type: 'text',
    },
  ],
}
