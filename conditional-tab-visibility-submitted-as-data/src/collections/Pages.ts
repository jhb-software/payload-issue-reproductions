import type { Block, CollectionConfig, Field } from 'payload'

/**
 * A tabs field whose second (named) tab has an `admin.condition`. Payload gives such a tab an `id`
 * derived from its schema path (e.g. `_index-2.extra`) and stores its visibility in form state under
 * that id, which ends up in the submitted data.
 */
const conditionalTabs: Field = {
  type: 'tabs',
  tabs: [
    { fields: [{ name: 'body', type: 'text' }], label: 'Main' },
    {
      name: 'extra',
      admin: { condition: (data) => Boolean(data?.showExtra) },
      fields: [{ name: 'note', type: 'text' }],
      label: 'Extra',
    },
  ],
}

export const Section: Block = {
  slug: 'section',
  fields: [
    // Same tabs as the first field of the block -> id `_index-0.extra`, relative to the block,
    // without the blocks field's path or the row index
    {
      type: 'tabs',
      tabs: [
        { fields: [{ name: 'heading', type: 'text' }], label: 'Main' },
        {
          name: 'extra',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.showExtra) },
          fields: [{ name: 'note', type: 'text' }],
          label: 'Extra',
        },
      ],
    },
    { name: 'showExtra', type: 'checkbox' },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'showExtra', type: 'checkbox' },
    // Third root field -> the conditional tab's id is `_index-2.extra`
    conditionalTabs,
    {
      name: 'layout',
      type: 'blocks',
      // Block defined in `config.blocks`, so it is sanitized on its own (see payload.config.ts)
      blockReferences: ['section'],
      blocks: [],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Expected: `data` only holds configured fields.
        // Actual: the admin's save request contains a stray root-level `_index-N: {}` key.
        const stray = Object.keys(data ?? {}).filter((key) => key.startsWith('_index-'))
        if (stray.length) throw new Error(`Unknown keys in data: ${stray.join(', ')}`)
        return data
      },
    ],
  },
}
