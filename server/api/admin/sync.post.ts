import { movies } from '../../database/schema'
import { eq, and, or } from 'drizzle-orm'
import {
  getOphimKoreanMovies,
  getNguoncKoreanMovies,
  getKkphimKoreanMovies,
  getOphimDetail,
  getNguoncDetail,
  getKkphimDetail,
  groupMovies,
  type NormalizedMovie,
} from '../../utils/movies'

const SYNC_PAGES = 10
const ALL_SOURCES = ['ophim', 'nguonc', 'kkphim'] as const
const DETAIL_CONCURRENCY = 5

const detailFetchers = {
  ophim: getOphimDetail,
  nguonc: getNguoncDetail,
  kkphim: getKkphimDetail,
}

async function fetchMovieDetail(source: string, slug: string): Promise<{ episodeTotal?: string, actors?: { name: string, originalName?: string, role?: string, avatar?: string }[] } | undefined> {
  const fetcher = detailFetchers[source as keyof typeof detailFetchers]
  if (!fetcher) return undefined
  try {
    const detail = await fetcher(slug)
    return {
      episodeTotal: detail.episodeTotal || undefined,
      actors: detail.actors?.length ? detail.actors.map((a) => ({
        name: a.name,
        originalName: a.originalName,
        role: a.role,
        avatar: a.avatar,
      })) : undefined,
    }
  } catch {
    return undefined
  }
}

async function enrichMovieDetails(moviesList: any[]): Promise<void> {
  const moviesNeedDetail = moviesList.filter((m) => m.slug && (m.type !== 'single' || !m.actors))

  for (let i = 0; i < moviesNeedDetail.length; i += DETAIL_CONCURRENCY) {
    const batch = moviesNeedDetail.slice(i, i + DETAIL_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((movie) => fetchMovieDetail(movie.source, movie.slug)),
    )
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.episodeTotal) {
          batch[idx].episodeTotal = result.value.episodeTotal
        }
        if (result.value.actors) {
          batch[idx].actors = result.value.actors
        }
      }
    })
  }
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event).catch(() => ({})) || {}
  const requestedSources = Array.isArray(body.sources) ? body.sources : ALL_SOURCES
  const sources = requestedSources.filter((s: string) => ALL_SOURCES.includes(s as any))

  if (!sources.length) {
    throw createError({ statusCode: 400, message: 'Nguồn không hợp lệ' })
  }

  const allMovies: any[] = []
  const fetchers: Record<string, (page: number) => Promise<any>> = {
    ophim: getOphimKoreanMovies,
    nguonc: getNguoncKoreanMovies,
    kkphim: getKkphimKoreanMovies,
  }
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
        for (const movie of result.items) {
          allMovies.push({ ...movie, source: sourceName })
        }
        fetched += result.items.length
        if (!result.items.length) break
      } catch (err: any) {
        sourceStats[sourceName] = { fetched, error: err?.message || `Lỗi ở trang ${page}` }
        break
      }
    }
    if (!sourceStats[sourceName]) {
      sourceStats[sourceName] = { fetched }
    }
  }

  await enrichMovieDetails(allMovies)

  // Group movies across sources using the existing grouping logic
  const grouped = groupMovies(allMovies as NormalizedMovie[])

  let created = 0
  let updated = 0

  for (const primary of grouped) {
    const sourceRefs = (primary.sources || []).map((ref: any) => ({ source: ref.source, slug: ref.slug, name: ref.name || primary.name }))
    const sourceSlugConditions = sourceRefs
      .filter((ref: any) => ref.source && ref.slug)
      .map((ref: any) => and(eq(movies.source, ref.source), eq(movies.slug, ref.slug)))

    // Find existing record by any (source, slug) in the group, or same name/year
    let existing = null
    if (sourceSlugConditions.length) {
      const existingBySource = await db.select().from(movies).where(or(...sourceSlugConditions)).limit(1)
      if (existingBySource.length) existing = existingBySource[0]
    }

    if (!existing) {
      const nameConditions: any[] = [eq(movies.name, primary.name)]
      if (primary.year) nameConditions.push(eq(movies.year, primary.year))
      const existingByName = await db
        .select()
        .from(movies)
        .where(and(...nameConditions))
        .limit(1)
      if (existingByName.length) existing = existingByName[0]
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
      updated++
    } else {
      await db.insert(movies).values({
        source: primary.source,
        slug: primary.slug,
        ...movieData,
        active: false,
      })
      created++
    }
  }

  return {
    success: true,
    sources,
    total: allMovies.length,
    created,
    updated,
    sourceStats,
  }
})
