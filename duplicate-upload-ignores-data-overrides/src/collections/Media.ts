import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  fields: [
    {
      name: 'owner',
      type: 'text',
    },
  ],
}
