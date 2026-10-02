import type { Payload } from 'payload'

export const seedUser = { email: 'dev@example.com', password: 'test' }

/**
 * Creates a page that is published in both locales, then saves a newer draft in `de` only.
 */
export const seedPage = async (payload: Payload) => {
  const page = await payload.create({
    collection: 'pages',
    data: { _status: 'published', style: 'default', title: 'English title' },
    locale: 'en',
  })

  await payload.update({
    id: page.id,
    collection: 'pages',
    data: { _status: 'published', style: 'default', title: 'German title' },
    locale: 'de',
  })

  await payload.update({
    id: page.id,
    collection: 'pages',
    data: { _status: 'draft', title: 'German title (draft)' },
    draft: true,
    locale: 'de',
  })

  return page
}

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs > 0) return

  await payload.create({ collection: 'users', data: seedUser })
  const page = await seedPage(payload)

  payload.logger.info(`Seeded page ${page.id} - open it in the "de" locale`)
}
