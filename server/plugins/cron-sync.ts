import nodeCron from 'node-cron'
import { movies } from '../database/schema'
import { eq, and, or } from 'drizzle-orm'
import {
  getOphimKoreanMovies,
  getNguoncKoreanMovies,
  getKkphimKoreanMovies,
  groupMovies,
  type NormalizedMovie,
} from '../utils/movies'

const ALL_SOURCES = ['ophim', 'nguonc', 'kkphim'] as const
const DETAIL_CONCURRENCY = 5

const detailFetchers: Record<string, (slug: string) => Promise<any>> = {
  ophim: async (slug: string) => {
    const mod = await import('../utils/movies')
    return mod.getOphimDetail(slug)
  },
  nguonc: async (slug: string) => {
    const mod = await import('../utils/movies')
    return mod.getNguoncDetail(slug)
  },
  kkphim: async (slug: string) => {
    const mod = await import('../utils/movies')
    return mod.getKkphimDetail(slug)
  },
}

export default defineNitroPlugin((app) => {
  const autoSyncEnabled = process.env.AUTO_SYNC === 'true'
  if (!autoSyncEnabled) {
    console.log('[AutoSync] Tự động đồng bộ bị tắt (AUTO_SYNC !== true).')
    return
  }

  const requestedSources = process.env.SYNC_SOURCES
    ? process.env.SYNC_SOURCES.split(',').map(s => s.trim()).filter(Boolean)
    : [...ALL_SOURCES]
  const validSources = requestedSources.filter(s => ALL_SOURCES.includes(s as any))
  if (!validSources.length) {
    console.warn('[AutoSync] SYNC_SOURCES không hợp lệ, dùng tất cả nguồn.')
  }

  const pageLimit = Math.max(1, Number(process.env.SYNC_PAGE_LIMIT || 10) || 10)

  try {
    useDb()
  } catch (err: unknown) {
    console.error('[AutoSync] Không thể kết nối DB — bỏ qua cron:', String(err))
    return
  }

  const fetchers: Record<string, (page: number) => Promise<any>> = {
    ophim: getOphimKoreanMovies,
    nguonc: getNguoncKoreanMovies,
    kkphim: getKkphimKoreanMovies,
  }

  async function fetchMovieDetail(source: string, slug: string): Promise<{ episodeTotal?: string, actors?: { name: string, originalName?: string, role?: string, avatar?: string }[] } | undefined> {
    const fetcher = detailFetchers[source]
    if (!fetcher) return undefined
    try {
      const detail = await fetcher(slug)
      return {
        episodeTotal: detail.episodeTotal || undefined,
        actors: detail.actors?.length ? detail.actors.map(a => ({
          name: a.name,
          originalName: a.originalName,
          role: a.role,
          avatar: a.avatar,
        })) : undefined,
      }
    } catch { return undefined }
  }

  async function enrichMovieDetails(moviesList: any[]): Promise<void> {
    const needDetail = moviesList.filter(m => m.slug && (m.type !== 'single' || !m.actors))
    for (let i = 0; i < needDetail.length; i += DETAIL_CONCURRENCY) {
      const batch = needDetail.slice(i, i + DETAIL_CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map(movie => fetchMovieDetail(movie.source, movie.slug)),
      )
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          if (result.value.episodeTotal) batch[idx].episodeTotal = result.value.episodeTotal
          if (result.value.actors) batch[idx].actors = result.value.actors
        }
      })
    }
  }

  async function runSync() {
    console.log('[AutoSync] ===== Bắt đầu đồng bộ phim =====')
    const t0 = Date.now()
    const db = useDb()

    let totalFetched = 0
    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    // Phase 1: Fetch từ tất cả sources
    const allMovies: any[] = []

    for (const sourceName of validSources) {
      const fetcher = fetchers[sourceName]
      if (!fetcher) {
        console.warn(`[AutoSync] Không tìm thấy fetcher "${sourceName}".`)
        continue
      }

      let fetched = 0
      for (let page = 1; page <= pageLimit; page++) {
        try {
          console.log(`[AutoSync] ${sourceName} trang ${page}...`)
          const result = await fetcher(page)
          const items = result?.items ?? []
          for (const movie of items) {
            allMovies.push({ ...movie, source: sourceName })
          }
          fetched += items.length
          if (!items.length) break
        } catch (err: unknown) {
          const msg = `${sourceName} trang ${page}: ${String(err)}`
          console.error(`[AutoSync] Lỗi:`, msg)
          errors.push(msg)
          break
        }
      }
      console.log(`[AutoSync] ${sourceName}: ${fetched} phim.`)
      totalFetched += fetched
    }

    if (!allMovies.length) {
      console.log('[AutoSync] Không lấy được phim nào từ API.')
      console.log(`[AutoSync] Hoàn thành trong ${(Date.now() - t0) / 1000}s.`)
      return
    }

    // Phase 2: Enrich details
    console.log('[AutoSync] Đang làm giàu chi tiết phim...')
    await enrichMovieDetails(allMovies)

    // Phase 3: Group
    console.log('[AutoSync] Đang nhóm phim theo tên...')
    const grouped = groupMovies(allMovies as NormalizedMovie[])
    console.log(`[AutoSync] Tổng cộng ${grouped.length} nhóm phim duy nhất.`)

    // Phase 4: Upsert vào DB
    for (const primary of grouped) {
      const sourceRefs = (primary.sources || []).map((ref: any) => ({
        source: ref.source, slug: ref.slug, name: ref.name || primary.name,
      }))
      const conditions = sourceRefs
        .filter(r => r.source && r.slug)
        .map(ref => and(eq(movies.source, ref.source), eq(movies.slug, ref.slug)))

      // Find existing by (source, slug)
      let existing = null
      if (conditions.length) {
        const found = await db.select().from(movies).where(or(...conditions)).limit(1)
        if (found.length) existing = found[0]
      }

      // Fallback: find by name + year
      if (!existing) {
        const nameConditions: any[] = [eq(movies.name, primary.name)]
        if (primary.year) nameConditions.push(eq(movies.year, primary.year))
        const byName = await db.select().from(movies).where(and(...nameConditions)).limit(1)
        if (byName.length) existing = byName[0]
      }

      const movieData = {
        name: primary.name,
        originName: primary.originName || null,
        thumb: primary.thumb || null,
        poster: primary.poster || null,
        year: primary.year || null,
        time: primary.time || null,
        episode: primary.episode || null,
        episodeTotal: primary.episodeTotal || null,
        quality: primary.quality || null,
        lang: primary.lang || null,
        type: primary.type || null,
        rating: primary.rating || null,
        categories: primary.categories || null,
        countries: primary.countries || null,
        actors: (primary as any).actors || null,
        sources: sourceRefs,
        apiUpdatedAt: primary.updatedAt ? new Date(primary.updatedAt) : null,
        syncedAt: new Date(),
      }

      if (existing) {
        await db.update(movies).set(movieData).where(eq(movies.id, existing.id))
        updatedCount++
      } else {
        await db.insert(movies).values({
          source: primary.source,
          slug: primary.slug,
          ...movieData,
          active: false,
        })
        createdCount++
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
    console.log(`[AutoSync] ===== Hoàn thành trong ${elapsed}s — tạo: ${createdCount}, cập nhật: ${updatedCount}, lỗi: ${errors.length} =====`)
  }

  // Schedule at midnight local time
  const schedule = '0 0 * * *'
  const job = nodeCron.schedule(schedule, () => {
    void runSync().catch(err => {
      console.error('[AutoSync] Cron error:', err)
    })
  }, { scheduled: true, timezone: 'Asia/Ho_Chi_minh' })

  console.log(`[AutoSync] Đã đăng ký cron "${schedule}" ( múi giờ Asia/Ho_Chi_minh ). Chạy lúc 00:00 mỗi ngày.`)

  app.hooks.hook('close', async () => {
    job.stop()
    console.log('[AutoSync] Đã dừng cron.')
  })
})
