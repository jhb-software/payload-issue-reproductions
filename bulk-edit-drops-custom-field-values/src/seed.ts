import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  const { totalDocs: userCount } = await payload.count({ collection: 'users' })
  if (userCount > 0) {
    return
  }

  await payload.create({
    collection: 'users',
    data: { email: 'dev@example.com', password: 'test' },
  })

  for (const title of ['Page One', 'Page Two']) {
    await payload.create({ collection: 'pages', data: { title } })
  }
}
