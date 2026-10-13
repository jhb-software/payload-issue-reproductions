import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  // v4 enforces access control in the Local API by default
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  versions: {
    // v4 enables `localizeStatus` automatically for localized collections with drafts
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      // Not localized itself, but its blocks contain a localized field
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'alpha',
          fields: [
            { name: 'a', type: 'text' },
            { name: 'alphaLabel', type: 'text', localized: true },
          ],
        },
        {
          slug: 'beta',
          fields: [{ name: 'b', type: 'text' }],
        },
      ],
    },
    {
      // Not localized itself, but its rows contain a localized field
      name: 'items',
      type: 'array',
      fields: [
        { name: 'key', type: 'text' },
        { name: 'label', type: 'text', localized: true },
      ],
    },
  ],
}
