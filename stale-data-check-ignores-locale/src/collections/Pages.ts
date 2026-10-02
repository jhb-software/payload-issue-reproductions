import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', localized: true },
    {
      name: 'style',
      type: 'select',
      localized: true,
      options: ['default', 'card'],
    },
  ],
  versions: {
    // Drafts without autosave - the stale data check is skipped for autosave collections
    drafts: { localizeStatus: true },
  },
}
