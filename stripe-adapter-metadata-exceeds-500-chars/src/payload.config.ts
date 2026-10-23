import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
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
      carts: { allowGuestCarts: true },
      customers: { slug: 'users' },
      products: true,
      payments: {
        paymentMethods: [
          stripeAdapter({
            publishableKey: 'pk_test_dummy',
            // `stripe` is mocked in the test, no request leaves the process
            secretKey: 'sk_test_dummy',
            webhookSecret: 'whsec_dummy',
          }),
        ],
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
