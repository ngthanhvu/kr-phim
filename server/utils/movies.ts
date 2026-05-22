type Source = 'ophim' | 'nguonc' | 'kkphim'
type SourceFilter = Source | 'all'

export interface NormalizedMovie {
  id: string
  source: Source
  name: string
  originName: string
  slug: string
  thumb: string
  poster: string
  year?: number
  time?: string
  episode?: string
  quality?: string
  lang?: string
  type?: string
  rating?: number
  updatedAt?: string
  categories: string[]
  countries: string[]
}

export interface NormalizedEpisode {
  name: string
  slug?: string
  linkEmbed?: string
  linkM3u8?: string
}

export interface NormalizedServer {
  name: string
  episodes: NormalizedEpisode[]
}

export interface NormalizedActor {
  name: string
  originalName?: string
  role?: string
  avatar?: string
}

export interface MovieDetail extends NormalizedMovie {
  content: string
  actors: NormalizedActor[]
  directors: string[]
  trailer?: string
  servers: NormalizedServer[]
}

const OPHIM_BASE = 'https://ophim1.com'
const OPHIM_IMAGE = 'https://img.ophim.live/uploads/movies/'
const NGUONC_BASE = 'https://phim.nguonc.com'
const KKPHIM_BASE = 'https://phimapi.com'
const KKPHIM_IMAGE = 'https://phimimg.com/'
const SOURCE_NAMES: Source[] = ['ophim', 'nguonc', 'kkphim']

function toArray<T>(value: T[] | T | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function joinImage(base: string, path?: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanBase}${cleanPath}`
}

function joinOphimImage(base: string, path?: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path

  const url = new URL(base)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const basePath = url.pathname.replace(/\/$/, '')

  if (cleanPath.startsWith('uploads/')) {
    url.pathname = cleanPath
  } else if (basePath.includes('/uploads/movies')) {
    url.pathname = `${basePath}/${cleanPath}`
  } else {
    url.pathname = `/uploads/movies/${cleanPath}`
  }

  return url.toString()
}

function joinKkphimImage(base: string, path?: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path

  const url = new URL(base)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const basePath = url.pathname.replace(/\/$/, '')
  url.pathname = basePath && basePath !== '/' ? `${basePath}/${cleanPath}` : cleanPath

  return url.toString()
}

function includesKorea(movie: any) {
  const countries = toArray(movie?.country ?? movie?.countries ?? movie?.quoc_gia)
  if (!countries.length) return true

  return countries.some((country: any) => {
    const slug = text(country?.slug ?? country).toLowerCase()
    const name = text(country?.name ?? country).toLowerCase()
    return slug === 'han-quoc' || name.includes('hàn quốc') || name.includes('han quoc')
  })
}

function stripHtml(value?: string) {
  return text(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSource(value: unknown): value is Source {
  return typeof value === 'string' && SOURCE_NAMES.includes(value as Source)
}

function interleaveMovies(groups: NormalizedMovie[][]) {
  const maxLength = Math.max(0, ...groups.map((items) => items.length))
  const interleaved: NormalizedMovie[] = []

  for (let index = 0; index < maxLength; index += 1) {
    for (const items of groups) {
      const movie = items[index]
      if (movie) interleaved.push(movie)
    }
  }

  return interleaved
}

function uniqueMovies(items: NormalizedMovie[]) {
  const seen = new Set<string>()

  return items.filter((movie) => {
    const key = `${movie.source}:${movie.slug || movie.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeActor(actor: any): NormalizedActor | undefined {
  if (typeof actor === 'string') {
    const name = actor.trim()
    return name ? { name } : undefined
  }

  const name = text(actor?.name || actor?.actor_name || actor?.title).trim()
  if (!name) return undefined

  return {
    name,
    originalName: text(actor?.original_name || actor?.origin_name || actor?.real_name) || undefined,
    role: text(actor?.role || actor?.character || actor?.as || actor?.cast_name) || undefined,
    avatar: joinImage('', actor?.avatar || actor?.image || actor?.thumb_url || actor?.poster_url) || undefined,
  }
}

export function normalizeOphimMovie(movie: any, pathImage = OPHIM_IMAGE): NormalizedMovie {
  return {
    id: `ophim:${movie?._id ?? movie?.slug}`,
    source: 'ophim',
    name: text(movie?.name, 'Chưa có tên'),
    originName: text(movie?.origin_name),
    slug: text(movie?.slug),
    thumb: joinOphimImage(pathImage, movie?.thumb_url),
    poster: joinOphimImage(pathImage, movie?.poster_url || movie?.thumb_url),
    year: Number(movie?.year) || undefined,
    time: text(movie?.time),
    episode: text(movie?.episode_current),
    quality: text(movie?.quality),
    lang: text(movie?.lang),
    type: text(movie?.type),
    rating: Number(movie?.tmdb?.vote_average || movie?.imdb?.vote_average) || undefined,
    updatedAt: text(movie?.modified?.time || movie?.created),
    categories: toArray(movie?.category).map((item: any) => text(item?.name)).filter(Boolean),
    countries: toArray(movie?.country).map((item: any) => text(item?.name)).filter(Boolean),
  }
}

export function normalizeKkphimMovie(movie: any, pathImage = KKPHIM_IMAGE): NormalizedMovie {
  return {
    id: `kkphim:${movie?._id ?? movie?.slug}`,
    source: 'kkphim',
    name: text(movie?.name, 'ChÆ°a cÃ³ tÃªn'),
    originName: text(movie?.origin_name),
    slug: text(movie?.slug),
    thumb: joinKkphimImage(pathImage, movie?.thumb_url),
    poster: joinKkphimImage(pathImage, movie?.poster_url || movie?.thumb_url),
    year: Number(movie?.year) || undefined,
    time: text(movie?.time),
    episode: text(movie?.episode_current),
    quality: text(movie?.quality),
    lang: text(movie?.lang),
    type: text(movie?.type),
    rating: Number(movie?.tmdb?.vote_average || movie?.imdb?.vote_average) || undefined,
    updatedAt: text(movie?.modified?.time || movie?.created),
    categories: toArray(movie?.category).map((item: any) => text(item?.name)).filter(Boolean),
    countries: toArray(movie?.country).map((item: any) => text(item?.name)).filter(Boolean),
  }
}

function normalizeNguoncMovie(movie: any): NormalizedMovie {
  const image = movie?.thumb_url || movie?.poster_url || movie?.image || movie?.thumbnail

  return {
    id: `nguonc:${movie?._id ?? movie?.slug}`,
    source: 'nguonc',
    name: text(movie?.name || movie?.title, 'Chưa có tên'),
    originName: text(movie?.original_name || movie?.origin_name),
    slug: text(movie?.slug),
    thumb: joinImage('', image),
    poster: joinImage('', movie?.poster_url || image),
    year: Number(movie?.year || movie?.release_year) || undefined,
    time: text(movie?.time || movie?.duration),
    episode: text(movie?.episode_current || movie?.current_episode),
    quality: text(movie?.quality),
    lang: text(movie?.language || movie?.lang),
    type: text(movie?.type),
    rating: Number(movie?.rating) || undefined,
    updatedAt: text(movie?.modified || movie?.created),
    categories: toArray(movie?.category || movie?.categories).map((item: any) => text(item?.name ?? item)).filter(Boolean),
    countries: toArray(movie?.country || movie?.countries).map((item: any) => text(item?.name ?? item)).filter(Boolean),
  }
}

async function requestJson<T>(url: string): Promise<T> {
  return await $fetch<T>(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'KR-Phim/1.0',
    },
    retry: 0,
    timeout: 12000,
  })
}

export async function getOphimKoreanMovies(page: number, keyword = '') {
  const url = keyword
    ? new URL('/v1/api/tim-kiem', OPHIM_BASE)
    : new URL('/v1/api/quoc-gia/han-quoc', OPHIM_BASE)

  url.searchParams.set('page', String(page))
  if (keyword) {
    url.searchParams.set('keyword', keyword)
    url.searchParams.set('country', 'han-quoc')
  }

  const json: any = await requestJson(url.toString())
  const data = json?.data ?? json
  const imageBase = data?.APP_DOMAIN_CDN_IMAGE || data?.pathImage || OPHIM_IMAGE
  const items = toArray(data?.items ?? json?.items)
    .filter(includesKorea)
    .map((item) => normalizeOphimMovie(item, imageBase))
    .filter((movie) => movie.slug)

  return {
    items,
    pagination: data?.params?.pagination ?? data?.pagination ?? json?.pagination ?? {},
  }
}

export async function getNguoncKoreanMovies(page: number, keyword = '') {
  const url = keyword
    ? new URL('/api/films/search', NGUONC_BASE)
    : new URL('/api/films/quoc-gia/han-quoc', NGUONC_BASE)

  if (keyword) {
    url.searchParams.set('keyword', keyword)
  } else {
    url.searchParams.set('page', String(page))
  }

  const json: any = await requestJson(url.toString())
  const data = json?.data ?? json
  const items = toArray(data?.items ?? data?.films ?? json?.items)
    .filter(includesKorea)
    .map(normalizeNguoncMovie)
    .filter((movie) => movie.slug)

  return {
    items,
    pagination: data?.pagination ?? json?.pagination ?? {},
  }
}

export async function getKkphimKoreanMovies(page: number, keyword = '') {
  const url = keyword
    ? new URL('/v1/api/tim-kiem', KKPHIM_BASE)
    : new URL('/v1/api/quoc-gia/han-quoc', KKPHIM_BASE)

  url.searchParams.set('page', String(page))
  if (keyword) {
    url.searchParams.set('keyword', keyword)
    url.searchParams.set('country', 'han-quoc')
  }

  const json: any = await requestJson(url.toString())
  const data = json?.data ?? json
  const imageBase = data?.APP_DOMAIN_CDN_IMAGE || data?.pathImage || KKPHIM_IMAGE
  const items = toArray(data?.items ?? json?.items)
    .filter(includesKorea)
    .map((item) => normalizeKkphimMovie(item, imageBase))
    .filter((movie) => movie.slug)

  return {
    items,
    pagination: data?.params?.pagination ?? data?.pagination ?? json?.pagination ?? {},
  }
}

export async function getKoreanMovies(page: number, keyword = '', source: SourceFilter = 'all') {
  const fetchers = {
    ophim: getOphimKoreanMovies,
    nguonc: getNguoncKoreanMovies,
    kkphim: getKkphimKoreanMovies,
  }
  const selectedSources = isSource(source) ? [source] : SOURCE_NAMES
  const results = await Promise.allSettled(
    selectedSources.map((sourceName) => fetchers[sourceName](page, keyword)),
  )

  const resultGroups = results.map((result) => result.status === 'fulfilled' ? result.value.items : [])
  const items = source === 'all' ? interleaveMovies(resultGroups) : resultGroups.flat()
  const unique = uniqueMovies(items)

  const pagination = results.find((result) => result.status === 'fulfilled')?.value.pagination ?? {}

  return {
    items: unique,
    page,
    pagination,
    sources: results.map((result, index) => ({
      name: selectedSources[index],
      ok: result.status === 'fulfilled',
    })),
    source,
  }
}

export async function getOphimDetail(slug: string): Promise<MovieDetail> {
  const json: any = await requestJson(`${OPHIM_BASE}/v1/api/phim/${slug}`)
  const data = json?.data ?? json
  const movie = data?.item ?? data?.movie ?? json?.movie ?? json?.item
  const imageBase = data?.APP_DOMAIN_CDN_IMAGE || data?.pathImage || OPHIM_IMAGE
  const normalized = normalizeOphimMovie(movie, imageBase)

  return {
    ...normalized,
    content: stripHtml(movie?.content),
    actors: toArray(movie?.actor).map(normalizeActor).filter(Boolean) as NormalizedActor[],
    directors: toArray(movie?.director).map((item) => text(item)).filter(Boolean),
    trailer: text(movie?.trailer_url),
    servers: toArray(data?.episodes ?? json?.episodes ?? movie?.episodes).map((server: any) => ({
      name: text(server?.server_name, 'Server'),
      episodes: toArray(server?.server_data).map((episode: any) => ({
        name: text(episode?.name, 'Tập phim'),
        slug: text(episode?.slug),
        linkEmbed: text(episode?.link_embed),
        linkM3u8: text(episode?.link_m3u8),
      })),
    })),
  }
}

export async function getNguoncDetail(slug: string): Promise<MovieDetail> {
  const json: any = await requestJson(`${NGUONC_BASE}/api/film/${slug}`)
  const movie = json?.movie ?? json?.item ?? json?.data?.item ?? json?.data?.movie ?? json
  const normalized = normalizeNguoncMovie(movie)

  return {
    ...normalized,
    content: stripHtml(movie?.content || movie?.description),
    actors: toArray(movie?.actor || movie?.actors).map(normalizeActor).filter(Boolean) as NormalizedActor[],
    directors: toArray(movie?.director || movie?.directors).map((item: any) => text(item?.name ?? item)).filter(Boolean),
    trailer: text(movie?.trailer_url || movie?.trailer),
    servers: toArray(movie?.episodes ?? json?.episodes ?? json?.data?.episodes).map((server: any) => ({
      name: text(server?.server_name || server?.name, 'Server'),
      episodes: toArray(server?.server_data ?? server?.items ?? server?.episodes).map((episode: any) => ({
        name: text(episode?.name || episode?.title, 'Tập phim'),
        slug: text(episode?.slug),
        linkEmbed: text(episode?.link_embed || episode?.embed),
        linkM3u8: text(episode?.link_m3u8 || episode?.m3u8),
      })),
    })),
  }
}

export async function getKkphimDetail(slug: string): Promise<MovieDetail> {
  const json: any = await requestJson(`${KKPHIM_BASE}/phim/${slug}`)
  const data = json?.data ?? json
  const movie = data?.item ?? data?.movie ?? json?.movie ?? json?.item
  const imageBase = data?.APP_DOMAIN_CDN_IMAGE || data?.pathImage || KKPHIM_IMAGE
  const normalized = normalizeKkphimMovie(movie, imageBase)

  return {
    ...normalized,
    content: stripHtml(movie?.content),
    actors: toArray(movie?.actor).map(normalizeActor).filter(Boolean) as NormalizedActor[],
    directors: toArray(movie?.director).map((item) => text(item)).filter(Boolean),
    trailer: text(movie?.trailer_url),
    servers: toArray(data?.episodes ?? json?.episodes ?? movie?.episodes).map((server: any) => ({
      name: text(server?.server_name, 'Server'),
      episodes: toArray(server?.server_data).map((episode: any) => ({
        name: text(episode?.name, 'Táº­p phim'),
        slug: text(episode?.slug),
        linkEmbed: text(episode?.link_embed),
        linkM3u8: text(episode?.link_m3u8),
      })),
    })),
  }
}
