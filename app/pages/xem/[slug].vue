<script setup lang="ts">
import type Hls from 'hls.js'
import {
  FastForward,
  Heart,
  Loader2,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  Plus,
  Rewind,
  Settings,
  Share2,
  SkipForward,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'

const route = useRoute()
const selectedServer = ref(Math.max(Number(route.query.server || 0), 0))
const selectedEpisode = ref(Math.max(Number(route.query.ep || 1) - 1, 0))
const hasStarted = ref(false)
const isFavoriteMovie = ref(false)
const actionMessage = ref('')
const actionBusy = ref(false)
const progressSeconds = ref(0)
const playerMode = ref<'embed' | 'hls'>('embed')
const playerShellRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const isVideoPlaying = ref(false)
const isVideoBuffering = ref(false)
const videoDuration = ref(0)
const videoCurrentTime = ref(0)
const isVideoMuted = ref(false)
const videoVolume = ref(1)
const playbackRate = ref(1)
const selectedQuality = ref(-1)
const qualityLevels = ref<{ label: string, level: number }[]>([])
const isSettingsOpen = ref(false)
const hlsErrorMessage = ref('')
const controlsVisible = ref(true)
const pendingResumeSeconds = ref(0)
let controlsHideTimer: ReturnType<typeof setTimeout> | undefined
let touchStartX = 0
let touchStartY = 0
let touchStartAt = 0
let hlsPlayer: Hls | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
let lastSavedProgress = 0
const {
  loadWatchHistory: fetchWatchHistory,
  saveWatchHistory: persistWatchHistory,
} = useWatchHistory()
const { user, initAuth } = useSupabaseAuth()
const {
  isFavorite,
  saveFavorite,
  removeFavorite,
  saveWatchLater,
} = useMovieLibrary()

const { data: movie, pending, error } = await useFetch(`/api/movies/${route.params.slug}`, {
  query: {
    source: route.query.source,
  },
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value] ?? servers.value[0])
const activeEpisode = computed(() => activeServer.value?.episodes?.[selectedEpisode.value] ?? activeServer.value?.episodes?.[0])
const embedPlayerUrl = computed(() => activeEpisode.value?.linkEmbed || '')
const hlsPlayerUrl = computed(() => activeEpisode.value?.linkM3u8 || '')
const playerUrl = computed(() => playerMode.value === 'hls' ? hlsPlayerUrl.value : (embedPlayerUrl.value || hlsPlayerUrl.value))
const canUseEmbed = computed(() => Boolean(embedPlayerUrl.value))
const canUseHls = computed(() => Boolean(hlsPlayerUrl.value))
const actorSummary = computed(() => (movie.value?.actors ?? []).map((actor: any) => actor.name).filter(Boolean).slice(0, 6).join(', '))
const durationSeconds = computed(() => Math.floor(videoDuration.value || parseDurationSeconds(movie.value?.time || '')))
const hasNextEpisode = computed(() => Boolean(activeServer.value?.episodes?.[selectedEpisode.value + 1]))
const progressPercent = computed(() => {
  if (!durationSeconds.value || !progressSeconds.value) return 0
  return Math.min(Math.max((progressSeconds.value / durationSeconds.value) * 100, 0), 100)
})
const skipIntroSeconds = 85
const skipOutroSeconds = computed(() => Math.max((durationSeconds.value || 0) - 85, 0))
const libraryItem = computed(() => {
  if (!movie.value) return null

  return {
    source: String(route.query.source || movie.value.source || ''),
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
      source: route.query.source,
      server: selectedServer.value,
      ep: index + 1,
    },
  }
}

function selectServer(index: number) {
  selectedServer.value = index
  selectedEpisode.value = 0
  hasStarted.value = false
  resetProgressTimer()
  destroyHlsPlayer()
}

async function startPlayer() {
  hasStarted.value = true
  await loadResumeProgress()
  startProgressTimer()
  saveWatchHistory()

  if (playerMode.value === 'hls') {
    nextTick(() => setupHlsPlayer(true))
  }
}

function selectPlayerMode(mode: 'embed' | 'hls') {
  if (mode === playerMode.value) return

  playerMode.value = mode
  isSettingsOpen.value = false
  hasStarted.value = false
  resetProgressTimer()
  destroyHlsPlayer()
}

function parseDurationSeconds(value: string) {
  const normalizedValue = value.toLowerCase()
  const hourMatch = normalizedValue.match(/(\d+)\s*(?:h|giờ|gio)/)
  const minuteMatch = normalizedValue.match(/(\d+)\s*(?:m|min|phút|phut|p)/)
  const compactMatch = normalizedValue.match(/^(\d+)$/)
  const hours = hourMatch ? Number(hourMatch[1]) : 0
  const minutes = minuteMatch ? Number(minuteMatch[1]) : compactMatch ? Number(compactMatch[1]) : 0

  return Math.max((hours * 60 + minutes) * 60, 0)
}

function resetProgressTimer() {
  progressSeconds.value = 0
  videoCurrentTime.value = 0
  videoDuration.value = 0
  isVideoPlaying.value = false
  isVideoBuffering.value = false
  hlsErrorMessage.value = ''
  pendingResumeSeconds.value = 0
  lastSavedProgress = 0
  stopProgressTimer()
}

function stopProgressTimer() {
  if (!progressTimer) return
  clearInterval(progressTimer)
  progressTimer = undefined
}

function tickProgress() {
  if (!hasStarted.value || (import.meta.client && document.visibilityState === 'hidden')) return

  if (playerMode.value === 'hls' && videoRef.value) {
    progressSeconds.value = Math.floor(videoRef.value.currentTime || 0)
    videoCurrentTime.value = progressSeconds.value
  } else {
    progressSeconds.value += 1
  }

  if (durationSeconds.value) {
    progressSeconds.value = Math.min(progressSeconds.value, durationSeconds.value)
  }

  if (progressSeconds.value - lastSavedProgress >= 10) {
    lastSavedProgress = progressSeconds.value
    saveWatchHistory()
  }
}

function startProgressTimer() {
  if (!import.meta.client || progressTimer) return
  progressTimer = setInterval(tickProgress, 1000)
}

function handleVisibilityChange() {
  if (!import.meta.client || document.visibilityState !== 'hidden' || !hasStarted.value) return
  saveWatchHistory()
}

function handleKeyboardShortcut(event: KeyboardEvent) {
  if (playerMode.value !== 'hls' || !hasStarted.value || !videoRef.value) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return

  const key = event.key.toLowerCase()

  if (key === ' ') {
    event.preventDefault()
    toggleHlsPlayback()
  } else if (key === 'arrowleft') {
    event.preventDefault()
    seekBy(-10)
  } else if (key === 'arrowright') {
    event.preventDefault()
    seekBy(10)
  } else if (key === 'f') {
    event.preventDefault()
    toggleFullscreen()
  } else if (key === 'm') {
    event.preventDefault()
    toggleMute()
  } else if (key === 'p') {
    event.preventDefault()
    togglePictureInPicture()
  }
}

function showControlsTemporarily() {
  controlsVisible.value = true
  if (controlsHideTimer) clearTimeout(controlsHideTimer)
  if (!isVideoPlaying.value || isSettingsOpen.value) return
  controlsHideTimer = setTimeout(() => {
    controlsVisible.value = false
  }, 2600)
}

function formatPlayerTime(seconds = 0) {
  const totalSeconds = Math.max(Math.floor(seconds), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

async function setupHlsPlayer(autoplay = false) {
  if (!import.meta.client || !videoRef.value || !hlsPlayerUrl.value) return

  destroyHlsPlayer()

  const video = videoRef.value
  isVideoBuffering.value = true
  hlsErrorMessage.value = ''
  video.volume = videoVolume.value
  video.muted = isVideoMuted.value
  video.playbackRate = playbackRate.value

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = hlsPlayerUrl.value
  } else {
    const { default: HlsPlayer } = await import('hls.js')

    if (!HlsPlayer.isSupported()) {
      hlsErrorMessage.value = 'Trình duyệt chưa hỗ trợ HLS, bạn dùng chế độ Nhúng nhé.'
      return
    }

    hlsPlayer = new HlsPlayer({
      enableWorker: true,
      lowLatencyMode: true,
    })
    hlsPlayer.on(HlsPlayer.Events.MANIFEST_PARSED, () => {
      qualityLevels.value = hlsPlayer?.levels
        .map((level, index) => ({
          label: level.height ? `${level.height}p` : `${Math.round((level.bitrate || 0) / 1000)}kbps`,
          level: index,
        }))
        .filter((level) => level.label !== '0kbps') ?? []
      selectedQuality.value = -1
      applyResumeProgress()
    })
    hlsPlayer.on(HlsPlayer.Events.ERROR, (_event, data) => {
      if (!data.fatal) return

      if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR) {
        hlsErrorMessage.value = 'Mạng đang chập chờn, đang thử tải lại...'
        hlsPlayer?.startLoad()
      } else if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR) {
        hlsErrorMessage.value = 'Video bị lỗi giải mã, đang thử khôi phục...'
        hlsPlayer?.recoverMediaError()
      } else {
        hlsErrorMessage.value = 'Link HLS đang lỗi, bạn chuyển sang chế độ Nhúng nhé.'
      }
    })
    hlsPlayer.loadSource(hlsPlayerUrl.value)
    hlsPlayer.attachMedia(video)
  }

  if (autoplay) {
    try {
      await video.play()
    } catch {
      isVideoPlaying.value = false
    }
  }
}

function destroyHlsPlayer() {
  if (hlsPlayer) {
    hlsPlayer.destroy()
    hlsPlayer = undefined
  }

  if (videoRef.value) {
    videoRef.value.removeAttribute('src')
    videoRef.value.load()
  }

  qualityLevels.value = []
  selectedQuality.value = -1
}

function updateVideoTime() {
  if (!videoRef.value) return
  videoCurrentTime.value = Math.floor(videoRef.value.currentTime || 0)
  progressSeconds.value = videoCurrentTime.value

  if (Number.isFinite(videoRef.value.duration)) {
    videoDuration.value = Math.floor(videoRef.value.duration || 0)
  }
}

function updateVideoMetadata() {
  updateVideoTime()
  applyResumeProgress()
  isVideoBuffering.value = false
}

async function loadResumeProgress() {
  if (!import.meta.client || !movie.value) return

  const source = String(route.query.source || movie.value.source || '')
  const historyItems = await fetchWatchHistory(30)
  const historyItem = historyItems.find((item) => item.slug === String(route.params.slug) && item.source === source)
  const savedProgress = Math.floor(historyItem?.progressSeconds || 0)

  if (!savedProgress || (historyItem?.episodeIndex ?? 0) !== selectedEpisode.value) return
  pendingResumeSeconds.value = savedProgress
  progressSeconds.value = savedProgress
  videoCurrentTime.value = savedProgress
}

function applyResumeProgress() {
  if (!videoRef.value || !pendingResumeSeconds.value) return
  const resumeAt = durationSeconds.value
    ? Math.min(pendingResumeSeconds.value, Math.max(durationSeconds.value - 8, 0))
    : pendingResumeSeconds.value

  videoRef.value.currentTime = resumeAt
  videoCurrentTime.value = Math.floor(resumeAt)
  progressSeconds.value = videoCurrentTime.value
  pendingResumeSeconds.value = 0
}

function toggleHlsPlayback() {
  if (!videoRef.value) return

  if (videoRef.value.paused) {
    videoRef.value.play()
  } else {
    videoRef.value.pause()
  }
}

function seekBy(seconds: number) {
  if (!videoRef.value) return
  const nextTime = Math.min(Math.max((videoRef.value.currentTime || 0) + seconds, 0), durationSeconds.value || Number.MAX_SAFE_INTEGER)
  videoRef.value.currentTime = nextTime
  updateVideoTime()
  showControlsTemporarily()
  saveWatchHistory()
}

function seekHlsPlayer(event: Event) {
  if (!videoRef.value) return
  const value = Number((event.target as HTMLInputElement).value)
  videoRef.value.currentTime = value
  updateVideoTime()
  saveWatchHistory()
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isVideoMuted.value = videoRef.value.muted
}

function changeVolume(event: Event) {
  if (!videoRef.value) return
  const value = Number((event.target as HTMLInputElement).value)
  videoVolume.value = value
  videoRef.value.volume = value
  videoRef.value.muted = value === 0
  isVideoMuted.value = videoRef.value.muted
}

function changePlaybackRate(event: Event) {
  if (!videoRef.value) return
  playbackRate.value = Number((event.target as HTMLSelectElement).value)
  videoRef.value.playbackRate = playbackRate.value
  showControlsTemporarily()
}

function changeQuality(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  selectedQuality.value = value
  if (hlsPlayer) hlsPlayer.currentLevel = value
  showControlsTemporarily()
}

function toggleFullscreen() {
  const target = videoRef.value?.parentElement
  if (!target) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    target.requestFullscreen()
  }
}

async function togglePictureInPicture() {
  if (!videoRef.value || !document.pictureInPictureEnabled) return

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture()
  } else {
    await videoRef.value.requestPictureInPicture()
  }
}

function skipIntro() {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.max(videoRef.value.currentTime, skipIntroSeconds)
  updateVideoTime()
}

function skipOutro() {
  if (!videoRef.value || !skipOutroSeconds.value) return
  videoRef.value.currentTime = skipOutroSeconds.value
  updateVideoTime()
}

function playNextEpisode(autoplay = true) {
  if (!hasNextEpisode.value) return
  selectedEpisode.value += 1
  hasStarted.value = false
  resetProgressTimer()
  destroyHlsPlayer()
  navigateTo(episodeLink(selectedEpisode.value), { replace: true })

  if (autoplay) {
    nextTick(() => startPlayer())
  }
}

function handleVideoEnded() {
  isVideoPlaying.value = false
  saveWatchHistory()
  playNextEpisode(true)
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartAt = Date.now()
}

function handleTouchEnd(event: TouchEvent) {
  if (!videoRef.value) return
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  const elapsed = Date.now() - touchStartAt

  if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) && elapsed < 700) {
    seekBy(deltaX > 0 ? 10 : -10)
    return
  }

  if (Math.abs(deltaY) > 48 && Math.abs(deltaY) > Math.abs(deltaX)) {
    const nextVolume = Math.min(Math.max(videoVolume.value + (deltaY < 0 ? 0.1 : -0.1), 0), 1)
    videoVolume.value = Number(nextVolume.toFixed(1))
    videoRef.value.volume = videoVolume.value
    videoRef.value.muted = videoVolume.value === 0
    isVideoMuted.value = videoRef.value.muted
  }
}

async function saveWatchHistory() {
  if (!import.meta.client || !movie.value) return

  const source = String(route.query.source || movie.value.source || '')
  const slug = String(route.params.slug)
  await persistWatchHistory({
    source,
    slug,
    name: movie.value.name,
    originName: movie.value.originName,
    thumb: movie.value.thumb,
    poster: movie.value.poster,
    episodeName: activeEpisode.value?.name,
    episodeIndex: selectedEpisode.value,
    serverIndex: selectedServer.value,
    progressSeconds: Math.floor(progressSeconds.value),
    durationSeconds: Math.floor(durationSeconds.value),
    updatedAt: Date.now(),
  })
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

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${movie.value.name} - KR Phim`,
        text: activeEpisode.value?.name || movie.value.originName || movie.value.name,
        url: window.location.href,
      })
      return
    }

    await navigator.clipboard.writeText(window.location.href)
    flashActionMessage('Đã copy link phim.')
  } catch {
    flashActionMessage('Chưa chia sẻ được, bạn thử lại nhé.')
  }
}

onMounted(async () => {
  await initAuth()
  await refreshFavoriteState()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('keydown', handleKeyboardShortcut)
})

onBeforeUnmount(() => {
  if (hasStarted.value) saveWatchHistory()
  stopProgressTimer()
  if (controlsHideTimer) clearTimeout(controlsHideTimer)
  destroyHlsPlayer()
  if (import.meta.client) document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (import.meta.client) document.removeEventListener('keydown', handleKeyboardShortcut)
})

watch(() => route.query, () => {
  selectedServer.value = Math.max(Number(route.query.server || 0), 0)
  selectedEpisode.value = Math.max(Number(route.query.ep || 1) - 1, 0)
  hasStarted.value = false
  resetProgressTimer()
  destroyHlsPlayer()
})

watch([movie, activeEpisode], () => {
  if (hasStarted.value) saveWatchHistory()
})

watch([canUseEmbed, canUseHls], () => {
  if (!canUseHls.value && playerMode.value === 'hls') playerMode.value = 'embed'
  if (!canUseEmbed.value && canUseHls.value) playerMode.value = 'hls'
}, {
  immediate: true,
})

watch([libraryItem, user], () => {
  refreshFavoriteState()
})

useHead(() => ({
  title: movie.value ? `Xem ${movie.value.name} - ${activeEpisode.value?.name || 'Tập 1'} - KR Phim` : 'Đang tải phim - KR Phim',
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

    <div v-if="pending" class="mx-auto min-h-screen max-w-390 px-4 pt-36 sm:px-6 lg:px-8 lg:pt-28 xl:px-10">
      <div class="aspect-video animate-pulse rounded-md bg-white/10" />
    </div>

    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Nguồn phim có thể đang chặn request hoặc phim chưa có tập xem.</p>
      </div>
    </div>

    <template v-else>
      <section class="mx-auto max-w-390 px-3 pb-16 pt-24 sm:px-6 sm:pt-36 lg:px-8 lg:pt-28 xl:px-10">
        <NuxtLink :to="{ path: `/phim/${route.params.slug}`, query: { source: route.query.source } }"
          class="text-sm font-bold text-slate-100 hover:text-emerald-200">
          ‹ Chi tiết phim
        </NuxtLink>

        <div class="mt-4 overflow-hidden rounded-md border border-white/10 bg-black shadow-2xl shadow-black/40">
          <div class="grid grid-cols-2 gap-2 border-b border-white/10 bg-slate-950/92 p-2 sm:hidden">
            <button type="button"
              class="rounded-md px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="playerMode === 'embed' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-100'"
              :disabled="!canUseEmbed" @click="selectPlayerMode('embed')">
              Nhúng
            </button>
            <button type="button"
              class="rounded-md px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="playerMode === 'hls' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-100'"
              :disabled="!canUseHls" @click="selectPlayerMode('hls')">
              HLS
            </button>
          </div>

          <div class="relative aspect-video bg-slate-950">
            <div
              class="absolute left-3 top-3 z-20 hidden rounded-md border border-white/10 bg-black/65 p-1 text-xs font-black text-white backdrop-blur sm:inline-flex">
              <button type="button" class="rounded px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-40"
                :class="playerMode === 'embed' ? 'bg-emerald-400 text-slate-950' : 'text-slate-200 hover:bg-white/10'"
                :disabled="!canUseEmbed" @click="selectPlayerMode('embed')">
                Nhúng
              </button>
              <button type="button" class="rounded px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-40"
                :class="playerMode === 'hls' ? 'bg-emerald-400 text-slate-950' : 'text-slate-200 hover:bg-white/10'"
                :disabled="!canUseHls" @click="selectPlayerMode('hls')">
                HLS
              </button>
            </div>

            <iframe v-if="playerMode === 'embed' && playerUrl && hasStarted" :src="playerUrl"
              :title="`${movie.name} - ${activeEpisode?.name || 'Tập phim'}`" class="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen />
            <div v-else-if="playerMode === 'hls' && playerUrl && hasStarted" ref="playerShellRef"
              class="group relative h-full w-full bg-black" @mousemove="showControlsTemporarily"
              @mouseleave="controlsVisible = false" @touchstart.passive="handleTouchStart"
              @touchend.passive="handleTouchEnd">
              <video ref="videoRef" class="h-full w-full bg-black object-contain" playsinline
                @loadedmetadata="updateVideoMetadata" @timeupdate="updateVideoTime"
                @canplay="isVideoBuffering = false" @waiting="isVideoBuffering = true"
                @playing="isVideoBuffering = false" @play="isVideoPlaying = true; showControlsTemporarily()"
                @pause="isVideoPlaying = false; controlsVisible = true" @ended="handleVideoEnded" />

              <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/35" />

              <div v-if="isVideoBuffering"
                class="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/20 text-emerald-200">
                <Loader2 class="size-10 animate-spin" />
              </div>

              <div v-if="hlsErrorMessage"
                class="absolute left-1/2 top-1/2 z-20 w-[min(90%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-red-300/30 bg-red-950/85 p-4 text-center text-sm font-bold text-red-100">
                {{ hlsErrorMessage }}
              </div>

              <button v-if="videoCurrentTime < skipIntroSeconds && durationSeconds > 180" type="button"
                class="absolute bottom-24 right-4 z-20 rounded-md bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg transition hover:bg-white"
                @click="skipIntro">
                Bỏ intro
              </button>

              <button v-if="skipOutroSeconds && videoCurrentTime > skipOutroSeconds - 45 && hasNextEpisode" type="button"
                class="absolute bottom-24 right-4 z-20 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg transition hover:bg-white"
                @click="playNextEpisode(true)">
                <SkipForward class="size-4" /> Tập tiếp
              </button>

              <button type="button"
                class="absolute inset-0 grid cursor-pointer place-items-center text-white transition"
                :class="isVideoPlaying && !controlsVisible ? 'opacity-0' : 'opacity-100'"
                :aria-label="isVideoPlaying ? 'Tạm dừng' : 'Phát phim'" @click="toggleHlsPlayback">
                <span
                  class="grid size-12 place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-950/30 sm:size-16">
                  <Pause v-if="isVideoPlaying" class="size-5 fill-current sm:size-7" />
                  <Play v-else class="size-5 fill-current sm:size-7" />
                </span>
              </button>

              <div class="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 text-white transition sm:px-4 sm:pb-4"
                :class="controlsVisible || !isVideoPlaying ? 'opacity-100' : 'pointer-events-none opacity-0'">
                <input class="kr-hls-range w-full cursor-pointer" type="range" min="0" :max="durationSeconds || 0"
                  :value="videoCurrentTime" step="1" @input="seekHlsPlayer">
                <div class="mt-2 flex items-center justify-between gap-2 sm:mt-3 sm:gap-3">
                  <div class="flex min-w-0 items-center gap-1.5 sm:gap-3">
                    <button type="button"
                      class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                      :aria-label="isVideoPlaying ? 'Tạm dừng' : 'Phát phim'" @click="toggleHlsPlayback">
                      <Pause v-if="isVideoPlaying" class="size-3.5 fill-current sm:size-4" />
                      <Play v-else class="size-3.5 fill-current sm:size-4" />
                    </button>
                    <button type="button"
                      class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                      aria-label="Lùi 10 giây" @click="seekBy(-10)">
                      <Rewind class="size-3.5 sm:size-4" />
                    </button>
                    <button type="button"
                      class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                      aria-label="Tua 10 giây" @click="seekBy(10)">
                      <FastForward class="size-3.5 sm:size-4" />
                    </button>
                    <button type="button"
                      class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                      :aria-label="isVideoMuted ? 'Bật âm' : 'Tắt âm'" @click="toggleMute">
                      <VolumeX v-if="isVideoMuted" class="size-3.5 sm:size-4" />
                      <Volume2 v-else class="size-3.5 sm:size-4" />
                    </button>
                    <input class="kr-volume-range hidden w-20 cursor-pointer sm:block" type="range" min="0" max="1"
                      step="0.05" :value="videoVolume" @input="changeVolume">
                    <span class="shrink-0 text-[11px] font-black text-slate-100 sm:text-xs">
                      {{ formatPlayerTime(videoCurrentTime) }} / {{ formatPlayerTime(durationSeconds) }}
                    </span>
                  </div>

                  <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <div class="relative">
                      <button type="button"
                        class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                        :class="isSettingsOpen ? 'bg-emerald-400 text-slate-950' : ''" aria-label="Cài đặt player"
                        @click="isSettingsOpen = !isSettingsOpen; controlsVisible = true">
                        <Settings class="size-3.5 sm:size-4" />
                      </button>

                      <div v-if="isSettingsOpen"
                        class="absolute bottom-10 right-0 z-30 w-48 rounded-md border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur sm:bottom-12 sm:w-56">
                        <label class="block text-[11px] font-black uppercase text-slate-400">
                          Tốc độ phát
                        </label>
                        <select
                          class="mt-2 h-10 w-full cursor-pointer rounded-md border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none"
                          :value="playbackRate" aria-label="Tốc độ phát" @change="changePlaybackRate">
                          <option class="bg-slate-950" value="0.75">0.75x</option>
                          <option class="bg-slate-950" value="1">1x</option>
                          <option class="bg-slate-950" value="1.25">1.25x</option>
                          <option class="bg-slate-950" value="1.5">1.5x</option>
                          <option class="bg-slate-950" value="2">2x</option>
                        </select>

                        <label class="mt-4 block text-[11px] font-black uppercase text-slate-400">
                          Chất lượng
                        </label>
                        <select
                          class="mt-2 h-10 w-full cursor-pointer rounded-md border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          :value="selectedQuality" :disabled="!qualityLevels.length" aria-label="Chất lượng"
                          @change="changeQuality">
                          <option class="bg-slate-950" value="-1">Auto</option>
                          <option v-for="level in qualityLevels" :key="level.level" class="bg-slate-950" :value="level.level">
                            {{ level.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <button type="button"
                      class="hidden size-9 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:grid"
                      aria-label="Picture in Picture" @click="togglePictureInPicture">
                      <PictureInPicture2 class="size-4" />
                    </button>
                    <button v-if="hasNextEpisode" type="button"
                      class="hidden size-9 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:grid"
                      aria-label="Tập tiếp theo" @click="playNextEpisode(true)">
                      <SkipForward class="size-4" />
                    </button>
                    <button type="button"
                      class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/12 text-white transition hover:bg-emerald-400 hover:text-slate-950 sm:size-9"
                      aria-label="Toàn màn hình" @click="toggleFullscreen">
                      <Maximize class="size-3.5 sm:size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button v-else type="button" class="absolute inset-0 text-white" :aria-label="`Phát ${movie.name}`"
              @click="startPlayer">
              <img :src="movie.poster || movie.thumb" :alt="movie.name" class="h-full w-full object-cover opacity-45">
              <div class="absolute inset-0 bg-black/45" />
              <div class="absolute inset-0 grid place-items-center">
                <span
                  class="grid size-16 place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-950/30">
                  <Play class="size-7 fill-current" />
                </span>
                <span v-if="playerMode === 'hls' && !canUseHls"
                  class="mt-4 rounded-md bg-black/70 px-4 py-2 text-xs font-black text-slate-100">
                  Tập này chưa có link HLS
                </span>
              </div>
            </button>
          </div>

          <div
            class="flex items-center justify-center gap-7 border-t border-white/10 px-4 py-4 text-xs font-bold text-slate-100 sm:justify-start sm:gap-4 sm:py-3">
            <button type="button"
              class="inline-flex cursor-pointer items-center gap-2 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
              :class="isFavoriteMovie ? 'text-emerald-300' : ''" :disabled="actionBusy" @click="toggleFavorite">
              <Heart class="size-4 sm:size-3" :class="isFavoriteMovie ? 'fill-current' : ''" />
              {{ isFavoriteMovie ? 'Đã thích' : 'Yêu thích' }}
            </button>
            <button type="button"
              class="inline-flex cursor-pointer items-center gap-2 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="actionBusy" @click="addToWatchLater">
              <Plus class="size-4 sm:size-3" /> Thêm vào
            </button>
            <button type="button" class="inline-flex cursor-pointer items-center gap-2 hover:text-emerald-200"
              @click="shareMovie">
              <Share2 class="size-4 sm:size-3" /> Chia sẻ
            </button>
            <span v-if="actionMessage" class="hidden text-xs font-bold text-emerald-200 sm:inline">
              {{ actionMessage }}
            </span>
          </div>
          <p v-if="actionMessage" class="border-t border-white/10 px-4 pb-3 text-center text-xs font-bold text-emerald-200 sm:hidden">
            {{ actionMessage }}
          </p>
        </div>

        <div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <div class="flex gap-4">
              <img :src="movie.thumb || movie.poster" :alt="movie.name"
                class="hidden h-28 w-20 rounded-md object-cover sm:block">
              <div>
                <h1 class="text-[1.35rem] font-black leading-tight sm:text-2xl">{{ movie.name }}</h1>
                <p v-if="movie.originName" class="mt-1 text-sm font-bold text-emerald-200">{{ movie.originName }}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span v-if="movie.quality" class="rounded bg-white/12 px-2 py-1">{{ movie.quality }}</span>
                  <span v-if="movie.episode" class="rounded bg-white/12 px-2 py-1">{{ movie.episode }}</span>
                  <span v-if="movie.time" class="rounded bg-white/12 px-2 py-1">{{ movie.time }}</span>
                  <span v-if="movie.rating"
                    class="inline-flex items-center gap-1 rounded bg-emerald-400 px-2 py-1 text-slate-950">
                    <Star class="size-3 fill-current" />
                    {{ movie.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>

            <p v-if="movie.content" class="mt-4 text-sm leading-7 text-slate-200">{{ movie.content }}</p>

            <div class="mt-5 rounded-md bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950">
              Đang xem {{ activeEpisode?.name || 'Tập 1' }}
            </div>

            <div v-if="servers.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-2">
              <button v-for="(server, index) in servers" :key="server.name" type="button"
                class="shrink-0 rounded px-4 py-2 text-sm font-black"
                :class="selectedServer === index ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                @click="selectServer(index)">
                {{ server.name }}
              </button>
            </div>

            <div v-if="activeServer?.episodes?.length"
              class="mt-3 grid grid-cols-3 gap-2 rounded-md border border-white/10 p-3 sm:grid-cols-4 lg:grid-cols-6">
              <NuxtLink v-for="(episode, index) in activeServer.episodes" :key="`${episode.name}-${index}`"
                :to="episodeLink(index)"
                class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-center text-sm font-black transition"
                :class="selectedEpisode === index ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'">
                <Play class="size-3 fill-current" />
                {{ episode.name }}
              </NuxtLink>
            </div>
          </section>

          <aside class="hidden rounded-md border border-white/10 bg-white/5 p-5 sm:block lg:self-start">
            <h2 class="text-base font-black">Thông tin phim</h2>
            <div class="mt-4 space-y-3 text-sm text-slate-300">
              <p><span class="font-black text-white">Số tập:</span> {{ movie.episode || 'Đang cập nhật' }}</p>
              <p v-if="movie.countries?.length"><span class="font-black text-white">Quốc gia:</span> {{
                movie.countries.join(', ') }}</p>
              <p v-if="movie.year"><span class="font-black text-white">Năm:</span> {{ movie.year }}</p>
              <p v-if="actorSummary"><span class="font-black text-white">Diễn viên:</span> {{
                actorSummary }}</p>
            </div>
          </aside>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.kr-hls-range,
.kr-volume-range {
  height: 6px;
  appearance: none;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgb(56 189 248) v-bind('`${progressPercent}%`'), rgb(255 255 255 / 0.22) 0);
  outline: none;
}

.kr-volume-range {
  background:
    linear-gradient(90deg, rgb(56 189 248) v-bind('`${videoVolume * 100}%`'), rgb(255 255 255 / 0.22) 0);
}

.kr-hls-range::-webkit-slider-thumb,
.kr-volume-range::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  appearance: none;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 0 5px rgb(56 189 248 / 0.22);
}

.kr-hls-range::-moz-range-thumb,
.kr-volume-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 0 5px rgb(56 189 248 / 0.22);
}
</style>
