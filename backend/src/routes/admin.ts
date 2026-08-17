import { Router } from 'express'
import { movies } from '../database/schema.js'
import { desc, eq, like, and, sql, asc, or } from 'drizzle-orm'
import { useRedis } from '../utils/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import { users } from '../database/schema.js'
import { useDb } from '../utils/db.js'

const router = Router()

// All admin routes require admin auth - already handled by middleware
router.use(requireAdmin)

// ---- Movies ----

// GET /api/admin/movies
router.get('/movies', async (req, res) => {
  const db = useDb()
  const query = req.query as any
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = (page - 1) * limit
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const status = typeof query.status === 'string' ? query.status : ''
  const source = typeof query.source === 'string' ? query.source : ''
  const type = typeof query.type === 'string' ? query.type : ''
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : ''
  const sortOrder = typeof query.sortOrder === 'string' ? query.sortOrder : 'desc'

  const conditions: any[] = []
  if (keyword) conditions.push(like(movies.name, `%${keyword}%`))
  if (status === 'active') conditions.push(eq(movies.active, true))
  else if (status === 'inactive') conditions.push(eq(movies.active, false))
  if (source) conditions.push(eq(movies.source, source))
  if (type) conditions.push(eq(movies.type, type))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const allowedSortColumns: Record<string, any> = {
    name: movies.name, views: movies.views, apiUpdatedAt: movies.apiUpdatedAt, active: movies.active,
  }

  const orderBy: any[] = []
  if (sortBy && allowedSortColumns[sortBy]) {
    const column = allowedSortColumns[sortBy]
    orderBy.push(sortOrder === 'asc' ? asc(column) : desc(column))
  } else {
    orderBy.push(desc(movies.apiUpdatedAt), desc(movies.year), desc(movies.syncedAt))
  }

  const [items, countResult] = await Promise.all([
    db.select().from(movies).where(whereClause).orderBy(...orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(movies).where(whereClause),
  ])

  const total = countResult[0]?.count ?? 0
  return res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
})

// DELETE /api/admin/movies
router.post('/movies', async (req, res) => {
  const db = useDb()
  await db.delete(movies)
  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}
  return res.json({ success: true })
})

// GET /api/admin/movies/:id
router.get('/movies/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: 'Thiếu ID phim' })

  const result = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!result.length) return res.status(404).json({ message: 'Không tìm thấy phim' })
  return res.json(result[0])
})

// PUT /api/admin/movies/:id
router.put('/movies/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  const body = req.body as any

  if (!id) return res.status(400).json({ message: 'Thiếu ID phim' })

  const existing = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy phim' })

  const updates: Record<string, any> = {}
  for (const field of ['customPoster', 'customThumb', 'customContent'] as const) {
    if (field in body) {
      updates[field] = typeof body[field] === 'string' && body[field].trim() ? body[field].trim() : null
    }
  }
  if ('customEpisodes' in body) {
    updates.customEpisodes = Array.isArray(body.customEpisodes) && body.customEpisodes.length
      ? body.customEpisodes.filter((ep: any) => ep.name?.trim())
      : null
  }
  if ('actors' in body) {
    updates.actors = Array.isArray(body.actors) && body.actors.length
      ? body.actors.filter((a: any) => a.name?.trim()).map((a: any) => ({
          name: a.name.trim(), originalName: a.originalName?.trim() || undefined,
          role: a.role?.trim() || undefined, avatar: a.avatar?.trim() || undefined,
        }))
      : null
  }
  if ('customServers' in body) {
    updates.customServers = Array.isArray(body.customServers) && body.customServers.length
      ? body.customServers.map((server: any) => ({
          name: server.name?.trim() || `Server ${body.customServers.indexOf(server) + 1}`,
          episodes: Array.isArray(server.episodes)
            ? server.episodes.filter((ep: any) => ep.linkEmbed?.trim() || ep.linkM3u8?.trim() || ep.name?.trim()).map((ep: any) => ({
                name: ep.name?.trim() || '', linkEmbed: ep.linkEmbed?.trim() || null, linkM3u8: ep.linkM3u8?.trim() || null,
              }))
            : [],
        }))
      : null
  }

  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Không có dữ liệu cập nhật' })

  await db.update(movies).set(updates).where(eq(movies.id, id))
  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}

  return res.json({ success: true, id })
})

// PATCH /api/admin/movies/:id
router.patch('/movies/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  const body = req.body as any

  if (!id) return res.status(400).json({ message: 'Thiếu ID phim' })

  const existing = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy phim' })

  const updates: Record<string, any> = {}
  if (typeof body.active === 'boolean') updates.active = body.active

  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Không có dữ liệu cập nhật' })

  await db.update(movies).set(updates).where(eq(movies.id, id))
  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}

  return res.json({ success: true, id, ...updates })
})

// DELETE /api/admin/movies/:id
router.delete('/movies/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: 'Thiếu ID phim' })

  const existing = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy phim' })

  await db.delete(movies).where(eq(movies.id, id))
  try {
    const redis = useRedis()
    const keys = await redis.keys('cinek:public:*')
    if (keys.length) await redis.del(...keys)
  } catch {}
  
  return res.json({ success: true, id })
})

// GET /api/admin/movies/:id/sources
router.get('/movies/:id/sources', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: 'Thiếu ID phim' })

  const result = await db.select().from(movies).where(eq(movies.id, id)).limit(1)
  if (!result.length) return res.status(404).json({ message: 'Không tìm thấy phim' })

  const movie = result[0]
  const sourceRefs = (movie.sources || []).filter((ref: any) => ref.source && ref.slug)

  if (!sourceRefs.length) return res.json({ movie, sources: [] })

  // Dynamically import detail fetchers
  const moviesUtils = await import('../utils/movies.js')
  const detailFetchers: Record<string, (slug: string) => Promise<any>> = {
    ophim: moviesUtils.getOphimDetail,
    nguonc: moviesUtils.getNguoncDetail,
    kkphim: moviesUtils.getKkphimDetail,
  }

  const results = await Promise.allSettled(
    sourceRefs.map((ref: any) => detailFetchers[ref.source as keyof typeof detailFetchers](ref.slug)),
  )

  const sourceServers: { source: string, slug: string, name: string, content: string, actors: any[], servers: any[] }[] = []
  results.forEach((result, index) => {
    const ref = sourceRefs[index]
    if (result.status === 'fulfilled') {
      sourceServers.push({
        source: ref.source, slug: ref.slug, name: ref.name || result.value.name,
        content: result.value.content || '', actors: result.value.actors || [],
        servers: (result.value.servers || []).map((server: any) => ({
          ...server, source: ref.source, sourceSlug: ref.slug,
        })),
      })
    }
  })

  return res.json({ movie, sources: sourceServers })
})

// ---- Sync ----

// POST /api/admin/sync
router.post('/sync', async (req, res) => {
  const db = useDb()
  const body = req.body as any
  const requestedSources = Array.isArray(body.sources) ? body.sources : ['ophim', 'nguonc', 'kkphim']
  const sources = requestedSources.filter((s: string) => ['ophim', 'nguonc', 'kkphim'].includes(s))

  if (!sources.length) return res.status(400).json({ message: 'Nguồn không hợp lệ' })

  const SYNC_PAGES = 10
  const DETAIL_CONCURRENCY = 5

  const moviesUtils = await import('../utils/movies.js')
  const fetchers: Record<string, (page: number) => Promise<any>> = {
    ophim: moviesUtils.getOphimKoreanMovies,
    nguonc: moviesUtils.getNguoncKoreanMovies,
    kkphim: moviesUtils.getKkphimKoreanMovies,
  }

  const detailFetchers: Record<string, (slug: string) => Promise<any>> = {
    ophim: moviesUtils.getOphimDetail,
    nguonc: moviesUtils.getNguoncDetail,
    kkphim: moviesUtils.getKkphimDetail,
  }

  const allMovies: any[] = []
  const sourceStats: Record<string, { fetched: number, error?: string }> = {}

  for (const sourceName of sources) {
    const fetcher = fetchers[sourceName]
    if (!fetcher) {
      sourceStats[sourceName] = { fetched: 0, error: 'Không tìm thấy fetcher' }
      continue
    }
    let fetched = 0
    for (let page = 1; page <= SYNC_PAGES; page++) {
      try {
        const result = await fetcher(page)
        for (const movie of result.items) allMovies.push({ ...movie, source: sourceName })
        fetched += result.items.length
        if (!result.items.length) break
      } catch (err: any) {
        sourceStats[sourceName] = { fetched, error: err?.message || `Lỗi ở trang ${page}` }
        break
      }
    }
    if (!sourceStats[sourceName]) sourceStats[sourceName] = { fetched }
  }

  // Enrich details
  const needDetail = allMovies.filter((m: any) => m.slug && (m.type !== 'single' || !m.actors))
  for (let i = 0; i < needDetail.length; i += DETAIL_CONCURRENCY) {
    const batch = needDetail.slice(i, i + DETAIL_CONCURRENCY)
    const results = await Promise.allSettled(batch.map((movie: any) => detailFetchers[movie.source]?.(movie.slug)))
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.episodeTotal) batch[idx].episodeTotal = result.value.episodeTotal
        if (result.value.actors) batch[idx].actors = result.value.actors
      }
    })
  }

  const grouped = moviesUtils.groupMovies(allMovies as any[])
  let created = 0
  let updated = 0

  for (const primary of grouped) {
    const sourceRefs = (primary.sources || []).map((ref: any) => ({ source: ref.source, slug: ref.slug, name: ref.name || primary.name }))
    const conditions = sourceRefs.filter((r: any) => r.source && r.slug)
      .map(ref => and(eq(movies.source, ref.source), eq(movies.slug, ref.slug)))

    let existing = null
    if (conditions.length) {
      const found = await db.select().from(movies).where(or(...conditions)).limit(1)
      if (found.length) existing = found[0]
    }
    if (!existing) {
      const nameConditions: any[] = [eq(movies.name, primary.name)]
      if (primary.year) nameConditions.push(eq(movies.year, primary.year))
      const byName = await db.select().from(movies).where(and(...nameConditions)).limit(1)
      if (byName.length) existing = byName[0]
    }

    const movieData = {
      name: primary.name, originName: primary.originName || null, thumb: primary.thumb || null,
      poster: primary.poster || null, year: primary.year || null, time: primary.time || null,
      episode: primary.episode || null, episodeTotal: primary.episodeTotal || null,
      quality: primary.quality || null, lang: primary.lang || null, type: primary.type || null,
      rating: primary.rating || null, categories: primary.categories || null,
      countries: primary.countries || null, actors: (primary as any).actors || null,
      sources: sourceRefs, apiUpdatedAt: primary.updatedAt ? new Date(primary.updatedAt) : null,
      syncedAt: new Date(),
    }

    if (existing) {
      await db.update(movies).set(movieData).where(eq(movies.id, existing.id))
      updated++
    } else {
      await db.insert(movies).values({ source: primary.source, slug: primary.slug, ...movieData, active: false })
      created++
    }
  }

  return res.json({ success: true, sources, total: allMovies.length, created, updated, sourceStats })
})

// ---- Stats ----

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const db = useDb()

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN ${movies.active} = true THEN 1 ELSE 0 END)`,
    inactive: sql<number>`SUM(CASE WHEN ${movies.active} = false THEN 1 ELSE 0 END)`,
    series: sql<number>`SUM(CASE WHEN ${movies.type} = 'series' THEN 1 ELSE 0 END)`,
    single: sql<number>`SUM(CASE WHEN ${movies.type} = 'single' THEN 1 ELSE 0 END)`,
    totalViews: sql<number>`COALESCE(SUM(${movies.views}), 0)`,
    ophim: sql<number>`SUM(CASE WHEN ${movies.source} = 'ophim' THEN 1 ELSE 0 END)`,
    nguonc: sql<number>`SUM(CASE WHEN ${movies.source} = 'nguonc' THEN 1 ELSE 0 END)`,
    kkphim: sql<number>`SUM(CASE WHEN ${movies.source} = 'kkphim' THEN 1 ELSE 0 END)`,
  }).from(movies)

  const topMovies = await db.select({ name: movies.name, views: movies.views, slug: movies.slug, source: movies.source })
    .from(movies).where(eq(movies.active, true)).orderBy(sql`${movies.views} DESC`).limit(5)

  return res.json({
    total: Number(stats?.total) || 0,
    active: Number(stats?.active) || 0,
    inactive: Number(stats?.inactive) || 0,
    series: Number(stats?.series) || 0,
    single: Number(stats?.single) || 0,
    totalViews: Number(stats?.totalViews) || 0,
    ophim: Number(stats?.ophim) || 0,
    nguonc: Number(stats?.nguonc) || 0,
    kkphim: Number(stats?.kkphim) || 0,
    topMovies: topMovies || [],
  })
})

// ---- Members ----

// GET /api/admin/thanh-vien
router.get('/thanh-vien', async (req, res) => {
  const db = useDb()
  const query = req.query as any
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''

  const whereClause = keyword ? like(users.name, `%${keyword}%`) : undefined

  const [items, countResult] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, avatar: users.avatar, active: users.active, createdAt: users.createdAt })
      .from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(100),
    db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause),
  ])

  return res.json({ items, total: countResult[0]?.count ?? 0 })
})

// PATCH /api/admin/thanh-vien/:id
router.patch('/thanh-vien/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)
  const body = req.body as any

  if (!id) return res.status(400).json({ message: 'Thiếu ID thành viên' })

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy thành viên' })

  const updates: Record<string, any> = {}
  if ('role' in body && ['admin', 'moderator', 'user'].includes(body.role)) updates.role = body.role
  if (typeof body.active === 'boolean') updates.active = body.active

  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Không có dữ liệu cập nhật' })

  await db.update(users).set(updates).where(eq(users.id, id))
  return res.json({ success: true, id, ...updates })
})

// DELETE /api/admin/thanh-vien/:id
router.delete('/thanh-vien/:id', async (req, res) => {
  const db = useDb()
  const id = Number(req.params.id)

  if (!id) return res.status(400).json({ message: 'Thiếu ID thành viên' })

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy thành viên' })

  if ((req as any).user?.id === id) {
    return res.status(400).json({ message: 'Không thể xoá chính mình' })
  }

  await db.delete(users).where(eq(users.id, id))
  return res.json({ success: true, id })
})

export default router
