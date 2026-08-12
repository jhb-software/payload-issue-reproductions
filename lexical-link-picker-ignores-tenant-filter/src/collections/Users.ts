import type { CollectionConfig } from 'payload'

/** The multi-tenant plugin adds the `tenants` array field to this collection. */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [],
}
