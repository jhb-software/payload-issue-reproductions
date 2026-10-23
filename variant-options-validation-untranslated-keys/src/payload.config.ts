import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export default buildConfig({
  collections: [{ slug: 'users', auth: true, fields: [] }],
  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess: isAdmin,
        adminOrPublishedStatus: () => true,
        isAdmin,
        isDocumentOwner: isAdmin,
      },
      customers: { slug: 'users' },
      products: {
        // The plugin's variant title hook reads `title` from the product, like the ecommerce template
        productsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: { ...defaultCollection.admin, useAsTitle: 'title' },
          fields: [{ name: 'title', type: 'text', required: true }, ...defaultCollection.fields],
        }),
        variants: true,
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'repro-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./repro.db' },
  }),
})
