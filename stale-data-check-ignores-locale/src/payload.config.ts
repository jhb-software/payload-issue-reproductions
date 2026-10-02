import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: { baseDir: path.resolve(dirname) },
    user: Users.slug,
  },
  collections: [Users, Pages],
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./repro.db' },
  }),
  experimental: { localizeStatus: true },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  onInit: seed,
  secret: process.env.PAYLOAD_SECRET || 'repro-secret-change-me',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
