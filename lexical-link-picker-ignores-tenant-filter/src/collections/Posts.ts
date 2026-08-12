import type { CollectionConfig } from 'payload'
import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      // Control: a plain relationship field. The multi-tenant plugin walks the
      // collection's field tree and adds a tenant `filterOptions` to this one.
      name: 'relatedPage',
      type: 'relationship',
      relationTo: 'pages',
    },
    {
      // Control: default LinkFeature (no enabledCollections). The `doc` field keeps
      // its filterOptions, which read `pages.admin.baseFilter` — set by the
      // multi-tenant plugin — so the picker is tenant scoped.
      name: 'contentDefaultLinkFeature',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      // Bug: LinkFeature with enabledCollections. getBaseFields() sets
      // `filterOptions: null` on the `doc` field as soon as enabledCollections (or
      // disabledCollections) is passed, so nothing scopes the picker to the tenant.
      name: 'contentEnabledCollections',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures.filter((feature) => feature.key !== 'relationship'),
          LinkFeature({
            enabledCollections: ['pages'],
          }),
        ],
      }),
    },
  ],
}
