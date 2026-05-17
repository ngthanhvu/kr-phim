<script setup lang="ts">
import { BookPlus, ChevronLeft, ChevronRight, Heart, Info, Play } from 'lucide-vue-next'

const { data, pending, error } = await useFetch('/api/movies', {
  query: {
    page: 1,
  },
})

const movies = computed(() => data.value?.items ?? [])
const heroIndex = ref(0)
const heroSlides = computed(() => movies.value.slice(0, 6))
const hero = computed(() => heroSlides.value[heroIndex.value] ?? movies.value[0])
const sourceStatus = computed(() => data.value?.sources ?? [])

let heroTimer: ReturnType<typeof setInterval> | undefined

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

onMounted(() => {
  heroTimer = setInterval(nextHero, 6500)
})

onBeforeUnmount(() => {
  if (heroTimer) clearInterval(heroTimer)
})

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

useHead({
  title: 'KR Phim - Phim Hàn Quốc',
  meta: [
    {
      name: 'description',
      content: 'Xem phim Hàn Quốc Vietsub từ OPhim và NguồnC với giao diện xanh da trời kiểu Netflix.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen overflow-hidden">
    <AppHeader />

    <section v-if="hero" class="relative h-[680px] min-h-[680px] overflow-hidden pt-28 sm:h-[720px] sm:min-h-[720px] lg:h-[760px] lg:min-h-[760px] lg:pt-16">
      <TransitionGroup name="hero-fade">
        <img
          v-for="(slide, index) in heroSlides"
          v-show="index === heroIndex"
          :key="`${slide.source}-${slide.slug}`"
          :src="slide.poster || slide.thumb"
          :alt="slide.name"
          class="absolute inset-0 h-full w-full object-cover"
        >
      </TransitionGroup>
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/76 to-slate-950/10" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/30" />
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-sky-950/18 to-transparent lg:block" />

      <div class="relative mx-auto grid h-full max-w-[1560px] content-center px-4 pb-28 pt-16 sm:px-6 lg:px-8 xl:px-10">
        <div class="max-w-5xl">
          <p class="mb-3 text-sm font-semibold text-sky-200">
            Chỉ phim Hàn Quốc
          </p>
          <h1 class="max-w-5xl text-3xl font-black leading-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
            {{ hero.name }}
          </h1>
          <p class="mt-3 max-w-2xl text-lg text-sky-100">
            {{ hero.originName || 'Kho phim Hàn Vietsub mới cập nhật' }}
          </p>
          <div class="mt-5 flex flex-wrap gap-2 text-sm font-bold text-slate-100">
            <span v-if="hero.rating" class="rounded bg-black/35 px-3 py-2 ring-1 ring-white/10">IMDb {{ hero.rating.toFixed(1) }}</span>
            <span v-if="hero.quality" class="rounded bg-sky-300 px-3 py-2 text-slate-950">{{ hero.quality }}</span>
            <span v-if="hero.lang" class="rounded bg-white px-3 py-2 text-slate-950">{{ hero.lang }}</span>
            <span v-if="hero.year" class="rounded bg-black/35 px-3 py-2 ring-1 ring-white/10">{{ hero.year }}</span>
            <span v-if="hero.episode" class="rounded bg-black/35 px-3 py-2 ring-1 ring-white/10">{{ hero.episode }}</span>
          </div>
          <div v-if="hero.categories?.length" class="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-white">
            <span
              v-for="category in hero.categories.slice(0, 4)"
              :key="category"
              class="rounded bg-white/12 px-3 py-1.5 backdrop-blur"
            >
              {{ category }}
            </span>
          </div>
          <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
            {{ hero.originName ? `${hero.originName}. ` : '' }}{{ hero.time || 'Phim Hàn Quốc Vietsub mới cập nhật.' }}
          </p>
          <div class="mt-8 flex items-center gap-4">
            <NuxtLink
              :to="{ path: `/phim/${hero.slug}`, query: { source: hero.source } }"
              class="grid size-16 shrink-0 place-items-center rounded-full bg-sky-300 text-slate-950 shadow-2xl shadow-sky-950/50 transition hover:scale-105 hover:bg-white"
              aria-label="Xem ngay"
            >
              <Play class="size-7 fill-current" />
            </NuxtLink>
            <button
              type="button"
              class="grid size-12 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16"
              aria-label="Yêu thích"
            >
              <Heart class="size-5" />
            </button>
            <button
              type="button"
              class="grid size-12 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16"
              aria-label="Thêm vào thư viện"
            >
              <BookPlus class="size-5" />
            </button>
            <NuxtLink
              :to="{ path: `/phim/${hero.slug}`, query: { source: hero.source } }"
              class="grid size-12 shrink-0 place-items-center rounded-full border border-white/20 bg-black/28 text-white backdrop-blur transition hover:bg-white/16"
              aria-label="Thông tin phim"
            >
              <Info class="size-5" />
            </NuxtLink>
          </div>
        </div>

        <div class="absolute bottom-12 right-4 flex max-w-[calc(100%-2rem)] items-center gap-3 sm:right-6 lg:right-8">
          <button
            type="button"
            class="hidden size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15 sm:grid"
            aria-label="Phim trước"
            @click="previousHero"
          >
            <ChevronLeft class="size-5" />
          </button>

          <div class="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            <button
              v-for="(slide, index) in heroSlides"
              :key="`${slide.source}-${slide.slug}-thumb`"
              type="button"
              class="relative h-14 w-28 shrink-0 overflow-hidden rounded-md border bg-slate-900 shadow-lg shadow-black/30 transition sm:h-16 sm:w-32"
              :class="index === heroIndex ? 'border-sky-300 ring-2 ring-sky-300/45' : 'border-white/15 opacity-70 hover:opacity-100'"
              @click="selectHero(index)"
            >
              <img :src="slide.thumb || slide.poster" :alt="slide.name" class="h-full w-full object-cover">
              <span class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[10px] font-semibold text-white">
                {{ slide.name }}
              </span>
            </button>
          </div>

          <button
            type="button"
            class="hidden size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-white/15 sm:grid"
            aria-label="Phim tiếp theo"
            @click="nextHero"
          >
            <ChevronRight class="size-5" />
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

    <div class="relative z-10 mx-auto -mt-10 max-w-[1560px] px-4 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <div v-if="sourceStatus.length" class="mb-8 flex flex-wrap gap-2 text-xs text-slate-300">
        <span
          v-for="source in sourceStatus"
          :key="source.name"
          class="rounded-full border border-white/10 bg-white/8 px-3 py-1"
        >
          {{ source.name }}: {{ source.ok ? 'sẵn sàng' : 'đang bị chặn' }}
        </span>
      </div>

      <p v-if="error" class="rounded-md border border-red-300/30 bg-red-500/12 p-4 text-red-100">
        Không tải được dữ liệu phim. Vui lòng thử lại sau.
      </p>

      <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="item in 12" :key="item" class="aspect-[2/3] animate-pulse rounded-md bg-white/10" />
      </div>

      <section
        v-for="(row, index) in rows"
        v-show="row.items.length"
        :id="index === 0 ? 'latest' : index === 1 ? 'series' : 'movies'"
        :key="row.title"
        class="mb-12"
      >
        <div class="mb-4 flex items-end justify-between gap-4">
          <h2 class="text-2xl font-extrabold text-white">{{ row.title }}</h2>
          <NuxtLink :to="row.to" class="text-sm font-semibold text-sky-200 hover:text-white">
            Xem thêm
          </NuxtLink>
        </div>

        <div class="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-5">
          <HomeMovieCard
            v-for="movie in row.items"
            :key="`${movie.source}-${movie.slug}`"
            :movie="movie"
          />
        </div>
      </section>
    </div>
  </main>
</template>
