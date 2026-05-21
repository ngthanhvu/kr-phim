<script setup lang="ts">
import { ChevronDown, Heart, Play, Plus, Share2, Star } from 'lucide-vue-next'

const route = useRoute()
const requestedSource = computed(() => String(route.query.source || 'ophim'))
const selectedServer = ref(0)
const movieInfoOpen = ref(false)
const activeTab = ref<'episodes' | 'actors'>('episodes')
const isFavoriteMovie = ref(false)
const actionMessage = ref('')
const actionBusy = ref(false)
const { user, initAuth } = useSupabaseAuth()
const {
  isFavorite,
  saveFavorite,
  removeFavorite,
  saveWatchLater,
} = useMovieLibrary()
const sourceOptions = [
  { label: 'OPhim', value: 'ophim' },
  { label: 'NguonC', value: 'nguonc' },
]

const { data: movie, pending, error } = await useFetch(() => `/api/movies/${route.params.slug}`, {
  query: computed(() => ({
    source: requestedSource.value,
  })),
  watch: [requestedSource],
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value])
const activeSource = computed(() => String(movie.value?.source || route.query.source || 'ophim'))
const actors = computed(() => movie.value?.actors ?? [])
const actorSummary = computed(() => actors.value.map((actor: any) => actor.name).filter(Boolean).slice(0, 6).join(', '))
const firstWatchLink = computed(() => ({
  path: `/xem/${route.params.slug}`,
  query: {
    source: activeSource.value,
    server: selectedServer.value,
    ep: 1,
  },
}))
const episodeCount = computed(() => servers.value.reduce((total: number, server: any) => total + (server.episodes?.length || 0), 0))
const libraryItem = computed(() => {
  if (!movie.value) return null

  return {
    source: activeSource.value,
    slug: String(route.params.slug),
    name: movie.value.name,
    originName: movie.value.originName,
    thumb: movie.value.thumb,
    poster: movie.value.poster,
    updatedAt: Date.now(),
  }
})

function episodeLink(index: number) {
  return {
    path: `/xem/${route.params.slug}`,
    query: {
      source: activeSource.value,
      server: selectedServer.value,
      ep: index + 1,
    },
  }
}

function sourceLink(source: string) {
  return {
    path: `/phim/${route.params.slug}`,
    query: { source },
  }
}

function formatEpisodeName(name: string, index: number) {
  const label = String(name || index + 1).trim()
  return /^\d+$/.test(label) ? `Tập ${label}` : label
}

function actorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

function flashActionMessage(message: string) {
  actionMessage.value = message
  window.setTimeout(() => {
    if (actionMessage.value === message) actionMessage.value = ''
  }, 2200)
}

async function refreshFavoriteState() {
  if (!libraryItem.value) return
  isFavoriteMovie.value = await isFavorite(libraryItem.value)
}

async function toggleFavorite() {
  if (!libraryItem.value || actionBusy.value) return

  actionBusy.value = true
  if (isFavoriteMovie.value) {
    await removeFavorite(libraryItem.value)
    isFavoriteMovie.value = false
    flashActionMessage('Đã bỏ khỏi yêu thích.')
  } else {
    await saveFavorite(libraryItem.value)
    isFavoriteMovie.value = true
    flashActionMessage(user.value ? 'Đã lưu vào yêu thích.' : 'Đã lưu yêu thích trên thiết bị này.')
  }
  actionBusy.value = false
}

async function addToWatchLater() {
  if (!libraryItem.value || actionBusy.value) return

  actionBusy.value = true
  await saveWatchLater(libraryItem.value)
  actionBusy.value = false
  flashActionMessage(user.value ? 'Đã thêm vào danh sách xem sau.' : 'Đã thêm vào danh sách xem sau trên thiết bị này.')
}

async function shareMovie() {
  if (!import.meta.client || !movie.value) return

  const shareUrl = window.location.href
  const shareTitle = `${movie.value.name} - KR Phim`

  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: movie.value.originName || movie.value.name,
        url: shareUrl,
      })
      return
    }

    await navigator.clipboard.writeText(shareUrl)
    flashActionMessage('Đã copy link phim.')
  } catch {
    flashActionMessage('Chưa chia sẻ được, bạn thử lại nhé.')
  }
}

onMounted(async () => {
  await initAuth()
  await refreshFavoriteState()
})

watch(requestedSource, () => {
  selectedServer.value = 0
})

watch([libraryItem, user], () => {
  refreshFavoriteState()
})

useHead(() => ({
  title: movie.value ? `${movie.value.name} - KR Phim` : 'Đang tải phim - KR Phim',
  meta: [
    {
      name: 'description',
      content: movie.value?.content || 'Xem phim Hàn Quốc Vietsub.',
    },
  ],
}))
</script>

<template>
  <main class="min-h-screen bg-[#08090d] text-white">
    <AppHeader />

    <div v-if="pending"
      class="mx-auto grid min-h-screen max-w-390 gap-6 px-4 pt-36 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:px-8 lg:pt-40 xl:px-10">
      <div class="h-114 animate-pulse rounded-md bg-white/10" />
      <div class="h-80 animate-pulse rounded-md bg-white/10" />
    </div>

    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Nguồn phim có thể đang chặn request hoặc phim chưa có tập xem.</p>
      </div>
    </div>

    <template v-else>
      <section class="relative overflow-hidden pt-20 lg:pt-16">
        <div class="absolute inset-x-0 top-0 h-96 overflow-hidden sm:h-112">
          <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover opacity-45">
          <div class="absolute inset-0 bg-linear-to-b from-slate-950/25 via-[#08090d]/75 to-[#08090d]" />
          <div class="absolute inset-0 bg-linear-to-r from-[#08090d] via-transparent to-[#08090d]" />
        </div>

        <div class="relative mx-auto max-w-390 px-3 pb-8 pt-40 sm:px-6 sm:pb-12 sm:pt-52 lg:px-8 lg:pt-56 xl:px-10">
          <div class="lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-6">
            <aside class="mb-3 flex flex-col items-center text-center lg:mb-6 lg:items-start lg:text-left">
              <img :src="movie.thumb || movie.poster" :alt="movie.name"
                class="mx-auto aspect-2/3 w-29 rounded-md object-cover shadow-xl shadow-black/40 sm:w-52 lg:w-full">

              <h1 class="mt-4 text-[1.35rem] font-black leading-tight sm:text-2xl lg:mt-5">{{ movie.name }}</h1>
              <p v-if="movie.originName" class="mt-1 text-sm font-bold text-slate-100 sm:text-sky-200">{{
                movie.originName }}</p>

              <div class="mt-3 hidden flex-wrap justify-center gap-2 text-xs font-black sm:flex lg:justify-start">
                <span v-if="movie.quality" class="rounded bg-white/12 px-2 py-1">{{ movie.quality }}</span>
                <span v-if="movie.episode" class="rounded bg-white/12 px-2 py-1">{{ movie.episode }}</span>
                <span v-if="movie.time" class="rounded bg-white/12 px-2 py-1">{{ movie.time }}</span>
                <span v-if="movie.rating" class="inline-flex items-center gap-1 rounded bg-white/12 px-2 py-1">
                  <Star class="size-3 fill-sky-300 text-sky-300" />
                  {{ movie.rating.toFixed(1) }}
                </span>
              </div>

              <div v-if="movie.categories?.length" class="mt-3 hidden sm:block lg:mt-4">
                <span class="rounded bg-white/12 px-3 py-1 text-xs font-bold">{{ movie.categories[0] }}</span>
              </div>

              <div class="mt-4 hidden space-y-3 text-sm leading-6 text-slate-300 sm:block lg:mt-5">
                <p v-if="movie.content">
                  <span class="block font-black text-white">Giới thiệu:</span>
                  {{ movie.content }}
                </p>
                <p><span class="font-black text-white">Số tập:</span> {{
                  episodeCount || movie.episode || 'Đang cập nhật'
                }}</p>
                <p v-if="movie.countries?.length"><span class="font-black text-white">Quốc gia:</span> {{
                  movie.countries.join(', ') }}</p>
                <p v-if="actorSummary"><span class="font-black text-white">Diễn viên:</span> {{
                  actorSummary }}</p>
              </div>
            </aside>

            <section
              class="mt-0 rounded-none border-y border-white/10 bg-transparent px-0 pb-0 pt-3 shadow-none sm:mt-0 sm:rounded-md sm:border sm:bg-[#15161b]/95 sm:p-5 sm:shadow-2xl sm:shadow-black/40 lg:p-5">
              <button type="button"
                class="mx-auto flex items-center gap-1 pb-3 text-sm font-bold text-sky-200 sm:hidden"
                :aria-expanded="movieInfoOpen" @click="movieInfoOpen = !movieInfoOpen">
                <span>Thông tin phim</span>
                <ChevronDown class="size-4 transition" :class="movieInfoOpen ? 'rotate-180' : ''" />
              </button>

              <div v-if="movieInfoOpen"
                class="mb-4 space-y-3 border-b border-white/10 pb-4 text-sm leading-6 text-slate-300 sm:hidden">
                <p v-if="movie.content">
                  <span class="block font-black text-white">Giới thiệu:</span>
                  {{ movie.content }}
                </p>
                <p><span class="font-black text-white">Số tập:</span> {{
                  episodeCount || movie.episode || 'Đang cập nhật'
                }}</p>
                <p v-if="movie.countries?.length"><span class="font-black text-white">Quốc gia:</span> {{
                  movie.countries.join(', ') }}</p>
                <p v-if="actorSummary"><span class="font-black text-white">Diễn viên:</span> {{
                  actorSummary }}</p>
              </div>

              <div class="hidden">
                <p class="text-sm font-black text-white">Nguồn API</p>
                <div class="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <NuxtLink v-for="source in sourceOptions" :key="source.value" :to="sourceLink(source.value)"
                    class="shrink-0 rounded-md px-4 py-2 text-sm font-black transition"
                    :class="activeSource === source.value ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'">
                    {{ source.label }}
                  </NuxtLink>
                </div>
              </div>

              <div
                class="flex flex-col gap-4 border-b border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
                <div class="flex flex-wrap justify-center gap-3 sm:justify-start">
                  <NuxtLink :to="firstWatchLink"
                    class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-sky-400 to-sky-300 px-7 text-sm font-black text-slate-950 transition hover:from-sky-300 hover:to-white sm:w-auto">
                    <Play class="size-4 fill-current" />
                    Xem Ngay
                  </NuxtLink>
                </div>

                <div class="flex flex-col gap-3 sm:items-end">
                  <div class="flex items-center justify-center gap-2 sm:justify-end">
                    <span class="text-xs font-black text-slate-300">Nguồn API</span>
                    <NuxtLink v-for="source in sourceOptions" :key="source.value" :to="sourceLink(source.value)"
                      class="shrink-0 rounded-md px-4 py-2 text-sm font-black transition"
                      :class="activeSource === source.value ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'">
                      {{ source.label }}
                    </NuxtLink>
                  </div>

                  <div class="flex items-center justify-between gap-3 px-8 sm:justify-center sm:px-0">
                  <button type="button"
                    class="flex cursor-pointer flex-col items-center gap-1 text-xs font-bold transition hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
                    :class="isFavoriteMovie ? 'text-sky-300' : 'text-white'" aria-label="Yêu thích"
                    :disabled="actionBusy" @click="toggleFavorite">
                    <Heart class="size-5" :class="isFavoriteMovie ? 'fill-current' : ''" />
                    <span>{{ isFavoriteMovie ? 'Đã thích' : 'Yêu thích' }}</span>
                  </button>
                  <button type="button"
                    class="flex cursor-pointer flex-col items-center gap-1 text-xs font-bold text-white transition hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Thêm vào" :disabled="actionBusy" @click="addToWatchLater">
                    <Plus class="size-5" />
                    <span>Thêm vào</span>
                  </button>
                  <button type="button"
                    class="flex cursor-pointer flex-col items-center gap-1 text-xs font-bold text-white transition hover:text-sky-200"
                    aria-label="Chia sẻ" @click="shareMovie">
                    <Share2 class="size-5" />
                    <span>Chia sẻ</span>
                  </button>
                  <div v-if="movie.rating"
                    class="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-3 py-1.5 text-sm font-black text-slate-950">
                    <Star class="size-3.5 fill-current" />
                    {{ movie.rating.toFixed(1) }}
                  </div>
                </div>
                <p v-if="actionMessage"
                  class="mt-2 text-center text-xs font-bold text-sky-200 sm:text-right">
                  {{ actionMessage }}
                </p>
              </div>
              </div>

              <div
                class="mt-3 flex justify-between gap-6 border-b border-white/10 px-6 text-sm font-black sm:mt-0 sm:justify-center sm:px-0 sm:pt-5">
                <button type="button" class="px-5 pb-3 sm:px-0"
                  :class="activeTab === 'episodes' ? 'border-b-2 border-sky-300 text-sky-200' : 'text-slate-300'"
                  @click="activeTab = 'episodes'">Tập phim</button>
                <button type="button" class="px-5 pb-3 sm:px-0"
                  :class="activeTab === 'actors' ? 'border-b-2 border-sky-300 text-sky-200' : 'text-slate-300'"
                  @click="activeTab = 'actors'">Diễn viên</button>
              </div>

              <div v-if="activeTab === 'episodes'" class="px-0 pt-6 sm:px-0 sm:pt-5">
                <h2 class="text-[1.08rem] font-black sm:text-xl">Danh sách tập</h2>

                <div v-if="servers.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-2">
                  <button v-for="(server, index) in servers" :key="server.name" type="button"
                    class="shrink-0 rounded px-4 py-2 text-sm font-black"
                    :class="selectedServer === index ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                    @click="selectedServer = index">
                    {{ server.name }}
                  </button>
                </div>

                <div v-if="activeServer?.episodes?.length"
                  class="mt-3 grid grid-cols-3 gap-2 rounded-md border border-white/10 p-3 sm:grid-cols-3 lg:grid-cols-6">
                  <NuxtLink v-for="(episode, index) in activeServer.episodes" :key="`${episode.name}-${index}`"
                    :to="episodeLink(index)"
                    class="rounded-md bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition first:bg-sky-400 first:text-slate-950 hover:bg-sky-400 hover:text-slate-950">
                    {{ formatEpisodeName(episode.name, index) }}
                  </NuxtLink>
                </div>

                <p v-else class="mt-4 rounded-md border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                  Chưa có tập xem từ nguồn này.
                </p>
              </div>

              <div v-else class="px-0 pt-6 sm:px-0 sm:pt-5">
                <h2 class="text-[1.08rem] font-black sm:text-xl">Diễn viên</h2>

                <div v-if="actors.length" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div v-for="actor in actors" :key="actor.name"
                    class="flex min-w-0 items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                    <img v-if="actor.avatar" :src="actor.avatar" :alt="actor.name"
                      class="size-14 shrink-0 rounded-md object-cover">
                    <div v-else
                      class="grid size-14 shrink-0 place-items-center rounded-md bg-sky-400/18 text-lg font-black text-sky-100 ring-1 ring-sky-300/20">
                      {{ actorInitial(actor.name) }}
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-sm font-black text-white">{{ actor.name }}</p>
                      <p class="mt-1 truncate text-xs font-semibold text-sky-200">
                        {{ actor.originalName || 'Tên quốc tế đang cập nhật' }}
                      </p>
                      <p class="mt-1 truncate text-xs font-semibold text-slate-400">
                        {{ actor.role || 'Vai diễn đang cập nhật' }}
                      </p>
                    </div>
                  </div>
                </div>

                <p v-else class="mt-4 rounded-md border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                  Nguồn này chưa có dữ liệu diễn viên.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
