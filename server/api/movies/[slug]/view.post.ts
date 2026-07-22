import { movies } from '../../../database/schema'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Thiếu slug phim' })
  }

  const query = getQuery(event)
  const source = typeof query.source === 'string' ? query.source : ''

  const db = useDb()

  const whereClause = source
    ? and(eq(movies.slug, slug), eq(movies.source, source), eq(movies.active, true))
    : and(eq(movies.slug, slug), eq(movies.active, true))

  await db
    .update(movies)
    .set({ views: sql`${movies.views} + 1` })
    .where(whereClause)

  return { success: true }
})
