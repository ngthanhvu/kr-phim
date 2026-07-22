<script setup lang="ts">
import { ChevronLeft, ChevronRight, Heart, Info, Play, Trash2 } from 'lucide-vue-next'
import type { WatchHistoryItem } from '~/composables/useWatchHistory'

const { data, pending, error } = useFetch('/api/movies', {
  query: {
    page: 1,
  },
  lazy: true,
  default: () => ({
    items: [],
    sources: [],
  }),
})

const { data: additionalData } = useFetch('/api/movies', {
  query: {
    page: 2,
  },
  lazy: true,
  default: () => ({
    items: [],
    sources: [],
  }),
})

const movies = computed(() => data.value?.items ?? [])
const additionalMovies = computed(() => additionalData.value?.items ?? [])
const homeCatalog = computed(() => uniqueHeroMovies([...movies.value, ...additionalMovies.value]))
const heroIndex = ref(0)
const heroSlides = computed(() => uniqueHeroMovies(movies.value).slice(0, 6))
const hero = computed(() => heroSlides.value[heroIndex.value] ?? movies.value[0])
const heroDetail = ref<any>(null)
const sourceStatus = computed(() => data.value?.sources ?? [])
const watchHistory = ref<WatchHistoryItem[]>([])
const {
  loadWatchHistory: fetchWatchHistory,
  clearWatchHistory: removeWatchHistory,
} = useWatchHistory()

let heroTimer: ReturnType<typeof setInterval> | undefined
const heroDetailCache = new Map<string, any>()

const heroDescription = computed(() => {
  const content = String(heroDetail.value?.content || '').trim()
  if (content) return content

  const fallback = [
    hero.value?.originName,
    hero.value?.time,
  ].filter(Boolean)

  return fallback.length ? fallback.join('. ') : 'Phim Hàn Quốc Vietsub mới cập nhật.'
})

function comparableMovieText(value?: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueHeroMovies(items: any[]) {
  const seen = new Set<string>()
  const uniqueItems: any[] = []

  for (const item of items) {
    const keys = [
      comparableMovieText(item.slug),
      comparableMovieText(item.originName),
      comparableMovieText(item.name),
    ].filter(Boolean)

    if (keys.some((key) => seen.has(key))) continue

    keys.forEach((key) => seen.add(key))
    uniqueItems.push(item)
  }

  return uniqueItems
}

function movieListKey(movie: any) {
  return comparableMovieText(movie?.originName || movie?.name || movie?.slug)
}

function withoutMovies(items: any[], excluded: any[]) {
  const excludedKeys = new Set(excluded.map(movieListKey))
  return items.filter((item) => !excludedKeys.has(movieListKey(item)))
}

function movieUpdateTime(movie: any) {
  return movie?.updatedAt ? new Date(movie.updatedAt).getTime() || 0 : 0
}

const topTrending = computed(() => [...homeCatalog.value]
  .filter((movie: any) => (movie.views || 0) > 0)
  .sort((a: any, b: any) => (Number(b.views) || 0) - (Number(a.views) || 0)
    || (Number(b.rating) || 0) - (Number(a.rating) || 0))
  .slice(0, 10))

const latestMovies = computed(() => withoutMovies(homeCatalog.value, topTrending.value)
  .sort((a: any, b: any) => movieUpdateTime(b) - movieUpdateTime(a))
  .slice(0, 12))

const seriesMovies = computed(() => withoutMovies(
  homeCatalog.value.filter((movie: any) => movie.type !== 'single'),
  [...topTrending.value, ...latestMovies.value],
).slice(0, 12))

const singleMovies = computed(() => withoutMovies(
  homeCatalog.value.filter((movie: any) => movie.type === 'single' || movie.episode === 'Full'),
  [...topTrending.value, ...latestMovies.value, ...seriesMovies.value],
).slice(0, 12))

const rows = computed(() => [
  {
    title: 'Mới cập nhật',
    to: '/phim',
    items: latestMovies.value,
  },
  {
    title: 'Phim bộ Hàn Quốc',
    to: '/phim?type=series',
    items: seriesMovies.value,
  },
  {
    title: 'Phim lẻ & đặc biệt',
    to: '/phim?type=single',
    items: singleMovies.value,
  },
])

function movieSourcesQuery(movie: any) {
  return (movie?.sources || [{ source: movie?.source, slug: movie?.slug }])
    .filter((source: any) => source.source && source.slug)
    .map((source: any) => `${source.source}:${source.slug}`)
    .join(',')
}

function movieLink(movie: any) {
  return {
    path: `/phim/${movie?.slug}`,
    query: {
      source: movie?.source,
      srcs: movieSourcesQuery(movie) || undefined,
    },
  }
}

function selectHero(index: number) {
  heroIndex.value = index
}

function nextHero() {
  if (!heroSlides.value.length) return
  heroIndex.value = (heroIndex.value + 1) % heroSlides.value.length
}

function previousHero() {
  if (!heroSlides.value.length) return
  heroIndex.value = (heroIndex.value - 1 + heroSlides.value.length) % heroSlides.value.length
}

function watchHistoryLink(item: WatchHistoryItem) {
  return {
    path: `/xem/${item.slug}`,
    query: {
      source: item.source,
      server: item.serverIndex || 0,
      ep: (item.episodeIndex || 0) + 1,
    },
  }
}

function formatWatchTime(seconds = 0) {
  const totalSeconds = Math.max(Math.floor(seconds), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function watchProgressPercent(item: WatchHistoryItem) {
  if (!item.durationSeconds || !item.progressSeconds) return 6
  return Math.min(Math.max((item.progressSeconds / item.durationSeconds) * 100, 6), 100)
}

function watchProgressLabel(item: WatchHistoryItem) {
  if (item.progressSeconds && item.durationSeconds) {
    return `${formatWatchTime(item.progressSeconds)} / ${formatWatchTime(item.durationSeconds)}`
  }

  if (item.progressSeconds) {
    return `${formatWatchTime(item.progressSeconds)} đã xem`
  }

  return item.episodeName || `Tập ${(item.episodeIndex || 0) + 1}`
}

async function loadWatchHistory() {
  if (!import.meta.client) return
  watchHistory.value = await fetchWatchHistory(12)
}

async function clearWatchHistory() {
  if (!import.meta.client) return
  await removeWatchHistory()
  watchHistory.value = []
}

watch(heroSlides, (slides) => {
  if (heroIndex.value >= slides.length) {
    heroIndex.value = 0
  }
})

watch(hero, async (currentHero) => {
  if (!currentHero?.slug) {
    heroDetail.value = null
    return
  }

  const cacheKey = `${currentHero.source}:${currentHero.slug}`
  if (heroDetailCache.has(cacheKey)) {
    heroDetail.value = heroDetailCache.get(cacheKey)
    return
  }

  heroDetail.value = null
  try {
    const detail = await $fetch(`/api/movies/${currentHero.slug}`, {
      query: {
        source: currentHero.source,
        srcs: movieSourcesQuery(currentHero) || undefined,
      },
    })
    heroDetailCache.set(cacheKey, detail)

    if (hero.value?.slug === currentHero.slug && hero.value?.source === currentHero.source) {
      heroDetail.value = detail
    }
  } catch {
    heroDetail.value = null
  }
}, { immediate: true })

onMounted(() => {
  heroTimer = setInterval(nextHero, 6500)
  loadWatchHistory()
  window.addEventListener('storage', loadWatchHistory)
})

onBeforeUnmount(() => {
  if (heroTimer) clearInterval(heroTimer)
  if (import.meta.client) window.removeEventListener('storage', loadWatchHistory)
})

useHead({
  title: 'CineK - Xem phim Hàn Quốc online',
  meta: [
    {
      name: 'description',
      content: 'Xem phim Hàn Quốc online tại CineK với kho phim bộ, phim lẻ, show mới cập nhật, hỗ trợ Vietsub, thuyết minh và lồng tiếng.',
    },
    {
      property: 'og:title',
      content: 'CineK - Xem phim Hàn Quốc online',
    },
    {
      property: 'og:description',
      content: 'Kho phim Hàn Quốc online mới cập nhật, trải nghiệm xem mượt trên điện thoại, máy tính bảng và desktop.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen overflow-hidden bg-black">
    <AppHeader />

    <section v-if="hero"
      class="relative h-155 min-h-155 overflow-hidden pt-20 sm:h-170 sm:min-h-170 sm:pt-24 lg:h-180 lg:min-h-190 lg:pt-0">
      <TransitionGroup name="hero-fade">
        <img v-for="(slide, index) in heroSlides" v-show="index === heroIndex" :key="`${slide.source}-${slide.slug}`"
          :src="slide.poster || slide.thumb" :alt="slide.name"
          class="absolute inset-0 h-full w-full object-cover object-center opacity-72 lg:object-[72%_center]">
      </TransitionGroup>

      <div class="absolute inset-0 bg-linear-to-r from-black via-black/76 to-black/14" />
      <div class="absolute inset-0 bg-linear-to-t from-black via-black/16 to-black/34" />

      <div
        class="relative mx-auto h-full max-w-390 px-4 pb-22 pt-20 sm:px-6 sm:pb-26 sm:pt-14 lg:px-8 lg:pb-0 lg:pt-38 xl:px-10">
        <div class="max-w-140">
          <h1 class="text-4xl font-black leading-tight text-white drop-shadow-2xl sm:text-5xl lg:text-[50px]">
            {{ hero.name }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm font-black text-yellow-300 sm:text-base">
            {{ hero.originName || 'Kho phim Hàn Vietsub mới cập nhật' }}
          </p>

          <div class="mt-4 flex flex-wrap gap-1.5 text-[13px] font-black text-white sm:gap-2">
            <span v-if="hero.rating"
              class="rounded-md bg-yellow-400 px-2.5 py-1.5 text-slate-950 shadow-lg shadow-yellow-950/30">
              TMDb {{ hero.rating.toFixed(1) }}
            </span>
            <span v-if="hero.quality" class="rounded-md border border-white/20 bg-white/15 px-2.5 py-1.5">
              {{ hero.quality }}
            </span>
            <span v-if="hero.lang" class="rounded-md border border-white/20 bg-white/15 px-2.5 py-1.5">
              {{ hero.lang }}
            </span>
            <span v-if="hero.year" class="rounded-md border border-white/20 bg-white/15 px-2.5 py-1.5">
              {{ hero.year }}
            </span>
            <span v-if="hero.episode" class="rounded-md border border-white/20 bg-white/15 px-2.5 py-1.5">
              {{ hero.episode }}
            </span>
          </div>

          <div v-if="hero.categories?.length" class="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black text-white">
            <span v-for="category in hero.categories.slice(0, 4)" :key="category"
              class="rounded-md bg-white/12 px-2.5 py-1.5 backdrop-blur">
              {{ category }}
            </span>
          </div>

          <p class="mt-6 line-clamp-3 max-w-130 text-base font-bold leading-7 text-white drop-shadow">
            {{ heroDescription }}
          </p>

          <div class="mt-9 flex items-center gap-3">
            <NuxtLink :to="movieLink(hero)"
              class="grid size-14 shrink-0 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-2xl shadow-yellow-950/50 transition hover:scale-105 hover:bg-yellow-300 sm:size-16"
              aria-label="Xem ngay">
              <Play class="ml-1 size-7 fill-current" />
            </NuxtLink>
            <button type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:size-11"
              aria-label="Yêu thích">
              <Heart class="size-4 sm:size-5" />
            </button>
            <NuxtLink :to="movieLink(hero)"
              class="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:size-11"
              aria-label="Thông tin phim">
              <Info class="size-4 sm:size-5" />
            </NuxtLink>
          </div>
        </div>

        <div
          class="absolute bottom-14 right-4 hidden max-w-[calc(100%-2rem)] items-center gap-3 sm:flex sm:right-6 lg:bottom-18 lg:right-8 xl:right-10">
          <button type="button"
            class="hidden size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15"
            aria-label="Phim trước" @click="previousHero">
            <ChevronLeft class="size-4 sm:size-5" />
          </button>

          <div class="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            <button v-for="(slide, index) in heroSlides" :key="`${slide.source}-${slide.slug}-thumb`" type="button"
              class="relative h-14.5 w-26 shrink-0 overflow-hidden rounded-md border bg-slate-900 shadow-lg shadow-black/30 transition"
              :class="index === heroIndex ? 'border-white ring-2 ring-white/40' : 'border-white/15 opacity-70 hover:opacity-100'"
              @click="selectHero(index)">
              <img :src="slide.thumb || slide.poster" :alt="slide.name" class="h-full w-full object-cover">
            </button>
          </div>

          <button type="button"
            class="hidden size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15"
            aria-label="Phim tiếp theo" @click="nextHero">
            <ChevronRight class="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </section>

    <section v-else-if="pending"
      class="mx-auto flex min-h-screen max-w-390 items-center px-4 pt-36 sm:px-6 lg:px-8 lg:pt-24 xl:px-10">
      <div class="w-full">
        <div class="h-12 w-4/5 animate-pulse rounded bg-white/10 sm:h-14" />
        <div class="mt-4 h-5 w-1/2 animate-pulse rounded bg-yellow-300/20" />
        <div class="mt-5 flex flex-wrap gap-2">
          <div class="h-8 w-16 animate-pulse rounded-md bg-yellow-300/20" />
          <div class="h-8 w-18 animate-pulse rounded-md bg-white/10" />
          <div class="h-8 w-14 animate-pulse rounded-md bg-white/10" />
          <div class="h-8 w-20 animate-pulse rounded-md bg-white/10" />
        </div>
        <div class="mt-8 space-y-3">
          <div class="h-4 animate-pulse rounded bg-white/10" />
          <div class="h-4 w-11/12 animate-pulse rounded bg-white/10" />
          <div class="h-4 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
        <div class="mt-9 flex items-center gap-3">
          <div class="size-14 animate-pulse rounded-full bg-yellow-300/25 sm:size-16" />
          <div class="size-10 animate-pulse rounded-full bg-white/10 sm:size-11" />
          <div class="size-10 animate-pulse rounded-full bg-white/10 sm:size-11" />
        </div>
      </div>
      <div class="hidden">
        <h1 class="text-4xl font-black text-white">CineK</h1>
        <p class="mt-3 text-slate-300">Đang tải kho phim Hàn Quốc...</p>
      </div>
    </section>

    <div class="relative z-10 mx-auto max-w-390 px-4 pb-16 pt-8 sm:px-6 lg:px-8 xl:px-10">
      <div v-if="sourceStatus.length" class="hidden">
        <span v-for="source in sourceStatus" :key="source.name"
          class="rounded-full border border-white/10 bg-white/8 px-3 py-1">
          {{ source.name }}: {{ source.ok ? 'sẵn sàng' : 'đang bị chặn' }}
        </span>
      </div>

      <p v-if="error" class="rounded-md border border-red-300/30 bg-red-500/12 p-4 text-red-100">
        Không tải được dữ liệu phim. Vui lòng thử lại sau.
      </p>

      <section v-if="topTrending.length" class="mb-12">
        <div class="mb-5 flex items-center gap-3">
          <h2 class="text-2xl font-black uppercase text-white">
            TOP 10 <span class="text-yellow-400">CineK</span>
          </h2>
          <span class="hidden text-xs font-black uppercase tracking-[0.35em] text-slate-500 sm:inline">
            Gợi ý nổi bật
          </span>
        </div>

        <div class="no-scrollbar -mx-4 ml-0.5 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:ml-0">
          <div v-for="(movie, index) in topTrending" :key="`${movie.source}-${movie.slug}-trending`"
            class="w-44 shrink-0 snap-start sm:w-52 xl:w-56">
            <HomeMovieCard :movie="movie" />
            <div class="mt-2 grid grid-cols-[2.2rem_1fr] gap-2">
              <span class="text-4xl font-black italic leading-none text-yellow-400">{{ index + 1 }}</span>
              <span class="min-w-0 pt-1">
                <span class="block truncate text-sm font-black text-white">{{ movie.name }}</span>
                <span class="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                  {{ movie.originName || movie.quality || movie.year }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="watchHistory.length" class="mb-12">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 class="text-2xl font-extrabold text-white">Tiếp tục xem</h2>
          <button type="button"
            class="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/8 text-white transition hover:border-yellow-400/60 hover:bg-white/14"
            aria-label="Xóa lịch sử xem" @click="clearWatchHistory">
            <Trash2 class="size-4" />
          </button>
        </div>

        <div class="no-scrollbar -mx-4 ml-0.5 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:ml-0">
          <NuxtLink v-for="item in watchHistory" :key="`${item.source}-${item.slug}`" :to="watchHistoryLink(item)"
            class="group block w-44 shrink-0 snap-start sm:w-52 xl:w-56">
            <div
              class="relative aspect-2/3 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-yellow-400/60">
              <img :src="item.thumb || item.poster" :alt="item.name"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
              <div class="absolute inset-x-0 bottom-0 h-1 bg-white/18">
                <span class="block h-full bg-yellow-400" :style="{ width: `${watchProgressPercent(item)}%` }" />
              </div>
              <span class="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-1 text-xs font-black text-slate-950">
                {{ item.episodeName || `Tập ${(item.episodeIndex || 0) + 1}` }}
              </span>
              <span
                class="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-[11px] font-black text-white opacity-0 transition group-hover:opacity-100">
                Xem tiếp
              </span>
            </div>
            <h3 class="mt-3 line-clamp-1 text-center text-sm font-black text-white">{{ item.name }}</h3>
            <p class="mt-1 truncate text-center text-xs font-semibold text-slate-400">
              {{ watchProgressLabel(item) }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="item in 12" :key="item" class="aspect-2/3 animate-pulse rounded-md bg-white/10" />
      </div>

      <section v-for="(row, index) in rows" v-show="row.items.length"
        :id="index === 0 ? 'latest' : index === 1 ? 'series' : 'movies'" :key="row.title" class="mb-12">
        <div class="mb-4 flex items-end justify-between gap-4">
          <h2 class="text-2xl font-extrabold text-white">{{ row.title }}</h2>
          <NuxtLink :to="row.to" class="text-sm font-semibold text-yellow-300 hover:text-white">
            Xem thêm
          </NuxtLink>
        </div>

        <div class="no-scrollbar -mx-4 ml-0.5 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:ml-0">
          <HomeMovieCard v-for="movie in row.items" :key="`${movie.source}-${movie.slug}`" :movie="movie" />
        </div>
      </section>
    </div>
  </main>
</template>
