<script setup lang="ts">
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

const { data: sectionsData } = useFetch('/api/home/sections', {
  lazy: true,
  default: () => ({
    recentComments: [],
    trending: [],
    mostRated: [],
    hotGenres: [],
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

const heroDetailCache = new Map<string, any>()
const heroSliderRef = ref<{ goTo: (index: number) => void } | null>(null)

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

const recentComments = computed(() => sectionsData.value?.recentComments || [])
const trendingMovies = computed(() => sectionsData.value?.trending || [])
const mostRatedMovies = computed(() => sectionsData.value?.mostRated || [])
const hotGenres = computed(() => sectionsData.value?.hotGenres || [])
const commentsCarouselRef = ref<HTMLDivElement | null>(null)

function scrollComments(direction: 'left' | 'right') {
  const container = commentsCarouselRef.value
  if (!container) return
  const firstCard = container.querySelector('a') as HTMLElement | null
  if (!firstCard) return
  const cardWidth = firstCard.offsetWidth
  const gap = 16
  const scrollAmount = cardWidth + gap
  container.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

function formatCommentContent(content: string, maxLength = 120) {
  if (!content) return ''
  if (/!\[GIF\]\(/i.test(content)) return 'Đã gửi một GIF'
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength).trim()}...`
}

function movieLinkFromSection(movie: any) {
  return {
    path: `/phim/${movie?.slug}`,
    query: {
      source: movie?.source,
    },
  }
}

function genreTagColor(index: number) {
  const colors = [
    'bg-yellow-500',
    'bg-green-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-lime-500',
    'bg-teal-500',
    'bg-violet-500',
  ]
  return colors[index % colors.length]
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


function goToSlide(index: number) {
  heroSliderRef.value?.goTo(index)
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
  loadWatchHistory()
  window.addEventListener('storage', loadWatchHistory)
})

onBeforeUnmount(() => {
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
  <main class="min-h-screen overflow-hidden bg-[#0E111A]">
    <AppHeader />

    <div v-if="hero" class="relative bg-black mt-16 md:mt-0">
      <section
        class="relative w-full aspect-video md:h-screen overflow-hidden bg-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1.5 after:bg-black after:z-10">
        <ClientOnly>
          <HeroSlider v-if="heroSlides.length" ref="heroSliderRef" :slides="heroSlides"
            @update:modelValue="heroIndex = $event" />
        </ClientOnly>

        <!-- Mobile gradient overlay (bottom only) -->
        <div class="absolute inset-0 z-10 pointer-events-none md:hidden"
          style="background:linear-gradient(to top, #000000 0%, rgba(0,0,0,0.92) 8%, rgba(0,0,0,0.75) 22%, rgba(0,0,0,0.35) 50%, transparent 78%)">
        </div>

        <!-- Desktop gradient overlay (bottom only) -->
        <div class="absolute inset-0 z-10 pointer-events-none hidden md:block"
          style="background:linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.35) 45%, transparent 70%)">
        </div>

        <!-- Content overlay -->
        <div class="absolute inset-0 z-20 flex items-end pb-8 md:pb-[8vw] lg:pb-[7vw] xl:pb-40 pointer-events-none">
          <div class="max-w-350 w-full mx-auto px-4 md:px-8 pointer-events-none">
            <div
              class="max-w-xl mx-auto md:mx-0 md:max-w-[50vw] lg:max-w-2xl flex flex-col items-center md:items-start text-center md:text-left">
              <!-- Title -->
              <div class="mb-1 md:mb-4 lg:mb-6">
                <NuxtLink :to="movieLink(hero)" class="md:pointer-events-none" aria-label="Xem chi tiết phim">
                  <h1 class="text-lg md:text-3xl lg:text-5xl font-black leading-tight text-white drop-shadow-2xl">
                    {{ hero.name }}
                  </h1>
                </NuxtLink>
              </div>

              <!-- Original name -->
              <p class="text-xs md:text-sm lg:text-base font-medium text-[#FECF59] mb-2 md:mb-3 lg:mb-4 drop-shadow">
                {{ hero.originName || 'Kho phim Hàn Vietsub mới cập nhật' }}
              </p>

              <!-- Badges (mobile) -->
              <div
                class="flex justify-center md:justify-start items-center flex-wrap gap-2 mb-3 md:mb-4 text-[10px] md:text-xs text-white/90">
                <div v-if="hero.rating"
                  class="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                  <span class="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
                  <span class="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{{ hero.rating.toFixed(1) }}</span>
                </div>
                <span v-if="hero.quality"
                  class="inline-flex items-center justify-center rounded-sm text-[#141414] font-black leading-none tracking-normal h-5.5 px-2 text-[11px]"
                  style="background-color:#ffd875;background-image:linear-gradient(220deg, #ffd875 0%, #ffe7a8 45%, #ffffff 100%)">
                  {{ hero.quality }}
                </span>
                <span v-if="getEpisodeDisplay(hero.episode, hero.episodeTotal)"
                  class="px-2 py-0.75 rounded border border-white bg-black/40">
                  {{ getEpisodeDisplay(hero.episode, hero.episodeTotal) }}
                </span>
              </div>

              <!-- Genre tags (desktop only) -->
              <div v-if="hero.categories?.length"
                class="hidden md:flex justify-center md:justify-start items-center flex-wrap gap-2 mb-4">
                <span v-for="category in hero.categories.slice(0, 4)" :key="category"
                  class="text-[10px] md:text-xs text-white/80 bg-white/10 px-2 py-0.75 rounded-md">
                  {{ category }}
                </span>
              </div>

              <!-- Description (desktop only) -->
              <div class="hidden md:block mb-4 lg:mb-8 max-w-sm lg:max-w-lg">
                <p class="text-xs lg:text-sm text-white font-light leading-relaxed line-clamp-2 lg:line-clamp-3">
                  {{ heroDescription }}
                </p>
              </div>

              <!-- Action buttons (desktop only) -->
              <div
                class="hidden md:flex justify-center md:justify-start items-center gap-4 pointer-events-auto relative z-40">
                <!-- Watch Now button -->
                <NuxtLink :to="movieLink(hero)"
                  class="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-[#0f1115] rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(254,207,89,0.5)] shrink-0 pointer-events-auto"
                  style="background:linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))"
                  aria-label="Xem ngay">
                  <AppIcon name="play" class="size-6 md:size-7 lg:size-8 fill-current" />
                </NuxtLink>

                <!-- Info + Add to List combo button -->
                <div
                  class="flex bg-white/5 border border-white/20 rounded-full backdrop-blur-md h-10 md:h-12 lg:h-14 items-center overflow-hidden pointer-events-auto">
                  <!-- Add to list button -->
                  <button type="button"
                    class="group/btn w-16 md:w-20 h-full flex items-center justify-center transition-all hover:bg-white/10"
                    aria-label="Thêm vào danh sách">
                    <AppIcon name="plus" class="size-5 md:size-6 text-white" />
                  </button>
                  <!-- Divider -->
                  <div class="w-px h-6 bg-white/30"></div>
                  <!-- Info/details button -->
                  <NuxtLink :to="movieLink(hero)"
                    class="group/link w-16 md:w-20 h-full flex items-center justify-center transition-colors text-white hover:text-[#FECF59]"
                    aria-label="Thông tin phim">
                    <AppIcon name="info"
                      class="size-6 md:size-7 text-white fill-none stroke-current group-hover/link:text-[#FECF59] transition-all" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- Thumbnail navigation -->
      <div
        class="relative md:absolute md:bottom-8 md:left-auto md:right-8 md:translate-x-0 z-50 flex gap-2 overflow-x-auto max-w-full md:max-w-md lg:max-w-lg py-3 md:py-0 pb-2 md:pb-0 snap-x px-4 md:px-2 pointer-events-auto scroll-smooth [&::-webkit-scrollbar]:hidden bg-transparent"
        style="scrollbar-width:none;-ms-overflow-style:none">
        <button v-for="(slide, index) in heroSlides" :key="`${slide.source}-${slide.slug}-thumb`" type="button"
          class="relative shrink-0 w-[14vw] sm:w-[10vw] md:w-[7vw] lg:w-[6vw] xl:w-[5vw] max-w-10 md:max-w-18.75 lg:max-w-21.25 aspect-square md:aspect-video transition-all duration-300 rounded-full md:rounded-lg overflow-hidden snap-center transform-gpu border-2 cursor-pointer"
          :class="index === heroIndex ? 'border-white/90 opacity-100 scale-100 shadow-md' : 'border-transparent opacity-80 scale-95 hover:scale-100 hover:opacity-100'"
          style="-webkit-mask-image: -webkit-radial-gradient(white, black); mask-image: radial-gradient(white, black);"
          :aria-label="`Chuyển đến phim ${index + 1}`" @click="goToSlide(index)">
          <img :src="slide.poster || slide.thumb" :alt="slide.name"
            class="absolute inset-0 h-full w-full object-cover rounded-full md:rounded-lg pointer-events-none">
        </button>
      </div>
    </div>

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

    <section v-else class="flex min-h-screen items-center justify-center px-4 pt-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-yellow-400/10">
          <AppIcon name="film" class="size-10 text-yellow-400" />
        </div>
        <h1 class="text-2xl font-black text-white sm:text-3xl">Web đang chưa cập nhật phim</h1>
        <p class="mx-auto mt-3 max-w-md text-sm text-slate-400 sm:text-base">
          Hiện tại chưa có bộ phim nào. Vui lòng quay lại sau để khám phá kho phim mới nhất nhé!
        </p>
        <NuxtLink to="/phim"
          class="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-black text-slate-950 transition hover:bg-yellow-300">
          Khám phá kho phim
        </NuxtLink>
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
            <AppIcon name="trash" class="size-4" />
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
                {{ item.episodeName || getEpisodeDisplay(String((item.episodeIndex || 0) + 1), '') }}
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

      <!-- Community sections -->
      <section class="relative overflow-visible rounded-2xl border border-white/15 bg-[#0E111A]">
        <!-- Bình luận mới -->
        <div v-if="recentComments.length" class="relative border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <div class="mb-4 flex items-center gap-3 lg:mb-5">
            <AppIcon name="message-circle" class="size-5 text-yellow-400 lg:size-6" />
            <h2 class="text-base font-black uppercase text-white sm:text-lg lg:text-2xl">Bình luận mới</h2>
          </div>

          <div class="relative">
            <div ref="commentsCarouselRef"
              class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2">
              <NuxtLink v-for="comment in recentComments" :key="comment.id" :to="movieLinkFromSection(comment.movie)"
                class="group relative h-48 min-w-[82%] snap-start overflow-hidden rounded-xl bg-[#181a22]
                 transition-all duration-800 ease-in-out sm:h-50 sm:min-w-60 sm:rounded-2xl md:min-w-65
                 lg:min-w-67.5 xl:min-w-72.5 2xl:min-w-77.5">
                <!-- Blurred background -->
                <div v-if="comment.movie?.poster"
                  class="absolute inset-0 transition-all duration-700 ease-in-out group-hover:blur-sm group-hover:saturate-150"
                  :style="{
                    backgroundImage: `url(${comment.movie.poster})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(8px) saturate(1.2)',
                    transform: 'scale(1.2)'
                  }" />

                <!-- Dark gradient overlay -->
                <div v-if="comment.movie?.poster">
                  <div class="absolute inset-0 bg-linear-to-t from-[#0E111A] via-[#0E111A]/50 to-transparent" />
                  <div class="absolute inset-0 bg-linear-to-t from-[#0E111A]/30 via-[#0E111A]/10 to-transparent
                     transition-all duration-1200 ease-[cubic-bezier(0.65,0,0.35,1)]
                     group-hover:from-[#0E111A]/10 group-hover:via-[#0E111A]/5" />
                </div>

                <!-- Content -->
                <div class="relative z-10 flex h-full flex-col p-4 transition-all duration-700 ease-in-out
                   group-hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.03)]">
                  <!-- Top: Avatar + Poster -->
                  <div class="flex items-end justify-between">
                    <!-- Avatar -->
                    <img v-if="comment.user?.avatar" :src="comment.user.avatar" :alt="comment.user?.name"
                      class="mt-auto size-10 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white/20 sm:size-12">

                    <!-- Fallback Avatar -->
                    <div v-else class="mt-auto grid size-10 shrink-0 place-items-center rounded-full
                       bg-linear-to-br from-yellow-400 to-orange-500 text-base font-black text-slate-950
                       shadow-md ring-2 ring-white/20 sm:size-12 sm:text-lg">
                      {{ (comment.user?.name || 'A').charAt(0).toUpperCase() }}
                    </div>

                    <!-- Movie Poster -->
                    <div
                      class="h-18 w-12 shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-white/10 sm:h-19 sm:w-13">
                      <img v-if="comment.movie?.thumb" :src="comment.movie.thumb" :alt="comment.movie?.name"
                        class="h-full w-full object-cover">
                      <img v-else-if="comment.movie?.poster" :src="comment.movie.poster" :alt="comment.movie?.name"
                        class="h-full w-full object-cover">
                      <div v-else class="h-full w-full bg-slate-700" />
                    </div>
                  </div>

                  <!-- User Name + Gender -->
                  <div class="mt-2 flex min-w-0 items-center gap-1.5">
                    <span class="truncate text-sm font-bold text-white">
                      {{ comment.user?.name || 'Ẩn danh' }}
                    </span>
                    <AppIcon v-if="comment.user?.gender === 'female'" name="venus"
                      class="size-3.5 shrink-0 text-pink-400" />
                    <AppIcon v-if="comment.user?.gender === 'male'" name="mars"
                      class="size-3.5 shrink-0 text-blue-400" />
                    <AppIcon v-if="comment.user?.gender === 'other'" name="minus"
                      class="size-3.5 shrink-0 text-purple-400" />
                  </div>

                  <!-- Comment -->
                  <p class="mt-1 line-clamp-2 text-[13px] leading-relaxed text-white/60">
                    {{ formatCommentContent(comment.content, 180) }}
                  </p>

                  <!-- Stats -->
                  <div class="mt-auto flex items-center gap-5 text-xs text-white/50">
                    <span class="flex items-center gap-1">
                      <AppIcon name="thumbs-up" class="size-3.5" />
                      {{ comment.likeCount ?? 0 }}
                    </span>

                    <span class="flex items-center gap-1">
                      <AppIcon name="thumbs-down" class="size-3.5" />
                      {{ comment.dislikeCount ?? 0 }}
                    </span>

                    <span class="flex items-center gap-1">
                      <AppIcon name="message-square" class="size-3.5" />
                      {{ comment.replyCount ?? 0 }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <!-- Carousel navigation -->
            <button type="button" class="absolute -left-[4.25rem] top-1/2 z-20 hidden size-14 -translate-y-1/2 place-items-center
               rounded-full border border-white/15 bg-[#11141d] text-white shadow-lg
               transition hover:bg-[#181c27] lg:grid" @click="scrollComments('left')">
              <AppIcon name="chevron-left" class="size-6" />
            </button>

            <button type="button" class="absolute -right-[4.25rem] top-1/2 z-20 hidden size-14 -translate-y-1/2 place-items-center
               rounded-full border border-white/15 bg-[#11141d] text-white shadow-lg
               transition hover:bg-[#181c27] lg:grid" @click="scrollComments('right')">
              <AppIcon name="chevron-right" class="size-6" />
            </button>
          </div>
        </div>

        <!-- Top sections -->
        <div
          class="no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto overscroll-x-contain scroll-smooth lg:grid lg:grid-cols-3 lg:overflow-visible">
          <!-- Sôi nổi nhất -->
          <div
            class="flex h-full min-w-[92%] snap-start flex-col p-5 sm:min-w-[70%] sm:p-6 lg:min-w-0 lg:border-r lg:border-white/10">
            <div class="mb-3 flex items-center gap-2">
              <AppIcon name="zap" class="size-4 text-orange-500" />
              <h2 class="text-sm font-black uppercase text-white">
                Sôi nổi nhất
              </h2>
            </div>

            <div class="grid flex-1 grid-rows-5 gap-2.5">
              <NuxtLink v-for="(movie, index) in trendingMovies.slice(0, 5)"
                :key="`${movie.source}-${movie.slug}-trending`" :to="movieLinkFromSection(movie)"
                class="group flex min-h-12 items-center gap-2 transition hover:opacity-80">
                <span class="w-5 shrink-0 text-center text-sm font-black text-white/80">
                  {{ index + 1 }}.
                </span>

                <AppIcon :name="index < 2
                  ? 'trending-up'
                  : index === 2
                    ? 'minus'
                    : 'trending-down'" :class="index < 2
                      ? 'text-green-400'
                      : index === 2
                        ? 'text-slate-400'
                        : 'text-red-400'" class="size-3.5 shrink-0" />

                <img :src="movie.thumb || movie.poster" :alt="movie.name"
                  class="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-white/10">

                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-bold text-white group-hover:text-yellow-300">
                    {{ movie.name }}
                  </p>
                </div>
              </NuxtLink>
            </div>

            <NuxtLink to="/phim" class="mt-3 inline-block text-xs font-semibold text-slate-400 hover:text-white">
              Xem thêm
            </NuxtLink>
          </div>

          <!-- Yêu thích nhất -->
          <div class="flex h-full min-w-[92%] snap-start flex-col border-l border-white/10 p-5
             sm:min-w-[70%] sm:p-6 lg:min-w-0 lg:border-l-0 lg:border-r lg:border-white/10">
            <div class="mb-3 flex items-center gap-2">
              <AppIcon name="heart" class="size-4 text-pink-500" />
              <h2 class="text-sm font-black uppercase text-white">
                Yêu thích nhất
              </h2>
            </div>

            <div class="grid flex-1 grid-rows-5 gap-2.5">
              <NuxtLink v-for="(movie, index) in mostRatedMovies.slice(0, 5)"
                :key="`${movie.source}-${movie.slug}-rated`" :to="movieLinkFromSection(movie)"
                class="group flex min-h-12 items-center gap-2 transition hover:opacity-80">
                <span class="w-5 shrink-0 text-center text-sm font-black text-white/80">
                  {{ index + 1 }}.
                </span>

                <AppIcon :name="index < 2
                  ? 'trending-up'
                  : index === 2
                    ? 'minus'
                    : 'trending-down'" :class="index < 2
                      ? 'text-green-400'
                      : index === 2
                        ? 'text-slate-400'
                        : 'text-red-400'" class="size-3.5 shrink-0" />

                <img :src="movie.thumb || movie.poster" :alt="movie.name"
                  class="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-white/10">

                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-bold text-white group-hover:text-yellow-300">
                    {{ movie.name }}
                  </p>
                </div>
              </NuxtLink>
            </div>

            <NuxtLink to="/phim" class="mt-3 inline-block text-xs font-semibold text-slate-400 hover:text-white">
              Xem thêm
            </NuxtLink>
          </div>

          <!-- Thể loại hot -->
          <div
            class="flex h-full min-w-[92%] snap-start flex-col border-l border-white/10 p-5 sm:min-w-[70%] sm:p-6 lg:min-w-0 lg:border-l-0">
            <div class="mb-3 flex items-center gap-2">
              <AppIcon name="layers" class="size-4 text-yellow-500" />
              <h2 class="text-sm font-black uppercase text-white">
                Thể loại hot
              </h2>
            </div>

            <div class="grid flex-1 grid-rows-5 gap-2.5">
              <NuxtLink v-for="(genre, index) in hotGenres.slice(0, 5)" :key="genre.name" to="/phim"
                class="group flex min-h-12 items-center gap-2 transition hover:opacity-80">
                <span class="w-5 shrink-0 text-center text-sm font-black text-white/80">
                  {{ index + 1 }}.
                </span>

                <AppIcon :name="index < 2
                  ? 'trending-up'
                  : index === 2
                    ? 'minus'
                    : 'trending-down'" :class="index < 2
                      ? 'text-green-400'
                      : index === 2
                        ? 'text-slate-400'
                        : 'text-red-400'" class="size-3.5 shrink-0" />

                <div class="flex h-12 items-center">
                  <span class="rounded-xl px-4 py-2 text-[10px] font-black text-white" :class="genreTagColor(index)">
                    {{ genre.name }}
                  </span>
                </div>
              </NuxtLink>
            </div>

            <NuxtLink to="/phim" class="mt-3 inline-block text-xs font-semibold text-slate-400 hover:text-white">
              Xem thêm
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
