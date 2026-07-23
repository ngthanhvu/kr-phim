<script setup lang="ts">
import { ChevronDown, Heart, MessageCircle, Play, Plus, Server, Share2, Star, Video } from 'lucide-vue-next'

const route = useRoute()
const requestedSource = computed(() => String(route.query.source || 'nguonc'))
const requestedSources = computed(() => typeof route.query.srcs === 'string' ? route.query.srcs : '')
const selectedServer = ref(0)
const movieInfoOpen = ref(false)
const contentExpanded = ref(false)
const activeTab = ref<'episodes' | 'actors'>('episodes')
const isFavoriteMovie = ref(false)
const actionMessage = ref('')
const actionBusy = ref(false)
const {
  isFavorite,
  saveFavorite,
  removeFavorite,
  saveWatchLater,
} = useMovieLibrary()

const { data: movie, pending, error } = await useFetch(() => `/api/movies/${route.params.slug}`, {
  query: computed(() => ({
    source: requestedSource.value,
    srcs: requestedSources.value || undefined,
  })),
  watch: [requestedSource, requestedSources],
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value])
const activeSource = computed(() => String(activeServer.value?.source || movie.value?.source || route.query.source || 'nguonc'))
const activeSourceSlug = computed(() => String(activeServer.value?.sourceSlug || movie.value?.slug || route.params.slug))
const activeSourceServerIndex = computed(() => Number(activeServer.value?.sourceServerIndex ?? 0))
const sourceOptions = computed(() =>
  (movie.value?.sources || [{ source: activeSource.value, slug: activeSourceSlug.value }])
    .map((source: any) => ({
      label: String(source.source || '').toUpperCase(),
      value: source.source,
      slug: source.slug,
    }))
    .filter((source: any) => source.value && source.slug),
)
const actors = computed(() => movie.value?.actors ?? [])
const actorSummary = computed(() => actors.value.map((actor: any) => actor.name).filter(Boolean).slice(0, 6).join(', '))
const firstWatchLink = computed(() => ({
  path: `/xem/${activeSourceSlug.value}`,
  query: {
    source: activeSource.value,
    srcs: requestedSources.value || undefined,
    server: activeSourceServerIndex.value,
    ep: 1,
  },
}))
const episodeCount = computed(() => {
  const total = servers.value.reduce((t: number, s: any) => t + (s.episodes?.length || 0), 0)
  return total || undefined
})
const libraryItem = computed(() => {
  if (!movie.value) return null
  return {
    source: activeSource.value,
    slug: activeSourceSlug.value,
    name: movie.value.name,
    originName: movie.value.originName,
    thumb: movie.value.thumb,
    poster: movie.value.poster,
    updatedAt: Date.now(),
  }
})

function episodeLink(index: number) {
  return {
    path: `/xem/${activeSourceSlug.value}`,
    query: {
      source: activeSource.value,
      srcs: requestedSources.value || undefined,
      server: activeSourceServerIndex.value,
      ep: index + 1,
    },
  }
}

function getEpisodeDisplay() {
  const ep = movie.value?.episode
  const total = movie.value?.episodeTotal
  if (!ep) return undefined
  const totalNum = total ? total.replace(/[^0-9]/g, '') : ''
  const epNum = ep.replace(/[^0-9]/g, '')
  if (epNum && totalNum && epNum !== totalNum) {
    return `Tập ${epNum}/${totalNum}`
  }
  return ep
}

function serverLabel(server: any, index: number) {
  const label = String(server?.name || '').replace(/^(ophim|nguonc|kkphim)\s*-\s*/i, '').trim()
  return label || `Server ${index + 1}`
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
    flashActionMessage('Đã lưu vào yêu thích.')
  }
  actionBusy.value = false
}

async function addToWatchLater() {
  if (!libraryItem.value || actionBusy.value) return
  actionBusy.value = true
  await saveWatchLater(libraryItem.value)
  actionBusy.value = false
  flashActionMessage('Đã thêm vào danh sách xem sau.')
}

async function shareMovie() {
  if (!import.meta.client || !movie.value) return
  const shareUrl = window.location.href
  const shareTitle = `${movie.value.name} - CineK`
  try {
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text: movie.value.originName || movie.value.name, url: shareUrl })
      return
    }
    await navigator.clipboard.writeText(shareUrl)
    flashActionMessage('Đã copy link phim.')
  } catch {
    flashActionMessage('Chưa chia sẻ được, bạn thử lại nhé.')
  }
}

onMounted(async () => {
  await refreshFavoriteState()
  await $fetch(`/api/movies/${route.params.slug}/view`, {
    method: 'POST',
    query: { source: route.query.source },
  }).catch(() => { })
})

watch(requestedSource, () => { selectedServer.value = 0 })
watch(requestedSources, () => { selectedServer.value = 0 })
watch(libraryItem, () => { refreshFavoriteState() })

useHead(() => ({
  title: movie.value ? `${movie.value.name} - Xem phim online - CineK` : 'Đang tải phim - CineK',
  meta: [
    { name: 'description', content: movie.value ? `Xem ${movie.value.name} online` : 'Xem phim Hàn Quốc online' },
    { property: 'og:title', content: movie.value ? `${movie.value.name} - CineK` : 'CineK' },
    { property: 'og:description', content: movie.value?.content || '' },
    { property: 'og:image', content: movie.value?.poster || movie.value?.thumb || '/icon.png' },
  ],
}))
</script>

<template>
  <div class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <!-- Loading -->
    <div v-if="pending" class="mx-auto max-w-350 px-4 pt-36 sm:px-6 lg:px-8 xl:px-10">
      <div class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div class="h-112 animate-pulse rounded-xl bg-white/10" />
        <div class="space-y-4">
          <div class="h-10 w-3/4 animate-pulse rounded bg-white/10" />
          <div class="h-6 w-1/2 animate-pulse rounded bg-white/10" />
          <div class="h-40 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Phim có thể đang được cập nhật hoặc chưa có tập xem.</p>
      </div>
    </div>

    <!-- Movie Detail -->
    <template v-else>
      <!-- Hero Backdrop -->
      <section class="relative h-52.5 md:h-150 lg:h-[70vh] xl:max-h-200 overflow-hidden bg-[#0f111a]">
        <img :src="movie.poster || movie.thumb" :alt="movie.name"
          class="absolute inset-0 h-full w-full object-cover object-center scale-105 opacity-70 md:opacity-80">
        <div class="absolute inset-0 hidden md:block"
          style="mask-image:radial-gradient(ellipse at center, transparent 50%, black 100%)" />
        <img :src="movie.poster || movie.thumb" :alt="movie.name"
          class="absolute inset-0 h-full w-full object-cover object-center blur-sm md:blur-md scale-110 opacity-90 md:hidden">
        <div class="absolute inset-0 pointer-events-none opacity-20 md:opacity-30"
          style="background-image:radial-gradient(rgba(250,204,21,0.3) 0.5px, transparent 1px);background-size:2px 2px" />
        <div class="absolute bottom-0 inset-x-0 h-[80%] pointer-events-none md:hidden"
          style="background:linear-gradient(to top, #0f111a, transparent)" />
        <div class="absolute inset-0 pointer-events-none hidden md:block"
          style="background:linear-gradient(to top, #0f111a 0%, transparent 40%)" />
      </section>

      <!-- Content overlaps hero -->
      <div class="max-w-350 mx-auto px-4 -mt-24 md:-mt-48 lg:-mt-64 relative z-10 mb-20">
        <div class="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          <!-- Poster Column -->
          <div class="shrink-0 w-40 md:w-56 lg:w-64 max-w-70 mx-auto md:mx-0 flex flex-col gap-8">
            <div
              class="relative rounded-xl overflow-hidden shadow-2xl shadow-[#0f111a]/50 ring-1 ring-white/10 bg-[#16161e] w-full aspect-2/3">
              <img :src="movie.poster || movie.thumb" :alt="movie.name"
                class="w-full h-full object-cover relative z-10">
            </div>

            <!-- Synopsis (desktop) -->
            <div class="hidden md:block">
              <h3 class="text-[16px] font-semibold text-white mb-3">Nội dung phim</h3>
              <p class="text-sm text-slate-300 leading-relaxed" :class="contentExpanded ? '' : 'line-clamp-4'">
                {{ movie.content || 'Đang cập nhật nội dung phim.' }}
              </p>
              <button v-if="movie.content" type="button"
                class="mt-2 text-xs font-semibold text-yellow-300 transition hover:text-yellow-200"
                @click="contentExpanded = !contentExpanded">
                {{ contentExpanded ? 'Thu gọn' : 'Xem thêm' }}
              </button>
            </div>
          </div>

          <!-- Info Column -->
          <div class="flex-1 md:pt-12 min-w-0">
            <!-- Title -->
            <h1 class="text-[22px] md:text-3xl font-bold text-white mb-1 text-center md:text-left leading-tight">
              {{ movie.name }}
            </h1>
            <p v-if="movie.originName" class="text-[13px] md:text-sm text-slate-400 mb-4 text-center md:text-left">
              {{ movie.originName }}
            </p>

            <!-- Badges -->
            <div class="hidden md:flex flex-wrap items-center gap-2 text-white/90 mb-4 text-[10px] md:text-xs">
              <span v-if="movie.quality"
                class="inline-flex items-center justify-center rounded-sm font-black leading-none tracking-normal h-5.5 px-2 text-[11px]"
                style="background-color:#ffd875;background-image:linear-gradient(220deg, #ffd875 0%, #ffe7a8 45%, #ffffff 100%);color:#141414">
                {{ movie.quality }}
              </span>
              <span v-if="movie.lang"
                class="px-2 py-0.75 rounded border border-white bg-black/20 backdrop-blur-sm font-medium">
                {{ movie.lang }}
              </span>
              <span v-if="getEpisodeDisplay()"
                class="px-2 py-0.75 rounded border border-white bg-black/20 backdrop-blur-sm font-medium">
                {{ getEpisodeDisplay() }}
              </span>
              <span v-if="movie.rating"
                class="inline-flex items-center rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                <span class="bg-[#01B4E4] text-white px-1.5 py-0.5 font-bold">TMDb</span>
                <span class="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{{ movie.rating.toFixed(1) }}</span>
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <NuxtLink :to="firstWatchLink"
                class="inline-flex justify-center items-center gap-2 md:gap-2.5 px-6 md:px-8 py-3.5 md:py-3 text-[#0f1115] text-[15px] md:text-base font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-[#F5C518]/20 hover:shadow-[#F5C518]/40"
                style="background:linear-gradient(135deg, #F5C518 0%, #FFD700 50%, #FFC107 100%)">
                <Play class="w-5 h-5 md:w-6 md:h-6 shrink-0 fill-current" />
                Xem ngay
              </NuxtLink>

              <div class="hidden md:flex items-center">
                <div class="w-px h-8 bg-white/10 mx-1" />
                <button type="button"
                  class="flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 active:scale-95 px-3"
                  :class="isFavoriteMovie ? 'text-yellow-300' : 'text-white/90'" :disabled="actionBusy"
                  @click="toggleFavorite">
                  <Heart class="size-5" :class="isFavoriteMovie ? 'fill-current' : ''" />
                  <span class="text-[11px]">{{ isFavoriteMovie ? 'Đã thích' : 'Yêu thích' }}</span>
                </button>
                <div class="w-px h-8 bg-white/10 mx-1" />
                <button type="button"
                  class="flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 active:scale-95 px-3 text-white/90"
                  :disabled="actionBusy" @click="addToWatchLater">
                  <Plus class="size-5" />
                  <span class="text-[11px]">Thêm vào</span>
                </button>
                <div class="w-px h-8 bg-white/10 mx-1" />
                <button type="button"
                  class="flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 active:scale-95 px-3 text-white/90"
                  @click="shareMovie">
                  <Share2 class="size-5" />
                  <span class="text-[11px]">Chia sẻ</span>
                </button>
              </div>
            </div>

            <!-- Mobile action buttons -->
            <div class="flex md:hidden gap-5 justify-center pt-2 mb-4">
              <button type="button"
                class="flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                :class="isFavoriteMovie ? 'text-yellow-300' : 'text-white/90'" :disabled="actionBusy"
                @click="toggleFavorite">
                <Heart class="size-6" :class="isFavoriteMovie ? 'fill-current' : ''" />
                <span class="text-[11px]">Yêu thích</span>
              </button>
              <button type="button"
                class="flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-white/90"
                :disabled="actionBusy" @click="addToWatchLater">
                <Plus class="size-6" />
                <span class="text-[11px]">Thêm vào</span>
              </button>
              <button type="button"
                class="flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-white/90"
                @click="shareMovie">
                <Share2 class="size-6" />
                <span class="text-[11px]">Chia sẻ</span>
              </button>
            </div>

            <p v-if="actionMessage" class="mb-4 text-center text-xs font-bold text-yellow-200">
              {{ actionMessage }}
            </p>

            <!-- Info Table (Desktop) -->
            <div class="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-5">
              <div class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Trạng thái:</span>
                <span class="text-slate-200">{{ getEpisodeDisplay() || movie.episode || 'Đang cập nhật' }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Loại:</span>
                <span class="text-slate-200">{{ movie.type === 'single' ? 'Phim lẻ' : movie.type === 'series' ?
                  'Phim bộ' : movie.type || 'Đang cập nhật' }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Năm:</span>
                <span class="text-slate-200">{{ movie.year || 'Đang cập nhật' }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Thể loại:</span>
                <span class="text-slate-200">{{ movie.categories?.join(', ') || 'Đang cập nhật' }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Quốc gia:</span>
                <span class="text-slate-200">{{ movie.countries?.join(', ') || 'Đang cập nhật' }}</span>
              </div>
              <div v-if="actors.length" class="flex items-start gap-2">
                <span class="text-slate-500 shrink-0 w-20">Diễn viên:</span>
                <span class="text-slate-200">{{ actorSummary }}</span>
              </div>
            </div>

            <!-- Mobile collapsible info -->
            <div class="md:hidden mb-4">
              <button type="button"
                class="w-full flex items-center justify-between text-sm font-semibold text-yellow-200 py-2"
                @click="movieInfoOpen = !movieInfoOpen">
                <span>Thông tin phim</span>
                <ChevronDown class="size-4 transition" :class="movieInfoOpen ? 'rotate-180' : ''" />
              </button>
              <div v-if="movieInfoOpen" class="space-y-2 text-sm text-slate-300">
                <div class="flex flex-wrap gap-2 text-[10px] mb-3">
                  <span v-if="movie.quality"
                    class="inline-flex items-center justify-center rounded-sm font-black h-5.5 px-2 text-[11px]"
                    style="background-color:#ffd875;background-image:linear-gradient(220deg, #ffd875 0%, #ffe7a8 45%, #ffffff 100%);color:#141414">
                    {{ movie.quality }}
                  </span>
                  <span v-if="movie.lang"
                    class="px-2 py-0.75 rounded border border-white bg-black/20 backdrop-blur-sm font-medium">
                    {{ movie.lang }}
                  </span>
                  <span v-if="getEpisodeDisplay()"
                    class="px-2 py-0.75 rounded border border-white bg-black/20 backdrop-blur-sm font-medium">
                    {{ getEpisodeDisplay() }}
                  </span>
                  <span v-if="movie.rating"
                    class="inline-flex items-center rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                    <span class="bg-[#01B4E4] text-white px-1.5 py-0.5 font-bold">TMDb</span>
                    <span class="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{{ movie.rating.toFixed(1) }}</span>
                  </span>
                </div>

                <div class="flex gap-2"><span class="text-slate-500 shrink-0 w-20">Trạng thái:</span><span>{{
                  getEpisodeDisplay() || movie.episode || 'Đang cập nhật' }}</span></div>
                <div class="flex gap-2"><span class="text-slate-500 shrink-0 w-20">Loại:</span><span>{{ movie.type ===
                  'single' ? 'Phim lẻ' : movie.type === 'series' ? 'Phim bộ' : movie.type || 'Đang cập nhật' }}</span>
                </div>
                <div class="flex gap-2"><span class="text-slate-500 shrink-0 w-20">Năm:</span><span>{{ movie.year ||
                  'Đang cập nhật' }}</span></div>
                <div class="flex gap-2"><span class="text-slate-500 shrink-0 w-20">Thể loại:</span><span>{{
                  movie.categories?.join(', ') || 'Đang cập nhật' }}</span></div>
                <div class="flex gap-2"><span class="text-slate-500 shrink-0 w-20">Quốc gia:</span><span>{{
                  movie.countries?.join(', ') || 'Đang cập nhật' }}</span></div>

                <div v-if="movie.content" class="pt-3 border-t border-white/10">
                  <h3 class="text-[14px] font-semibold text-white mb-2">Nội dung phim</h3>
                  <p class="text-sm text-slate-300 leading-relaxed" :class="contentExpanded ? '' : 'line-clamp-3'">
                    {{ movie.content }}
                  </p>
                  <button type="button" class="mt-1 text-xs font-semibold text-yellow-300"
                    @click="contentExpanded = !contentExpanded">
                    {{ contentExpanded ? 'Thu gọn' : 'Xem thêm' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Tabs: Episodes / Actors (inside info column) -->
            <div class="mt-6 border-t border-white/10 pt-6">
              <div class="flex items-center gap-6 border-b border-white/10 mb-6 overflow-x-auto">
                <button type="button"
                  class="pb-3 text-[13px] md:text-[15px] font-semibold transition-colors relative whitespace-nowrap"
                  :class="activeTab === 'episodes' ? 'text-[#F5C518]' : 'text-slate-400 hover:text-white'"
                  @click="activeTab = 'episodes'">
                  Tập phim
                  <span v-if="activeTab === 'episodes'"
                    class="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5C518] rounded-t-md" />
                </button>
                <button type="button"
                  class="pb-3 text-[13px] md:text-[15px] font-semibold transition-colors relative whitespace-nowrap"
                  :class="activeTab === 'actors' ? 'text-[#F5C518]' : 'text-slate-400 hover:text-white'"
                  @click="activeTab = 'actors'">
                  Diễn viên
                  <span v-if="activeTab === 'actors'"
                    class="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5C518] rounded-t-md" />
                </button>
              </div>

              <!-- Episodes Tab -->
              <div v-if="activeTab === 'episodes'">
                <!-- Server Selector -->
                <div v-if="servers.length > 1" class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
                  <div class="flex items-center gap-1.5 text-[13px] font-semibold text-white/50 mr-1">
                    <Server class="size-4" />
                    Máy chủ:
                  </div>
                  <button v-for="(server, index) in servers" :key="server.name" type="button"
                    class="group flex items-center gap-1.5 text-[13px] transition-colors rounded-md px-3.5 py-2 border font-medium"
                    :class="selectedServer === index
                      ? 'border-white/30 text-white bg-white/5'
                      : 'border-transparent text-white/60 hover:text-white'" @click="selectedServer = index">
                    <span>{{ serverLabel(server, index) }}</span>
                    <span class="w-5 h-5 rounded-full font-bold text-[10px]"
                      :class="selectedServer === index ? 'bg-white text-black' : 'bg-white/20 text-white'">
                      {{ server.episodes?.length || 0 }}
                    </span>
                  </button>
                </div>

                <!-- Episode Grid -->
                <div v-if="activeServer?.episodes?.length"
                  class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-2.5 gap-y-2.5">
                  <NuxtLink v-for="(episode, index) in activeServer.episodes" :key="`${episode.name}-${index}`"
                    :to="episodeLink(index)"
                    class="group flex items-center justify-center gap-1.5 rounded-lg transition-all py-2.5 px-2 text-[13px] bg-[#191b24] text-white/90 hover:text-[#FFD166] hover:bg-[#1f2130] shadow-sm">
                    <Play class="size-3 fill-current" />
                    {{ formatEpisodeName(episode.name, index) }}
                  </NuxtLink>
                </div>

                <p v-else
                  class="mt-2 rounded-lg border border-white/10 bg-[#191b24] p-6 text-center text-sm text-slate-400">
                  Chưa có tập xem từ server này.
                </p>
              </div>

              <!-- Actors Tab -->
              <div v-if="activeTab === 'actors'">
                <div v-if="actors.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div v-for="actor in actors" :key="actor.name"
                    class="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#191b24] p-3 transition hover:border-white/20">
                    <img v-if="actor.avatar" :src="actor.avatar" :alt="actor.name"
                      class="size-14 shrink-0 rounded-lg object-cover">
                    <div v-else
                      class="grid size-14 shrink-0 place-items-center rounded-lg bg-yellow-400/18 text-lg font-black text-yellow-100">
                      {{ actorInitial(actor.name) }}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-white">{{ actor.name }}</p>
                      <p v-if="actor.originalName" class="mt-0.5 truncate text-xs text-yellow-200/70">{{
                        actor.originalName }}</p>
                      <p v-if="actor.role" class="mt-0.5 truncate text-xs text-slate-400">{{ actor.role }}</p>
                    </div>
                  </div>
                </div>
                <p v-else
                  class="mt-4 rounded-lg border border-white/10 bg-[#191b24] p-6 text-center text-sm text-slate-400">
                  Chưa có thông tin diễn viên.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Comment Section -->
        <div class="mt-10 border-t border-white/10 pt-8">
          <div class="flex items-center gap-3 mb-6">
            <MessageCircle class="size-5 text-yellow-300" />
            <h2 class="text-xl font-bold text-white">Bình luận</h2>
          </div>
          <div
            class="flex flex-col items-center justify-center py-10 text-center border border-white/10 rounded-xl bg-[#191b24]">
            <MessageCircle class="size-10 text-slate-500 mb-3" />
            <p class="text-sm text-slate-400">Tính năng bình luận đang được phát triển.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
