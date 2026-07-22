import { movies } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { getMovieDetailGroup, parseSourceRefs } from '../../utils/movies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu slug phim' })
  }

  const source = typeof query.source === 'string' ? query.source : 'nguonc'
  const db = useDb()

  const existing = await db
    .select()
    .from(movies)
    .where(and(eq(movies.slug, slug), eq(movies.source, source), eq(movies.active, true)))
    .limit(1)

  if (!existing.length) {
    const fallback = await db
      .select()
      .from(movies)
      .where(and(eq(movies.slug, slug), eq(movies.active, true)))
      .limit(1)

    if (!fallback.length) {
      throw createError({ statusCode: 404, statusMessage: 'Phim không tồn tại hoặc đã bị ẩn' })
    }
  }

  const refs = parseSourceRefs(query.sources || query.srcs, query.source, slug)

  return await getMovieDetailGroup(refs)
})
