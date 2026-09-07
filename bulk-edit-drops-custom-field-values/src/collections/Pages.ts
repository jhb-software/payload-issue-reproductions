import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title' },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      // A plain text field rendered by a custom component that calls `useField()`
      // with no arguments -- exactly what @payloadcms/plugin-seo's Meta* components do.
      // Works in the document edit view, silently drops its value in the bulk edit drawer.
      name: 'customText',
      type: 'text',
      admin: {
        components: {
          Field: '/fields/CustomTextField#CustomTextField',
        },
      },
    },
  ],
}
