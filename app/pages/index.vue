<script setup lang="ts">
import { BookPlus, ChevronLeft, ChevronRight, Heart, Info, Play, Trash2 } from 'lucide-vue-next'
import type { WatchHistoryItem } from '~/composables/useWatchHistory'

const { data, pending, error } = await useFetch('/api/movies', {
  query: {
    page: 1,
  },
})

const movies = computed(() => data.value?.items ?? [])
const heroIndex = ref(0)
const heroSlides = computed(() => uniqueHeroMovies(movies.value).slice(0, 6))
const hero = computed(() => heroSlides.value[heroIndex.value] ?? movies.value[0])
const heroDetail = ref<any>(null)
const sourceStatus = computed(() => data.value?.sources ?? [])
const watchHistory = ref<WatchHistoryItem[]>([])
const { user, initAuth } = useSupabaseAuth()
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
  initAuth()
  heroTimer = setInterval(nextHero, 6500)
  loadWatchHistory()
  window.addEventListener('storage', loadWatchHistory)
})

onBeforeUnmount(() => {
  if (heroTimer) clearInterval(heroTimer)
  if (import.meta.client) window.removeEventListener('storage', loadWatchHistory)
})

async function loadWatchHistory() {
  if (!import.meta.client) return
  watchHistory.value = await fetchWatchHistory(12)
}

async function clearWatchHistory() {
  if (!import.meta.client) return
  await removeWatchHistory()
  watchHistory.value = []
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

const rows = computed(() => [
  {
    title: 'Mới cập nhật',
    to: '/phim',
    items: movies.value.slice(0, 12),
  },
  {
    title: 'Phim bộ Hàn Quốc',
    to: '/phim?type=series',
    items: movies.value.filter((movie: any) => movie.type !== 'single').slice(0, 12),
  },
  {
    title: 'Phim lẻ & đặc biệt',
    to: '/phim?type=single',
    items: movies.value.filter((movie: any) => movie.type === 'single' || movie.episode === 'Full').slice(0, 12),
  },
])

const apiRows = computed(() => [
  {
    title: 'Mới cập nhật từ tất cả nguồn',
    to: '/phim',
    items: movies.value.slice(0, 12),
  },
  {
    title: 'OPhim',
    to: '/phim?source=ophim',
    items: movies.value.filter((movie: any) => movie.source === 'ophim').slice(0, 12),
  },
  {
    title: 'NguonC',
    to: '/phim?source=nguonc',
    items: movies.value.filter((movie: any) => movie.source === 'nguonc').slice(0, 12),
  },
  {
    title: 'KKPhim',
    to: '/phim?source=kkphim',
    items: movies.value.filter((movie: any) => movie.source === 'kkphim').slice(0, 12),
  },
])

watch(user, () => {
  loadWatchHistory()
})

useHead({
  title: 'KR Phim - Phim Hàn Quốc',
  meta: [
    {
      name: 'description',
      content: 'Xem phim Hàn Quốc Vietsub từ OPhim, NguồnC và KKPhim với giao diện xanh Nuxt hiện đại.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen overflow-hidden">
    <AppHeader />

    <section v-if="hero"
      class="relative h-130 min-h-130 overflow-hidden pt-20 sm:h-160 sm:min-h-160 sm:pt-24 lg:h-190 lg:min-h-190 lg:pt-16">
      <TransitionGroup name="hero-fade">
        <img v-for="(slide, index) in heroSlides" v-show="index === heroIndex" :key="`${slide.source}-${slide.slug}`"
          :src="slide.poster || slide.thumb" :alt="slide.name" class="absolute inset-0 h-full w-full object-cover">
      </TransitionGroup>
      <div class="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/76 to-slate-950/10" />
      <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-slate-950/30" />
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-linear-to-l from-emerald-950/18 to-transparent lg:block" />

      <div
        class="relative mx-auto grid h-full max-w-390 content-center px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-28 xl:px-10">
        <div class="max-w-5xl">
          <p class="mb-2 text-xs font-semibold text-emerald-200 sm:mb-3 sm:text-sm">
            Chỉ phim Hàn Quốc
          </p>
          <h1 class="max-w-5xl text-2xl font-black leading-tight text-white drop-shadow-2xl sm:text-4xl lg:text-6xl">
            {{ hero.name }}
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-emerald-100 sm:mt-3 sm:text-lg">
            {{ hero.originName || 'Kho phim Hàn Vietsub mới cập nhật' }}
          </p>
          <div class="mt-3 flex flex-wrap gap-1.5 text-xs font-bold text-slate-100 sm:mt-5 sm:gap-2 sm:text-sm">
            <span v-if="hero.rating" class="rounded bg-black/35 px-2 py-1.5 ring-1 ring-white/10 sm:px-3 sm:py-2">IMDb
              {{ hero.rating.toFixed(1) }}</span>
            <span v-if="hero.quality" class="rounded bg-emerald-300 px-2 py-1.5 text-slate-950 sm:px-3 sm:py-2">{{
              hero.quality }}</span>
            <span v-if="hero.lang" class="rounded bg-white px-2 py-1.5 text-slate-950 sm:px-3 sm:py-2">{{ hero.lang
            }}</span>
            <span v-if="hero.year" class="rounded bg-black/35 px-2 py-1.5 ring-1 ring-white/10 sm:px-3 sm:py-2">{{
              hero.year }}</span>
            <span v-if="hero.episode" class="rounded bg-black/35 px-2 py-1.5 ring-1 ring-white/10 sm:px-3 sm:py-2">{{
              hero.episode }}</span>
          </div>
          <div v-if="hero.categories?.length"
            class="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-white sm:mt-4 sm:gap-2 sm:text-sm">
            <span v-for="category in hero.categories.slice(0, 4)" :key="category"
              class="rounded bg-white/12 px-2 py-1 backdrop-blur sm:px-3 sm:py-1.5">
              {{ category }}
            </span>
          </div>
          <p class="mt-3 line-clamp-3 max-w-2xl text-xs leading-6 text-slate-100 sm:mt-5 sm:text-sm sm:leading-7">
            {{ heroDescription }}
          </p>
          <div class="mt-6 flex items-center gap-3 sm:mt-8 sm:gap-4">
            <NuxtLink :to="movieLink(hero)"
              class="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-300 text-slate-950 shadow-2xl shadow-emerald-950/50 transition hover:scale-105 hover:bg-white sm:size-16"
              aria-label="Xem ngay">
              <Play class="size-6 fill-current sm:size-7" />
            </NuxtLink>
            <button type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16 sm:size-12"
              aria-label="Yêu thích">
              <Heart class="size-4 sm:size-5" />
            </button>
            <button type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16 sm:size-12"
              aria-label="Thêm vào thư viện">
              <BookPlus class="size-4 sm:size-5" />
            </button>
            <NuxtLink :to="movieLink(hero)"
              class="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16 sm:size-12"
              aria-label="Thông tin phim">
              <Info class="size-4 sm:size-5" />
            </NuxtLink>
          </div>
        </div>

        <div
          class="absolute bottom-8 right-4 hidden max-w-[calc(100%-2rem)] items-center gap-2 sm:flex sm:bottom-12 sm:right-6 sm:gap-3 lg:right-8">
          <button type="button"
            class="hidden size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15 sm:size-10 sm:grid"
            aria-label="Phim trước" @click="previousHero">
            <ChevronLeft class="size-4 sm:size-5" />
          </button>

          <div class="no-scrollbar flex gap-2 overflow-x-auto pb-2 sm:gap-3">
            <button v-for="(slide, index) in heroSlides" :key="`${slide.source}-${slide.slug}-thumb`" type="button"
              class="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-900 shadow-lg shadow-black/30 transition sm:h-16 sm:w-32"
              :class="index === heroIndex ? 'border-emerald-300 ring-2 ring-emerald-300/45' : 'border-white/15 opacity-70 hover:opacity-100'"
              @click="selectHero(index)">
              <img :src="slide.thumb || slide.poster" :alt="slide.name" class="h-full w-full object-cover">
              <span
                class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
                {{ slide.name }}
              </span>
            </button>
          </div>

          <button type="button"
            class="hidden size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15 sm:size-10 sm:grid"
            aria-label="Phim tiếp theo" @click="nextHero">
            <ChevronRight class="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </section>

    <section v-else class="mx-auto flex min-h-screen max-w-7xl items-center px-4 pt-36 sm:px-6 lg:px-8 lg:pt-24">
      <div>
        <h1 class="text-4xl font-black text-white">KR Phim</h1>
        <p class="mt-3 text-slate-300">Đang tải kho phim Hàn Quốc...</p>
      </div>
    </section>

    <div class="relative z-10 mx-auto -mt-10 max-w-390 px-4 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <div v-if="sourceStatus.length" class="hidden">
        <span v-for="source in sourceStatus" :key="source.name"
          class="rounded-full border border-white/10 bg-white/8 px-3 py-1">
          {{ source.name }}: {{ source.ok ? 'sẵn sàng' : 'đang bị chặn' }}
        </span>
      </div>

      <p v-if="error" class="rounded-md border border-red-300/30 bg-red-500/12 p-4 text-red-100">
        Không tải được dữ liệu phim. Vui lòng thử lại sau.
      </p>

      <section v-if="watchHistory.length" class="mb-12">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 class="text-2xl font-extrabold text-white">Tiếp Tục Xem</h2>
          <button type="button"
            class="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/8 text-white transition hover:border-emerald-300/60 hover:bg-white/14"
            aria-label="Xóa lịch sử xem" @click="clearWatchHistory">
            <Trash2 class="size-4" />
          </button>
        </div>

        <div class="no-scrollbar -mx-4 ml-0.5 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:ml-0">
          <NuxtLink v-for="item in watchHistory" :key="`${item.source}-${item.slug}`" :to="watchHistoryLink(item)"
            class="group block w-44 shrink-0 snap-start sm:w-52 xl:w-56">
            <div
              class="relative aspect-2/3 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-emerald-300/60">
              <img :src="item.thumb || item.poster" :alt="item.name"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
              <div class="absolute inset-x-0 bottom-0 h-1 bg-white/18">
                <span class="block h-full bg-emerald-300" :style="{ width: `${watchProgressPercent(item)}%` }" />
              </div>
              <span
                class="absolute left-2 top-2 rounded bg-emerald-400 px-2 py-1 text-xs font-black text-slate-950">
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
          <NuxtLink :to="row.to" class="text-sm font-semibold text-emerald-200 hover:text-white">
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
