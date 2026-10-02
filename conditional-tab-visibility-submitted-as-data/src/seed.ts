import type { Payload } from 'payload'

export const seedUser = { email: 'dev@example.com', password: 'test' }

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs > 0) return

  await payload.create({ collection: 'users', data: seedUser })
}
