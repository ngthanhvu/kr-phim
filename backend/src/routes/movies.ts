import { Router } from 'express'
import { movies } from '../database/schema.js'
import { desc, like, and, eq, sql } from 'drizzle-orm'
import { proxyImageUrl } from '../utils/proxy-image.js'
import { useRedis } from '../utils/redis.js'
import { useDb } from '../utils/db.js'
import type { MovieDetail, NormalizedServer } from '../utils/movies.js'

const router = Router()

// GET /api/movies
router.get('/', async (req, res) => {
  const db = useDb()
  const query = req.query as any
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = 24
  const offset = (page - 1) * limit
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''

  const cacheKey = `cinek:public:movies:${page}:${keyword}`

  try {
    const redis = useRedis()
    const cached = await redis.get(cacheKey)
    if (cached) {
      return res.json(JSON.parse(cached))
    }
  } catch {}

  const whereClause = keyword
    ? and(eq(movies.active, true), like(movies.name, `%${keyword}%`))
    : eq(movies.active, true)

  const [items, countResult] = await Promise.all([
    db.select().from(movies).where(whereClause).orderBy(desc(movies.apiUpdatedAt), desc(movies.year), desc(movies.syncedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(movies).where(whereClause),
  ])

  const total = countResult[0]?.count ?? 0

  const result = {
    items: items.map(mapMovieToResponse),
    page,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
  }

  try {
    const redis = useRedis()
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
  } catch {}

  return res.json(result)
})

function mapMovieToResponse(movie: any) {
  return {
    id: `${movie.source}:${movie.slug}`,
    source: movie.source,
    slug: movie.slug,
    name: movie.name,
    originName: movie.originName || '',
    thumb: movie.customThumb ? proxyImageUrl(movie.customThumb) : proxyImageUrl(movie.thumb || ''),
    poster: movie.customPoster ? proxyImageUrl(movie.customPoster) : proxyImageUrl(movie.poster || ''),
    year: movie.year || undefined,
    time: movie.time || undefined,
    episode: movie.episode || undefined,
    episodeTotal: movie.episodeTotal || undefined,
    quality: movie.quality || undefined,
    lang: movie.lang || undefined,
    type: movie.type || undefined,
    rating: movie.rating || undefined,
    views: movie.views || 0,
    categories: movie.categories || [],
    countries: movie.countries || [],
    sources: movie.sources || [],
  }
}

// GET /api/movies/:slug
router.get('/:slug', async (req, res) => {
  const db = useDb()
  const slug = req.params.slug
  const query = req.query as any

  if (!slug) {
    return res.status(400).json({ message: 'Thiếu slug phim' })
  }

  const source = typeof query.source === 'string' ? query.source : 'nguonc'

  const existing = await db.select().from(movies).where(and(eq(movies.slug, slug), eq(movies.source, source), eq(movies.active, true))).limit(1)
  let recordToUpdate = existing.length ? existing[0] : null

  if (!recordToUpdate) {
    const fallback = await db.select().from(movies).where(and(eq(movies.slug, slug), eq(movies.active, true))).limit(1)
    if (!fallback.length) {
      return res.status(404).json({ message: 'Phim không tồn tại hoặc đã bị ẩn' })
    }
    recordToUpdate = fallback[0]
  }

  return res.json(mapMovieToDetail(recordToUpdate))
})

function mapCustomServers(movie: any): NormalizedServer[] {
  let raw = movie.customServers ?? movie.custom_servers
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { raw = null }
  }
  if (!Array.isArray(raw) || !raw.length) return []

  return raw.map((server: any) => ({
    name: String(server.name || 'Server'),
    source: movie.source,
    sourceSlug: movie.slug,
    episodes: (server.episodes || []).map((ep: any) => ({
      name: String(ep.name || ''),
      linkEmbed: ep.linkEmbed || undefined,
      linkM3u8: ep.linkM3u8 || undefined,
    })).filter((ep: any) => ep.linkEmbed || ep.linkM3u8 || ep.name),
  })).filter((server: any) => server.episodes.length)
}

function mapMovieToDetail(movie: any): MovieDetail {
  const servers = mapCustomServers(movie)
  return {
    id: `${movie.source}:${movie.slug}`,
    source: movie.source,
    name: movie.name,
    originName: movie.originName || '',
    slug: movie.slug,
    thumb: movie.customThumb ? proxyImageUrl(movie.customThumb) : proxyImageUrl(movie.thumb || ''),
    poster: movie.customPoster ? proxyImageUrl(movie.customPoster) : proxyImageUrl(movie.poster || ''),
    year: movie.year || undefined,
    time: movie.time || undefined,
    episode: movie.episode || undefined,
    episodeTotal: movie.episodeTotal || undefined,
    quality: movie.quality || undefined,
    lang: movie.lang || undefined,
    type: movie.type || undefined,
    rating: movie.rating || undefined,
    updatedAt: movie.apiUpdatedAt ? new Date(movie.apiUpdatedAt).toISOString() : undefined,
    categories: movie.categories || [],
    countries: movie.countries || [],
    sources: movie.sources || [],
    content: movie.customContent || movie.content || '',
    actors: movie.actors || [],
    directors: [],
    trailer: undefined,
    servers,
  }
}

// POST /api/movies/:slug/view
router.post('/:slug/view', async (req, res) => {
  const db = useDb()
  const slug = req.params.slug

  if (!slug) {
    return res.status(400).json({ message: 'Thiếu slug phim' })
  }

  const query = req.query as any
  const source = typeof query.source === 'string' ? query.source : ''

  const whereClause = source
    ? and(eq(movies.slug, slug), eq(movies.source, source), eq(movies.active, true))
    : and(eq(movies.slug, slug), eq(movies.active, true))

  await db.update(movies).set({ views: sql`${movies.views} + 1` }).where(whereClause)
  return res.json({ success: true })
})

export default router
