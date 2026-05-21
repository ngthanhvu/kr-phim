<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const page = ref(Math.max(Number(route.query.page || 1), 1))
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const debouncedKeyword = ref(keyword.value.trim())
const type = ref(typeof route.query.type === 'string' ? route.query.type : 'all')
const source = ref(typeof route.query.source === 'string' ? route.query.source : 'all')
const sourceOptions = [
  { label: 'Tất cả API', value: 'all' },
  { label: 'OPhim', value: 'ophim' },
  { label: 'NguonC', value: 'nguonc' },
  { label: 'KKPhim', value: 'kkphim' },
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(keyword, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedKeyword.value = value.trim()
    page.value = 1
  }, 420)
})

watch(type, () => {
  page.value = 1
})

watch(source, () => {
  page.value = 1
})

watch([page, debouncedKeyword, type, source], () => {
  router.replace({
    query: {
      page: page.value > 1 ? page.value : undefined,
      q: debouncedKeyword.value || undefined,
      type: type.value !== 'all' ? type.value : undefined,
      source: source.value !== 'all' ? source.value : undefined,
    },
  })
})

const { data, pending, error } = await useFetch('/api/movies', {
  query: computed(() => ({
    page: page.value,
    keyword: debouncedKeyword.value || undefined,
    source: source.value !== 'all' ? source.value : undefined,
  })),
})

const movies = computed(() => data.value?.items ?? [])
const filteredMovies = computed(() => {
  if (type.value === 'series') {
    return movies.value.filter((movie: any) => movie.type !== 'single')
  }

  if (type.value === 'single') {
    return movies.value.filter((movie: any) => movie.type === 'single' || movie.episode === 'Full')
  }

  return movies.value
})
const totalPages = computed(() => Number(data.value?.pagination?.totalPages || data.value?.pagination?.total_pages || 0))
const sourceStatus = computed(() => data.value?.sources ?? [])

function nextPage() {
  page.value += 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function previousPage() {
  page.value = Math.max(1, page.value - 1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

useHead({
  title: 'Duyệt phim Hàn Quốc - KR Phim',
  meta: [
    {
      name: 'description',
      content: 'Tìm kiếm và lọc phim Hàn Quốc Vietsub trên KR Phim.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen bg-slate-950">
    <AppHeader />

    <section class="mx-auto max-w-390 px-4 pb-16 pt-36 sm:px-6 lg:px-8 lg:pt-28 xl:px-10">
      <div class="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-sm font-semibold text-emerald-200">Kho phim Hàn Quốc</p>
          <h1 class="mt-2 text-3xl font-black text-white sm:text-5xl">
            Duyệt phim
          </h1>
        </div>

        <div class="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <div
            class="flex min-w-0 flex-1 items-center rounded-full border border-white/10 bg-white/8 px-4 py-3 shadow-2xl shadow-emerald-950/20">
            <Search class="mr-3 size-4 shrink-0 text-emerald-200" />
            <input v-model="keyword" type="search" placeholder="Tìm phim Hàn Quốc..."
              class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400">
          </div>

          <div
            class="grid grid-cols-3 rounded-full border border-white/10 bg-white/8 p-1 text-sm font-bold text-slate-200">
            <button type="button" class="rounded-full px-4 py-2 transition"
              :class="type === 'all' ? 'bg-emerald-300 text-slate-950' : 'hover:text-white'" @click="type = 'all'">
              Tất cả
            </button>
            <button type="button" class="rounded-full px-4 py-2 transition"
              :class="type === 'series' ? 'bg-emerald-300 text-slate-950' : 'hover:text-white'" @click="type = 'series'">
              Phim bộ
            </button>
            <button type="button" class="rounded-full px-4 py-2 transition"
              :class="type === 'single' ? 'bg-emerald-300 text-slate-950' : 'hover:text-white'" @click="type = 'single'">
              Phim lẻ
            </button>
          </div>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap gap-2 text-sm font-black text-slate-200">
        <button v-for="option in sourceOptions" :key="option.value" type="button"
          class="rounded-full border border-white/10 px-4 py-2 transition"
          :class="source === option.value ? 'bg-emerald-300 text-slate-950' : 'bg-white/8 hover:bg-white/14 hover:text-white'"
          @click="source = option.value">
          {{ option.label }}
        </button>
      </div>

      <div v-if="sourceStatus.length" class="mb-8 flex flex-wrap gap-2 text-xs text-slate-300">
        <span v-for="source in sourceStatus" :key="source.name"
          class="rounded-full border border-white/10 bg-white/8 px-3 py-1">
          {{ source.name }}: {{ source.ok ? 'sẵn sàng' : 'đang bị chặn' }}
        </span>
      </div>

      <p v-if="error" class="rounded-md border border-red-300/30 bg-red-500/12 p-4 text-red-100">
        Không tải được dữ liệu phim. Vui lòng thử lại sau.
      </p>

      <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <div v-for="item in 18" :key="item" class="aspect-2/3 animate-pulse rounded-md bg-white/10" />
      </div>

      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink v-for="movie in filteredMovies" :key="`${movie.source}-${movie.slug}`"
          :to="{ path: `/phim/${movie.slug}`, query: { source: movie.source } }" class="group">
          <div
            class="relative aspect-2/3 overflow-hidden rounded-md bg-slate-900 shadow-xl shadow-black/25 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-emerald-300/60">
            <img :src="movie.thumb || movie.poster" :alt="movie.name"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent p-3">
              <p class="line-clamp-2 text-sm font-bold leading-snug text-white">{{ movie.name }}</p>
              <p class="mt-1 truncate text-xs text-emerald-100">{{ movie.episode || movie.year || movie.quality }}</p>
            </div>
            <span class="absolute left-2 top-2 rounded bg-emerald-400 px-2 py-1 text-xs font-black text-slate-950">
              {{ movie.source }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <div v-if="!pending && !filteredMovies.length"
        class="rounded-md border border-white/10 bg-white/8 p-8 text-center text-slate-300">
        Không có phim phù hợp.
      </div>

      <div v-if="movies.length" class="flex items-center justify-center gap-3 pt-10">
        <button type="button" :disabled="page === 1"
          class="grid size-11 place-items-center rounded-full border border-white/15 bg-white/8 text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang trước" @click="previousPage">
          <ChevronLeft class="size-5" />
        </button>
        <span class="text-sm text-slate-300">Trang {{ page }}<template v-if="totalPages"> / {{ totalPages
        }}</template></span>
        <button type="button"
          class="grid size-11 place-items-center rounded-full bg-emerald-300 text-slate-950 hover:bg-white"
          aria-label="Trang sau" @click="nextPage">
          <ChevronRight class="size-5" />
        </button>
      </div>
    </section>
  </main>
</template>
