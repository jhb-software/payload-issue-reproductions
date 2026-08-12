import type { CollectionConfig } from 'payload'

/** Tenant-enabled collection that is the target of the internal links. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    // makes `pages` linkable by the default LinkFeature (control case)
    enableRichTextLink: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
