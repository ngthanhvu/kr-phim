import { movies } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import {
  getOphimKoreanMovies,
  getNguoncKoreanMovies,
  getKkphimKoreanMovies,
  getOphimDetail,
  getNguoncDetail,
  getKkphimDetail,
} from '../../utils/movies'

const SYNC_PAGES = 10
const ALL_SOURCES = ['ophim', 'nguonc', 'kkphim'] as const
const DETAIL_CONCURRENCY = 5

const detailFetchers = {
  ophim: getOphimDetail,
  nguonc: getNguoncDetail,
  kkphim: getKkphimDetail,
}

async function fetchEpisodeTotal(source: string, slug: string): Promise<string | undefined> {
  const fetcher = detailFetchers[source as keyof typeof detailFetchers]
  if (!fetcher) return undefined
  try {
    const detail = await fetcher(slug)
    return detail.episodeTotal || undefined
  } catch {
    return undefined
  }
}

async function enrichWithEpisodeTotal(moviesList: any[]): Promise<void> {
  const moviesNeedTotal = moviesList.filter((m) => m.type !== 'single' && !m.episodeTotal && m.slug)

  for (let i = 0; i < moviesNeedTotal.length; i += DETAIL_CONCURRENCY) {
    const batch = moviesNeedTotal.slice(i, i + DETAIL_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((movie) => fetchEpisodeTotal(movie.source, movie.slug)),
    )
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        batch[idx].episodeTotal = result.value
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

  for (const sourceName of sources) {
    const fetcher = fetchers[sourceName]
    if (!fetcher) continue
    for (let page = 1; page <= SYNC_PAGES; page++) {
      try {
        const result = await fetcher(page)
        for (const movie of result.items) {
          allMovies.push({ ...movie, source: sourceName })
        }
        if (!result.items.length) break
      } catch {
        break
      }
    }
  }

  await enrichWithEpisodeTotal(allMovies)

  let created = 0
  let updated = 0

  for (const movie of allMovies) {
    const existing = await db
      .select()
      .from(movies)
      .where(and(eq(movies.source, movie.source), eq(movies.slug, movie.slug)))
      .limit(1)

    if (existing.length) {
      await db
        .update(movies)
        .set({
          name: movie.name,
          originName: movie.originName || null,
          thumb: movie.thumb || null,
          poster: movie.poster || null,
          year: movie.year || null,
          time: movie.time || null,
          episode: movie.episode || null,
          episodeTotal: movie.episodeTotal || null,
          quality: movie.quality || null,
          lang: movie.lang || null,
          type: movie.type || null,
          rating: movie.rating || null,
          categories: movie.categories || null,
          countries: movie.countries || null,
          sources: movie.sources || null,
          apiUpdatedAt: movie.updatedAt ? new Date(movie.updatedAt) : null,
          syncedAt: new Date(),
        })
        .where(eq(movies.id, existing[0].id))
      updated++
    } else {
      await db.insert(movies).values({
        source: movie.source,
        slug: movie.slug,
        name: movie.name,
        originName: movie.originName || null,
        thumb: movie.thumb || null,
        poster: movie.poster || null,
        year: movie.year || null,
        time: movie.time || null,
        episode: movie.episode || null,
        episodeTotal: movie.episodeTotal || null,
        quality: movie.quality || null,
        lang: movie.lang || null,
        type: movie.type || null,
        rating: movie.rating || null,
        categories: movie.categories || null,
        countries: movie.countries || null,
        sources: movie.sources || null,
        apiUpdatedAt: movie.updatedAt ? new Date(movie.updatedAt) : null,
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
  }
})
