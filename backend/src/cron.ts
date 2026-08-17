import nodeCron from 'node-cron'
import { useDb } from './utils/db.js'

let cronJob: ReturnType<typeof nodeCron.schedule> | null = null

export function startCronSync() {
  const autoSyncEnabled = process.env.AUTO_SYNC === 'true'
  if (!autoSyncEnabled) {
    console.log('[Cron] Tự động đồng bộ bị tắt (AUTO_SYNC !== true).')
    return
  }

  const requestedSources = process.env.SYNC_SOURCES
    ? process.env.SYNC_SOURCES.split(',').map(s => s.trim()).filter(Boolean)
    : ['ophim', 'nguonc', 'kkphim']
  const validSources = requestedSources.filter(s => ['ophim', 'nguonc', 'kkphim'].includes(s))
  if (!validSources.length) {
    console.warn('[Cron] SYNC_SOURCES không hợp lệ, dùng tất cả nguồn.')
  }

  const pageLimit = Math.max(1, Number(process.env.SYNC_PAGE_LIMIT || 10) || 10)

  try {
    useDb()
  } catch (err: unknown) {
    console.error('[Cron] Không thể kết nối DB — bỏ qua cron:', String(err))
    return
  }

  async function runSync() {
    console.log('[Cron] ===== Bắt đầu đồng bộ phim =====')
    const t0 = Date.now()
    const db = useDb()

    const moviesUtils = await import('./utils/movies.js')
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

    const { movies } = await import('./database/schema.js')
    const { eq, and, or, desc, like, sql, asc } = await import('drizzle-orm')

    let totalFetched = 0
    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    const allMovies: any[] = []

    for (const sourceName of validSources) {
      const fetcher = fetchers[sourceName]
      if (!fetcher) continue

      let fetched = 0
      for (let page = 1; page <= pageLimit; page++) {
        try {
          const result = await fetcher(page)
          const items = result?.items ?? []
          for (const movie of items) allMovies.push({ ...movie, source: sourceName })
          fetched += items.length
          if (!items.length) break
        } catch (err: unknown) {
          errors.push(`${sourceName} trang ${page}: ${String(err)}`)
          break
        }
      }
      console.log(`[Cron] ${sourceName}: ${fetched} phim.`)
      totalFetched += fetched
    }

    if (!allMovies.length) {
      console.log('[Cron] Không lấy được phim nào từ API.')
      return
    }

    // Enrich details
    const needDetail = allMovies.filter((m: any) => m.slug && (m.type !== 'single' || !m.actors))
    const DETAIL_CONCURRENCY = 5
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

    // Group
    const grouped = moviesUtils.groupMovies(allMovies as any[])
    console.log(`[Cron] Tổng cộng ${grouped.length} nhóm phim duy nhất.`)

    // Upsert
    for (const primary of grouped) {
      const sourceRefs = (primary.sources || []).map((ref: any) => ({
        source: ref.source, slug: ref.slug, name: ref.name || primary.name,
      }))
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
        updatedCount++
      } else {
        await db.insert(movies).values({ source: primary.source, slug: primary.slug, ...movieData, active: false })
        createdCount++
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
    console.log(`[Cron] ===== Hoàn thành trong ${elapsed}s — tạo: ${createdCount}, cập nhật: ${updatedCount}, lỗi: ${errors.length} =====`)
  }

  const schedule = '0 0 * * *'
  cronJob = nodeCron.schedule(schedule, () => {
    void runSync().catch(err => console.error('[Cron] Cron error:', err))
  }, { scheduled: true, timezone: 'Asia/Ho_Chi_minh' })

  console.log(`[Cron] Đã đăng ký cron "${schedule}" (múi giờ Asia/Ho_Chi_minh). Chạy lúc 00:00 mỗi ngày.`)
}

export function stopCronSync() {
  if (cronJob) {
    cronJob.stop()
    console.log('[Cron] Đã dừng cron.')
  }
}
