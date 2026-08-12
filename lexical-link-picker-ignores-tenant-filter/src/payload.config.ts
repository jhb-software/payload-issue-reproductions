import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Tenants, Pages, Posts],
  editor: lexicalEditor(),
  secret: 'repro-secret-do-not-use-in-production',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: { url: 'file:./repro.db' },
  }),
  plugins: [
    multiTenantPlugin({
      collections: {
        pages: {},
        posts: {},
      },
      userHasAccessToAllTenants: () => true,
    }),
  ],
})
