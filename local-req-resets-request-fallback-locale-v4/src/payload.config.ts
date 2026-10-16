import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Posts } from './collections/Posts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  collections: [Posts],
  endpoints: [
    {
      // A nested Local API call that passes `req` and names no locale or fallbackLocale
      handler: async (req) => {
        const fallbackBefore = req.fallbackLocale
        const { docs } = await req.payload.find({ collection: 'posts', req })

        return Response.json({
          fallbackAfter: req.fallbackLocale,
          fallbackBefore,
          title: docs[0]?.title ?? null,
        })
      },
      method: 'get',
      path: '/fallback-probe',
    },
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'de'],
  },
  secret: process.env.PAYLOAD_SECRET || 'repro-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./repro.db' },
  }),
})
