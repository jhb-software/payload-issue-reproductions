import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  collections: [Pages],
  experimental: { localizeStatus: true },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  secret: process.env.PAYLOAD_SECRET || 'repro-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    // Stores blocks as JSON, so keys that don't belong to a block are persisted as-is
    blocksAsJSON: true,
    client: { url: process.env.DATABASE_URI || 'file:./repro.db' },
  }),
})
