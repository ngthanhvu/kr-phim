import { movies } from '../database/schema'
import { desc, like, and, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = 24
  const offset = (page - 1) * limit
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''

  const cacheKey = `cinek:public:movies:${page}:${keyword}`

  try {
    const redis = useRedis()
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}

  const whereClause = keyword
    ? and(
      eq(movies.active, true),
      like(movies.name, `%${keyword}%`),
    )
    : eq(movies.active, true)

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(movies)
      .where(whereClause)
      .orderBy(desc(movies.syncedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(movies)
      .where(whereClause),
  ])

  const total = countResult[0]?.count ?? 0

  const result = {
    items: items.map(mapMovieToResponse),
    page,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    },
  }

  try {
    const redis = useRedis()
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
  } catch {}

  return result
})

function mapMovieToResponse(movie: any) {
  return {
    id: `${movie.source}:${movie.slug}`,
    source: movie.source,
    slug: movie.slug,
    name: movie.name,
    originName: movie.originName || '',
    thumb: movie.customThumb || movie.thumb || '',
    poster: movie.customPoster || movie.poster || '',
    year: movie.year || undefined,
    time: movie.time || undefined,
    episode: movie.episode || undefined,
    quality: movie.quality || undefined,
    lang: movie.lang || undefined,
    type: movie.type || undefined,
    rating: movie.rating || undefined,
    categories: movie.categories || [],
    countries: movie.countries || [],
    sources: movie.sources || [],
  }
}
