import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
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
  collections: [Users, Media, Pages],
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./repro.db' },
  }),
  editor: lexicalEditor(),
  onInit: seed,
  plugins: [
    seoPlugin({
      collections: ['pages'],
      uploadsCollection: 'media',
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'repro-secret-change-me',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
