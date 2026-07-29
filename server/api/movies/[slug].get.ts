import { movies } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import type { MovieDetail, NormalizedServer } from '../../utils/movies'

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
    thumb: movie.customThumb || movie.thumb || '',
    poster: movie.customPoster || movie.poster || '',
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

  return mapMovieToDetail(recordToUpdate)
})
