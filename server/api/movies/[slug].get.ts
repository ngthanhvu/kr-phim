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

  let recordToUpdate = existing.length ? existing[0] : null

  if (!recordToUpdate) {
    const fallback = await db
      .select()
      .from(movies)
      .where(and(eq(movies.slug, slug), eq(movies.active, true)))
      .limit(1)

    if (!fallback.length) {
      throw createError({ statusCode: 404, statusMessage: 'Phim không tồn tại hoặc đã bị ẩn' })
    }
    recordToUpdate = fallback[0]
  }

  const refs = parseSourceRefs(query.sources || query.srcs, query.source, slug)

  const detail = await getMovieDetailGroup(refs)

  if (detail.episodeTotal && recordToUpdate) {
    try {
      await db
        .update(movies)
        .set({ episodeTotal: detail.episodeTotal })
        .where(eq(movies.id, recordToUpdate.id))
    } catch {
    }
  }

  return detail
})
