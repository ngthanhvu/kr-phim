<script setup lang="ts">
import type Hls from 'hls.js'
import {
  FastForward,
  Heart,
  Loader2,
  Menu,
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
const playerViewportRef = ref<HTMLElement | null>(null)
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
const isHlsFullscreen = ref(false)
const edgeProgressVisible = ref(false)
const gestureHint = ref('')
const isHoldSpeedActive = ref(false)
const pendingResumeSeconds = ref(0)
const descriptionExpanded = ref(false)
let controlsHideTimer: ReturnType<typeof setTimeout> | undefined
let edgeProgressTimer: ReturnType<typeof setTimeout> | undefined
let singleTapTimer: ReturnType<typeof setTimeout> | undefined
let holdSpeedTimer: ReturnType<typeof setTimeout> | undefined
let hlsFallbackTimer: ReturnType<typeof setTimeout> | undefined
let touchStartX = 0
let touchStartY = 0
let touchStartAt = 0
let lastTapAt = 0
let lastTapX = 0
let holdRestoreRate = 1
let ignoreNextTap = false
let hlsFatalRetryCount = 0
let autoOrientationFullscreen = false
let hlsPlayer: Hls | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
let lastSavedProgress = 0
const {
  loadWatchHistory: fetchWatchHistory,
  saveWatchHistory: persistWatchHistory,
} = useWatchHistory()
const {
  isFavorite,
  saveFavorite,
  removeFavorite,
  saveWatchLater,
} = useMovieLibrary()

const { data: movie, pending, error } = useFetch(() => `/api/movies/${route.params.slug}`, {
  query: computed(() => ({
    source: route.query.source,
    srcs: route.query.srcs,
  })),
  lazy: true,
  watch: [() => route.query.source, () => route.query.srcs],
})

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value] ?? servers.value[0])
const activeEpisode = computed(() => activeServer.value?.episodes?.[selectedEpisode.value] ?? activeServer.value?.episodes?.[0])
const hlsPlayerUrl = computed(() => activeEpisode.value?.linkM3u8 || '')
const actorSummary = computed(() => (movie.value?.actors ?? []).map((actor: any) => actor.name).filter(Boolean).slice(0, 6).join(', '))
const durationSeconds = computed(() => Math.floor(videoDuration.value || parseDurationSeconds(movie.value?.time || '')))
const hasNextEpisode = computed(() => Boolean(activeServer.value?.episodes?.[selectedEpisode.value + 1]))

function getProxyUrl(url: string): string {
  const encoded = btoa(url)
  return `/api/proxy-m3u8/${encoded}`
}

const progressPercent = computed(() => {
  if (!durationSeconds.value || !progressSeconds.value) return 0
  return Math.min(Math.max((progressSeconds.value / durationSeconds.value) * 100, 0), 100)
})
const shouldShowHlsControls = computed(() => (controlsVisible.value || !isVideoPlaying.value) && !(isHlsFullscreen.value && edgeProgressVisible.value && isVideoPlaying.value))
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

function formatEpisodeName(name?: string, index = 0) {
  const value = String(name || index + 1).trim()
  if (!value) return `Tập ${index + 1}`
  if (/^(tập|tap|episode|ep)\b/i.test(value)) return value
  return `Tập ${value}`
}

function serverLabel(server: any, index: number) {
  const source = String(server?.source || '').toUpperCase()
  const name = String(server?.name || '').replace(/^(ophim|nguonc|kkphim)\s*-\s*/i, '').trim()
  const sameSourceServers = servers.value.filter((item: any) => item.source === server?.source)
  const sourceServerNumber = sameSourceServers.findIndex((item: any) => item === server) + 1

  if (source && sameSourceServers.length > 1) return `${source} #${sourceServerNumber || index + 1}`
  if (source) return source
  return name || `Server ${index + 1}`
}

function episodeLink(index: number) {
  return {
    path: `/xem/${route.params.slug}`,
    query: {
      source: route.query.source,
      srcs: route.query.srcs,
      server: selectedServer.value,
      ep: index + 1,
    },
  }
}

function episodeIndexForServer(serverIndex: number, episodeIndex = selectedEpisode.value) {
  const episodeCount = servers.value[serverIndex]?.episodes?.length || 0
  if (!episodeCount) return 0
  return Math.min(Math.max(episodeIndex, 0), episodeCount - 1)
}

async function selectServer(index: number) {
  if (index === selectedServer.value) return
  const shouldAutoplay = hasStarted.value
  const nextEpisodeIndex = episodeIndexForServer(index)
  selectedServer.value = index
  selectedEpisode.value = nextEpisodeIndex
  resetProgressTimer()
  destroyHlsPlayer()
  await navigateTo({
    path: `/xem/${route.params.slug}`,
    query: {
      ...route.query,
      server: index,
      ep: nextEpisodeIndex + 1,
    },
  }, { replace: true })

  if (shouldAutoplay) {
    nextTick(() => startPlayer())
  }
}

async function startPlayer() {
  hasStarted.value = true
  await loadResumeProgress()
  startProgressTimer()
  saveWatchHistory()
  nextTick(() => setupHlsPlayer(true))
  nextTick(() => handleOrientationFullscreen())
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
  clearHlsFallbackTimer()
  stopProgressTimer()
}

function stopProgressTimer() {
  if (!progressTimer) return
  clearInterval(progressTimer)
  progressTimer = undefined
}

function tickProgress() {
  if (!hasStarted.value || (import.meta.client && document.visibilityState === 'hidden')) return

  if (videoRef.value) {
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
  if (!hasStarted.value || !videoRef.value) return
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

function showFullscreenProgressOnly() {
  if (!isHlsFullscreen.value) return
  edgeProgressVisible.value = true
  controlsVisible.value = false
  if (edgeProgressTimer) clearTimeout(edgeProgressTimer)
  edgeProgressTimer = setTimeout(() => {
    edgeProgressVisible.value = false
  }, 1400)
}

function clearHlsFallbackTimer() {
  if (!hlsFallbackTimer) return
  clearTimeout(hlsFallbackTimer)
  hlsFallbackTimer = undefined
}

function scheduleHlsFallback(message = 'HLS phản hồi chậm, vui lòng thử lại...') {
  clearHlsFallbackTimer()
  hlsFallbackTimer = setTimeout(() => {
    hlsErrorMessage.value = message
    isVideoBuffering.value = false
    isVideoPlaying.value = false
  }, 12000)
}

function flashGestureHint(message: string) {
  gestureHint.value = message
  window.setTimeout(() => {
    if (gestureHint.value === message) gestureHint.value = ''
  }, 650)
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

async function setupHlsPlayer(autoplay = false, tryProxy = true) {
  console.log('[HLS] Setup called', { tryProxy, hasVideoRef: !!videoRef.value, hlsUrl: hlsPlayerUrl.value })

  if (!import.meta.client || !videoRef.value || !hlsPlayerUrl.value) {
    console.log('[HLS] Early return - missing requirements')
    return
  }

  destroyHlsPlayer()
  hlsFatalRetryCount = 0

  const video = videoRef.value
  isVideoBuffering.value = true
  hlsErrorMessage.value = ''
  video.volume = videoVolume.value
  video.muted = isVideoMuted.value
  video.playbackRate = playbackRate.value

  // Use proxy if tryProxy is true, otherwise use direct URL
  let sourceUrl = tryProxy ? getProxyUrl(hlsPlayerUrl.value) : hlsPlayerUrl.value
  console.log('[HLS] Source URL:', sourceUrl)

  // Force use hls.js when using proxy, as native HLS doesn't handle proxy URLs well
  if (video.canPlayType('application/vnd.apple.mpegurl') && !tryProxy) {
    console.log('[HLS] Using native HLS (Safari) - direct URL only')
    // Native HLS (Safari) - only when using direct URL
    video.src = sourceUrl
    scheduleHlsFallback()

    // Listen for errors on native HLS
    const handleError = () => {
      console.log('[HLS] Native HLS error, falling back to hls.js')
      video.removeEventListener('error', handleError)
      // Fall back to hls.js instead of embed
      tryProxy = false
      setupHlsPlayer(autoplay, false)
    }
    video.addEventListener('error', handleError)
  } else {
    console.log('[HLS] Using hls.js library')
    try {
      const { default: HlsPlayer } = await import('hls.js')

      if (!HlsPlayer.isSupported()) {
        console.log('[HLS] hls.js not supported')
        hlsErrorMessage.value = 'Trình duyệt chưa hỗ trợ HLS.'
        isVideoBuffering.value = false
        return
      }

      hlsPlayer = new HlsPlayer({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false
        },
      })

      hlsPlayer.on(HlsPlayer.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed successfully')
        clearHlsFallbackTimer()
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
        console.log('[HLS] Error:', data.type, data.details, data.fatal)
        if (!data.fatal) return

        // If using proxy and it fails, try direct URL
        if (tryProxy) {
          console.log('[HLS] Proxy failed, trying direct URL')
          hlsErrorMessage.value = 'Proxy lỗi, đang thử trực tiếp...'
          hlsPlayer?.destroy()

          // Retry with direct URL
          setTimeout(() => {
            setupHlsPlayer(autoplay, false)
          }, 100)
          return
        }

        hlsFatalRetryCount += 1
        if (hlsFatalRetryCount >= 2) {
          console.log('[HLS] Too many errors, showing error message')
          hlsErrorMessage.value = 'HLS tải không ổn định.'
          isVideoBuffering.value = false
          isVideoPlaying.value = false
          return
        }

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

      console.log('[HLS] Loading source and attaching media')
      hlsPlayer.loadSource(sourceUrl)
      hlsPlayer.attachMedia(video)
      scheduleHlsFallback()
    } catch (error) {
      console.error('[HLS] Setup error:', error)
      hlsErrorMessage.value = 'Lỗi khởi tạo HLS player.'
      isVideoBuffering.value = false
      isVideoPlaying.value = false
      return
    }
  }

  if (autoplay) {
    try {
      await video.play()
    } catch {
      isVideoPlaying.value = false
      hlsErrorMessage.value = 'HLS chưa phát được.'
    }
  }
}

function destroyHlsPlayer() {
  clearHlsFallbackTimer()

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
  clearHlsFallbackTimer()
  updateVideoTime()
  applyResumeProgress()
  isVideoBuffering.value = false
}

function handleVideoCanPlay() {
  clearHlsFallbackTimer()
  isVideoBuffering.value = false
}

function handleVideoWaiting() {
  isVideoBuffering.value = true
  scheduleHlsFallback('HLS bị đứng quá lâu, đã chuyển sang chế độ Nhúng.')
}

function handleVideoPlaying() {
  clearHlsFallbackTimer()
  isVideoBuffering.value = false
}

function handleVideoError() {
  hlsErrorMessage.value = 'HLS phát lỗi.'
  isVideoBuffering.value = false
  isVideoPlaying.value = false
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
  if (isHlsFullscreen.value) {
    showFullscreenProgressOnly()
  } else {
    showControlsTemporarily()
  }
  saveWatchHistory()
}

function seekHlsPlayer(event: Event) {
  if (!videoRef.value) return
  const value = Number((event.target as HTMLInputElement).value)
  videoRef.value.currentTime = value
  updateVideoTime()
  if (isHlsFullscreen.value) showFullscreenProgressOnly()
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

function getDocumentFullscreenElement() {
  if (!import.meta.client) return null
  const documentWithWebkit = document as Document & {
    webkitFullscreenElement?: Element | null
  }

  return document.fullscreenElement || documentWithWebkit.webkitFullscreenElement || null
}

async function enterPlayerFullscreen() {
  if (!import.meta.client) return false

  const video = videoRef.value as (HTMLVideoElement & {
    webkitEnterFullscreen?: () => void
    webkitRequestFullscreen?: () => Promise<void> | void
  }) | null
  const target = (playerShellRef.value || playerViewportRef.value || video?.parentElement || video) as (HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
  }) | null

  if (!target && !video) return false

  try {
    if (target?.requestFullscreen) {
      await target.requestFullscreen()
      return true
    }

    if (target?.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen()
      return true
    }

    if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen()
      return true
    }
  } catch {
    try {
      video?.webkitEnterFullscreen?.()
      return Boolean(video)
    } catch {
      return false
    }
  }

  return false
}

async function exitPlayerFullscreen() {
  const documentWithWebkit = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void
  }

  if (document.exitFullscreen) await document.exitFullscreen()
  else await documentWithWebkit.webkitExitFullscreen?.()
}

async function toggleFullscreen() {
  if (!import.meta.client) return

  try {
    if (getDocumentFullscreenElement()) {
      await exitPlayerFullscreen()
      return
    }

    await enterPlayerFullscreen()
  } catch {
    await enterPlayerFullscreen()
  }
}

function updateFullscreenState() {
  if (!import.meta.client) return
  const fullscreenElement = getDocumentFullscreenElement()
  const playerElement = playerShellRef.value || playerViewportRef.value
  isHlsFullscreen.value = Boolean(
    fullscreenElement
    && playerElement
    && (playerElement.contains(fullscreenElement) || fullscreenElement.contains(playerElement)),
  )
  if (!isHlsFullscreen.value) edgeProgressVisible.value = false
  if (!fullscreenElement) autoOrientationFullscreen = false
}

function isMobileLandscapeViewport() {
  if (!import.meta.client) return false
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const isSmallScreen = window.matchMedia?.('(max-width: 940px)').matches ?? window.innerWidth <= 940
  const isLandscape = window.matchMedia?.('(orientation: landscape)').matches ?? window.innerWidth > window.innerHeight

  return isCoarsePointer && isSmallScreen && isLandscape
}

async function handleOrientationFullscreen() {
  if (!import.meta.client || !hasStarted.value) return

  const fullscreenElement = getDocumentFullscreenElement()
  if (!isMobileLandscapeViewport()) {
    if (fullscreenElement && autoOrientationFullscreen) await exitPlayerFullscreen()
    return
  }

  if (fullscreenElement) return

  autoOrientationFullscreen = await enterPlayerFullscreen()
  if (autoOrientationFullscreen) {
    controlsVisible.value = false
    showFullscreenProgressOnly()
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

function seekByTapPosition(clientX: number) {
  const rect = playerShellRef.value?.getBoundingClientRect()
  const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const seconds = clientX < centerX ? -10 : 10
  seekBy(seconds)
  flashGestureHint(seconds > 0 ? '+10s' : '-10s')
}

function handlePlayerPointerDown() {
  if (!videoRef.value) return
  if (holdSpeedTimer) clearTimeout(holdSpeedTimer)
  holdSpeedTimer = setTimeout(() => {
    if (!videoRef.value) return
    holdRestoreRate = videoRef.value.playbackRate || playbackRate.value || 1
    videoRef.value.playbackRate = 2
    isHoldSpeedActive.value = true
    ignoreNextTap = true
    flashGestureHint('2x')
    if (isHlsFullscreen.value) showFullscreenProgressOnly()
  }, 420)
}

function stopHoldSpeed() {
  if (holdSpeedTimer) {
    clearTimeout(holdSpeedTimer)
    holdSpeedTimer = undefined
  }

  if (!isHoldSpeedActive.value) return
  if (videoRef.value) videoRef.value.playbackRate = playbackRate.value || holdRestoreRate || 1
  isHoldSpeedActive.value = false
  window.setTimeout(() => {
    ignoreNextTap = false
  }, 80)
}

function handlePlayerTap(event: MouseEvent) {
  if (ignoreNextTap) {
    ignoreNextTap = false
    return
  }

  const now = Date.now()
  const tapX = event.clientX
  const isDoubleTap = now - lastTapAt < 280 && Math.abs(tapX - lastTapX) < 90

  if (isDoubleTap) {
    if (singleTapTimer) {
      clearTimeout(singleTapTimer)
      singleTapTimer = undefined
    }
    lastTapAt = 0
    seekByTapPosition(tapX)
    return
  }

  lastTapAt = now
  lastTapX = tapX
  if (singleTapTimer) clearTimeout(singleTapTimer)
  singleTapTimer = setTimeout(() => {
    toggleHlsPlayback()
    singleTapTimer = undefined
  }, 260)
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0]

  if (!touch) return

  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartAt = Date.now()
}

function handleTouchEnd(event: TouchEvent) {
  if (!videoRef.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  const elapsed = Date.now() - touchStartAt

  if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) && elapsed < 700) {
    seekBy(deltaX > 0 ? 10 : -10)
    flashGestureHint(deltaX > 0 ? '+10s' : '-10s')
    return
  }

  if (Math.abs(deltaY) > 48 && Math.abs(deltaY) > Math.abs(deltaX)) {
    const nextVolume = Math.min(
      Math.max(videoVolume.value + (deltaY < 0 ? 0.1 : -0.1), 0),
      1
    )

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

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${movie.value.name} - CineK`,
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
  await refreshFavoriteState()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('keydown', handleKeyboardShortcut)
  document.addEventListener('fullscreenchange', updateFullscreenState)
  document.addEventListener('webkitfullscreenchange', updateFullscreenState)
  window.addEventListener('orientationchange', handleOrientationFullscreen)
  window.addEventListener('resize', handleOrientationFullscreen)
  screen.orientation?.addEventListener?.('change', handleOrientationFullscreen)
})

onBeforeUnmount(() => {
  if (hasStarted.value) saveWatchHistory()
  stopProgressTimer()
  if (controlsHideTimer) clearTimeout(controlsHideTimer)
  if (edgeProgressTimer) clearTimeout(edgeProgressTimer)
  if (singleTapTimer) clearTimeout(singleTapTimer)
  if (holdSpeedTimer) clearTimeout(holdSpeedTimer)
  clearHlsFallbackTimer()
  destroyHlsPlayer()
  if (import.meta.client) document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (import.meta.client) document.removeEventListener('keydown', handleKeyboardShortcut)
  if (import.meta.client) document.removeEventListener('fullscreenchange', updateFullscreenState)
  if (import.meta.client) document.removeEventListener('webkitfullscreenchange', updateFullscreenState)
  if (import.meta.client) window.removeEventListener('orientationchange', handleOrientationFullscreen)
  if (import.meta.client) window.removeEventListener('resize', handleOrientationFullscreen)
  if (import.meta.client) screen.orientation?.removeEventListener?.('change', handleOrientationFullscreen)
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

watch(libraryItem, () => {
  refreshFavoriteState()
})

useHead(() => ({
  title: movie.value ? `Xem ${movie.value.name} - ${activeEpisode.value?.name || 'Tập 1'} - CineK` : 'Đang tải phim - CineK',
  meta: [
    {
      name: 'description',
      content: movie.value
        ? `Xem ${movie.value.name} ${activeEpisode.value?.name || 'Tập 1'} online tại CineK, hỗ trợ Vietsub, thuyết minh, lồng tiếng và nhiều server xem.`
        : 'Xem phim Hàn Quốc online tại CineK với trình phát mượt, hỗ trợ nhiều server xem.',
    },
    {
      property: 'og:title',
      content: movie.value ? `Xem ${movie.value.name} - CineK` : 'CineK - Xem phim Hàn Quốc online',
    },
    {
      property: 'og:description',
      content: movie.value?.content || 'Xem phim Hàn Quốc online với trải nghiệm mượt trên CineK.',
    },
    {
      property: 'og:image',
      content: movie.value?.poster || movie.value?.thumb || '/icon.png',
    },
  ],
}))
</script>

<template>
  <main class="min-h-screen bg-[#08090d] text-white">
    <AppHeader />

    <Transition name="watch-page" mode="out-in">
      <section v-if="pending && !movie" key="loading"
        class="mx-auto max-w-390 px-3 pb-16 pt-24 sm:px-6 sm:pt-36 lg:px-8 lg:pt-28 xl:px-10">
        <div class="h-5 w-28 animate-pulse rounded bg-white/10" />

        <div class="mt-4 overflow-hidden rounded-md border border-white/10 bg-black shadow-2xl shadow-black/40">
          <div class="relative aspect-video overflow-hidden bg-slate-950">
            <div class="absolute left-3 top-3 hidden h-8 w-36 animate-pulse rounded-md bg-white/10 sm:block" />
            <div class="absolute right-3 top-3 hidden h-8 w-44 animate-pulse rounded-md bg-white/10 sm:block" />
            <div class="absolute inset-0 grid place-items-center">
              <Loader2 class="size-10 animate-spin text-yellow-300" />
            </div>
          </div>
          <div class="flex items-center justify-center gap-7 border-t border-white/10 px-4 py-4 sm:justify-start">
            <div class="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div class="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div class="h-4 w-20 animate-pulse rounded bg-white/10" />
          </div>
        </div>

        <div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <div class="flex gap-4">
              <div class="hidden h-28 w-20 animate-pulse rounded-md bg-white/10 sm:block" />
              <div class="min-w-0 flex-1">
                <div class="h-7 w-3/4 animate-pulse rounded bg-white/10" />
                <div class="mt-3 h-4 w-1/2 animate-pulse rounded bg-yellow-300/20" />
                <div class="mt-4 flex flex-wrap gap-2">
                  <div class="h-7 w-14 animate-pulse rounded bg-white/10" />
                  <div class="h-7 w-20 animate-pulse rounded bg-white/10" />
                  <div class="h-7 w-16 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            </div>
            <div class="mt-5 space-y-3">
              <div class="h-4 animate-pulse rounded bg-white/10" />
              <div class="h-4 w-11/12 animate-pulse rounded bg-white/10" />
              <div class="h-4 w-4/5 animate-pulse rounded bg-white/10" />
            </div>
            <div class="mt-5 h-12 animate-pulse rounded-md bg-yellow-300/20" />
            <div class="mt-6 border-t border-white/10 pt-4">
              <div class="h-9 w-32 animate-pulse rounded bg-white/10" />
              <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                <div v-for="index in 12" :key="index" class="h-14 animate-pulse rounded-md bg-white/10" />
              </div>
            </div>
          </section>

          <aside class="hidden rounded-md border border-white/10 bg-white/5 p-5 sm:block lg:self-start">
            <div class="h-5 w-32 animate-pulse rounded bg-white/10" />
            <div class="mt-5 space-y-4">
              <div class="h-4 animate-pulse rounded bg-white/10" />
              <div class="h-4 w-5/6 animate-pulse rounded bg-white/10" />
              <div class="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          </aside>
        </div>
      </section>

      <div v-else-if="error || !movie" key="error"
        class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36 lg:pt-24">
        <div>
          <h1 class="text-3xl font-black">Không mở được phim</h1>
          <p class="mt-3 text-slate-300">Phim có thể đang được cập nhật hoặc hiện chưa có tập xem.</p>
        </div>
      </div>

      <section v-else key="content"
        class="relative mx-auto max-w-390 px-3 pb-16 pt-24 sm:px-6 sm:pt-36 lg:px-8 lg:pt-28 xl:px-10">
        <div v-if="pending"
          class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-yellow-400/10">
          <span class="kr-loading-line block h-full w-1/3 rounded-full bg-yellow-300" />
        </div>

        <NuxtLink
          :to="{ path: `/phim/${route.params.slug}`, query: { source: route.query.source, srcs: route.query.srcs } }"
          class="text-sm font-bold text-slate-100 hover:text-yellow-200">
          ‹ Chi tiết phim
        </NuxtLink>

        <div class="mt-4 overflow-hidden rounded-md border border-white/10 bg-black shadow-2xl shadow-black/40">
          <div ref="playerViewportRef" class="relative aspect-video bg-slate-950">
            <div v-if="pending"
              class="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/45 text-yellow-200 backdrop-blur-[1px]">
              <div
                class="inline-flex items-center gap-3 rounded-full border border-yellow-300/25 bg-black/70 px-4 py-2 text-xs font-black shadow-xl shadow-black/30">
                <Loader2 class="size-4 animate-spin" />
                Đang tải phim
              </div>
            </div>

            <div v-if="hlsPlayerUrl && hasStarted" ref="playerShellRef" class="group relative h-full w-full bg-black"
              @mousemove="showControlsTemporarily" @mouseleave="controlsVisible = false"
              @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
              <video ref="videoRef" class="h-full w-full bg-black object-contain" playsinline
                @loadedmetadata="updateVideoMetadata" @timeupdate="updateVideoTime" @canplay="handleVideoCanPlay"
                @waiting="handleVideoWaiting" @playing="handleVideoPlaying"
                @play="isVideoPlaying = true; showControlsTemporarily()"
                @pause="isVideoPlaying = false; controlsVisible = true" @ended="handleVideoEnded"
                @error="handleVideoError" />

              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/35 to-transparent" />

              <div v-if="isVideoBuffering"
                class="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/20 text-yellow-200">
                <Loader2 class="size-10 animate-spin" />
              </div>

              <div v-if="hlsErrorMessage"
                class="absolute left-1/2 top-1/2 z-20 w-[min(90%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-red-300/30 bg-red-950/85 p-4 text-center text-sm font-bold text-red-100">
                {{ hlsErrorMessage }}
              </div>

              <button v-if="videoCurrentTime < skipIntroSeconds && durationSeconds > 180" type="button"
                class="absolute bottom-24 right-4 z-20 rounded-md border border-yellow-300/80 bg-black/55 px-4 py-2 text-xs font-black text-yellow-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-yellow-200 hover:bg-yellow-400 hover:text-slate-950"
                @click="skipIntro">
                Bỏ intro
              </button>

              <button v-if="skipOutroSeconds && videoCurrentTime > skipOutroSeconds - 45 && hasNextEpisode"
                type="button"
                class="absolute bottom-24 right-4 z-20 inline-flex items-center gap-2 rounded-md border border-yellow-300/80 bg-black/55 px-4 py-2 text-xs font-black text-yellow-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-yellow-200 hover:bg-yellow-400 hover:text-slate-950"
                @click="playNextEpisode(true)">
                <SkipForward class="size-4" /> Tập tiếp
              </button>

              <button type="button"
                class="absolute inset-0 grid cursor-pointer place-items-center text-white transition"
                :class="isVideoPlaying && !controlsVisible ? 'opacity-0' : 'opacity-100'"
                :aria-label="isVideoPlaying ? 'Tạm dừng' : 'Phát phim'" @click="handlePlayerTap"
                @pointerdown="handlePlayerPointerDown" @pointerup="stopHoldSpeed" @pointercancel="stopHoldSpeed"
                @pointerleave="stopHoldSpeed" @contextmenu.prevent>
                <span
                  class="grid size-12 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-xl shadow-yellow-950/30 sm:size-16">
                  <Pause v-if="isVideoPlaying" class="size-5 fill-current sm:size-7" />
                  <Play v-else class="size-5 fill-current sm:size-7" />
                </span>
              </button>

              <div v-if="gestureHint || isHoldSpeedActive"
                class="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-black text-white shadow-2xl backdrop-blur">
                {{ isHoldSpeedActive ? '2x' : gestureHint }}
              </div>

              <div class="kr-hls-edge-progress"
                :class="edgeProgressVisible || (isHlsFullscreen && !shouldShowHlsControls) ? 'opacity-100' : 'opacity-0'" />

              <div class="kr-hls-controls text-white transition"
                :class="shouldShowHlsControls ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'">
                <div class="kr-hls-time-row">
                  <span>{{ formatPlayerTime(videoCurrentTime) }}</span>
                  <span>{{ formatPlayerTime(durationSeconds) }}</span>
                </div>
                <input class="kr-hls-range" type="range" min="0" :max="durationSeconds || 0" :value="videoCurrentTime"
                  step="1" @input="seekHlsPlayer">
                <div class="kr-hls-actions">
                  <div class="kr-hls-actions-left">
                    <button type="button" class="kr-hls-control-button is-primary"
                      :aria-label="isVideoPlaying ? 'Tạm dừng' : 'Phát phim'" @click="toggleHlsPlayback">
                      <Pause v-if="isVideoPlaying" class="fill-current" />
                      <Play v-else class="fill-current" />
                    </button>
                    <button type="button" class="kr-hls-control-button" aria-label="Lùi 10 giây" @click="seekBy(-10)">
                      <Rewind />
                    </button>
                    <button type="button" class="kr-hls-control-button" aria-label="Tua 10 giây" @click="seekBy(10)">
                      <FastForward />
                    </button>
                    <button type="button" class="kr-hls-control-button" :aria-label="isVideoMuted ? 'Bật âm' : 'Tắt âm'"
                      @click="toggleMute">
                      <VolumeX v-if="isVideoMuted" />
                      <Volume2 v-else />
                    </button>
                    <input class="kr-volume-range hidden sm:block" type="range" min="0" max="1" step="0.05"
                      :value="videoVolume" @input="changeVolume">
                  </div>

                  <div class="kr-hls-actions-right">
                    <div class="relative">
                      <button type="button" class="kr-hls-control-button"
                        :class="isSettingsOpen ? 'bg-yellow-400 text-slate-950' : ''" aria-label="Cài đặt player"
                        @click="isSettingsOpen = !isSettingsOpen; controlsVisible = true">
                        <Settings />
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
                          <option v-for="level in qualityLevels" :key="level.level" class="bg-slate-950"
                            :value="level.level">
                            {{ level.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <button type="button" class="kr-hls-control-button kr-hls-desktop-button"
                      aria-label="Picture in Picture" @click="togglePictureInPicture">
                      <PictureInPicture2 />
                    </button>
                    <button v-if="hasNextEpisode" type="button" class="kr-hls-control-button kr-hls-desktop-button"
                      aria-label="Tập tiếp theo" @click="playNextEpisode(true)">
                      <SkipForward />
                    </button>
                    <button type="button" class="kr-hls-control-button" aria-label="Toàn màn hình"
                      @click="toggleFullscreen">
                      <Maximize />
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
                  class="grid size-16 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-xl shadow-yellow-950/30">
                  <Play class="size-7 fill-current" />
                </span>
                <span v-if="!hlsPlayerUrl"
                  class="mt-4 rounded-md bg-black/70 px-4 py-2 text-xs font-black text-slate-100">
                  Tập này chưa có link HLS
                </span>
              </div>
            </button>
          </div>

          <div
            class="flex items-center justify-center gap-7 border-t border-white/10 px-4 py-4 text-xs font-bold text-slate-100 sm:justify-start sm:gap-4 sm:py-3">
            <button type="button"
              class="inline-flex cursor-pointer items-center gap-2 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-70"
              :class="isFavoriteMovie ? 'text-yellow-300' : ''" :disabled="actionBusy" @click="toggleFavorite">
              <Heart class="size-4 sm:size-3" :class="isFavoriteMovie ? 'fill-current' : ''" />
              {{ isFavoriteMovie ? 'Đã thích' : 'Yêu thích' }}
            </button>
            <button type="button"
              class="inline-flex cursor-pointer items-center gap-2 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="actionBusy" @click="addToWatchLater">
              <Plus class="size-4 sm:size-3" /> Thêm vào
            </button>
            <button type="button" class="inline-flex cursor-pointer items-center gap-2 hover:text-yellow-200"
              @click="shareMovie">
              <Share2 class="size-4 sm:size-3" /> Chia sẻ
            </button>
            <span v-if="actionMessage" class="hidden text-xs font-bold text-yellow-200 sm:inline">
              {{ actionMessage }}
            </span>
          </div>
          <p v-if="actionMessage"
            class="border-t border-white/10 px-4 pb-3 text-center text-xs font-bold text-yellow-200 sm:hidden">
            {{ actionMessage }}
          </p>
        </div>

        <div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <div class="flex gap-4">
              <img :src="movie.poster || movie.thumb" :alt="movie.name"
                class="hidden h-28 w-20 rounded-md object-cover sm:block">
              <div>
                <h1 class="text-[1.35rem] font-black leading-tight sm:text-2xl">{{ movie.name }}</h1>
                <p v-if="movie.originName" class="mt-1 text-sm font-bold text-yellow-200">{{ movie.originName }}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span v-if="movie.quality" class="rounded bg-white/12 px-2 py-1">{{ movie.quality }}</span>
                  <span v-if="movie.episode" class="rounded bg-white/12 px-2 py-1">{{ movie.episode }}</span>
                  <span v-if="movie.time" class="rounded bg-white/12 px-2 py-1">{{ movie.time }}</span>
                  <span v-if="movie.rating"
                    class="inline-flex items-center gap-1 rounded bg-yellow-400 px-2 py-1 text-slate-950">
                    <Star class="size-3 fill-current" />
                    {{ movie.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="movie.content" class="mt-4">
              <p class="text-sm leading-7 text-slate-200" :class="descriptionExpanded ? '' : 'line-clamp-3'">{{ movie.content }}</p>
              <button type="button"
                class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yellow-300 transition hover:text-yellow-200 sm:hidden"
                @click="descriptionExpanded = !descriptionExpanded">
                {{ descriptionExpanded ? 'Thu gọn' : 'Xem thêm' }}
                <svg class="size-3 transition" :class="descriptionExpanded ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div class="mt-5 rounded-md bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950">
              Đang xem {{ formatEpisodeName(activeEpisode?.name, selectedEpisode) }}
            </div>

            <div class="mt-6 border-t border-white/10 pt-4">
              <div class="hidden">
                <div>
                  <p class="text-xs font-black uppercase tracking-wide text-yellow-200">Chá»n server</p>
                  <h2 class="mt-1 text-[1.08rem] font-black sm:text-xl">Danh sÃ¡ch táº­p</h2>
                </div>
                <p class="text-xs font-bold text-slate-400">
                  {{ serverLabel(activeServer, selectedServer) }}
                </p>
              </div>

              <div v-if="servers.length > 1" class="hidden">
                <button v-for="(server, index) in servers" :key="`${server.name}-${index}-episode-server`" type="button"
                  class="shrink-0 rounded px-4 py-2 text-sm font-black"
                  :class="selectedServer === index ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'"
                  @click="selectServer(index)">
                  {{ serverLabel(server, index) }}
                </button>
              </div>

              <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div class="inline-flex shrink-0 items-center gap-3 text-white">
                  <Menu class="size-5 text-yellow-300" />
                  <button type="button"
                    class="inline-flex items-center gap-2 border-r border-white/15 pr-5 text-xl font-black">
                    Phần 1
                  </button>
                </div>

                <div v-if="servers.length > 1"
                  class="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 lg:pb-0">
                  <button v-for="(server, index) in servers" :key="`${server.name}-${index}-episode-server-pill`"
                    type="button"
                    class="inline-flex shrink-0 items-center gap-2 rounded-md border px-4 py-2 text-sm font-black transition"
                    :class="selectedServer === index ? 'border-white/35 bg-white/12 text-white' : 'border-transparent bg-transparent text-slate-300 hover:bg-white/8 hover:text-white'"
                    @click="selectServer(index)">
                    <span class="size-3 rounded-sm border border-current" aria-hidden="true" />
                    {{ serverLabel(server, index) }}
                  </button>
                </div>

                <div v-else class="text-sm font-bold text-slate-300">
                  {{ serverLabel(activeServer, selectedServer) }}
                </div>

                <div class="hidden shrink-0 items-center gap-2 text-xs font-bold text-slate-300 lg:flex">
                  <span>Rút gọn</span>
                  <span
                    class="relative inline-flex h-5 w-9 items-center rounded-full bg-yellow-400/18 ring-1 ring-yellow-300/35">
                    <span class="ml-auto mr-1 size-3 rounded-full bg-yellow-300" />
                  </span>
                </div>
              </div>

              <div v-if="activeServer?.episodes?.length"
                class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                <NuxtLink v-for="(episode, index) in activeServer.episodes" :key="`${episode.name}-${index}`"
                  :to="episodeLink(index)"
                  class="inline-flex h-14 items-center justify-center gap-2 rounded-md px-3 text-center text-sm font-black transition"
                  :class="selectedEpisode === index ? 'bg-yellow-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/16'">
                  <Play class="size-3 fill-current" />
                  {{ formatEpisodeName(episode.name, index) }}
                </NuxtLink>
              </div>

              <p v-else class="mt-4 rounded-md border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                ChÆ°a cÃ³ táº­p xem tá»« server nÃ y.
              </p>
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
    </Transition>
  </main>
</template>

<style scoped>
.watch-page-enter-active,
.watch-page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.watch-page-enter-from,
.watch-page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.kr-loading-line {
  animation: kr-loading-slide 1s ease-in-out infinite;
}

@keyframes kr-loading-slide {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(320%);
  }
}

.kr-hls-controls {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 10;
  padding: 8px 14px 14px;
  background: linear-gradient(180deg, transparent, rgb(0 0 0 / 0.22) 42%, rgb(0 0 0 / 0.48));
  will-change: opacity, transform;
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.kr-hls-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: white;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.8);
}

.kr-hls-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 12px;
}

.kr-hls-actions-left,
.kr-hls-actions-right {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
}

.kr-hls-actions-right {
  flex-shrink: 0;
}

.kr-hls-control-button {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  cursor: pointer;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: white;
  transition: color 0.16s ease, transform 0.16s ease;
}

.kr-hls-control-button:hover {
  color: rgb(250 204 21);
  transform: scale(1.08);
}

.kr-hls-control-button svg {
  width: 18px;
  height: 18px;
}

.kr-hls-control-button.is-primary {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
  border: 2px solid white;
}

.kr-hls-control-button.is-primary svg {
  width: 17px;
  height: 17px;
}

.kr-hls-desktop-button {
  display: grid;
}

.kr-hls-range,
.kr-volume-range {
  display: block;
  width: 100%;
  height: 4px;
  appearance: none;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(250 204 21) v-bind('`${progressPercent}%`'), rgb(255 255 255 / 0.18) 0);
  cursor: pointer;
  outline: none;
}

.kr-volume-range {
  width: 112px;
  height: 3px;
  background: linear-gradient(90deg, white v-bind('`${videoVolume * 100}%`'), rgb(255 255 255 / 0.25) 0);
}

.kr-hls-range::-webkit-slider-thumb,
.kr-volume-range::-webkit-slider-thumb {
  width: 10px;
  height: 10px;
  appearance: none;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 0 3px rgb(250 204 21 / 0.25);
}

.kr-hls-range::-moz-range-thumb,
.kr-volume-range::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: 0;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 0 3px rgb(250 204 21 / 0.25);
}

.kr-volume-range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  box-shadow: none;
}

.kr-volume-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  box-shadow: none;
}

.kr-hls-edge-progress {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 12;
  height: 4px;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(250 204 21) v-bind('`${progressPercent}%`'), rgb(255 255 255 / 0.24) 0);
  transition: opacity 0.24s ease;
}

@media (max-width: 640px) {
  .kr-hls-desktop-button {
    display: none;
  }

  .kr-hls-controls {
    padding: 6px 10px 10px;
  }

  .kr-hls-time-row {
    margin-bottom: 6px;
    font-size: 11px;
  }

  .kr-hls-actions {
    gap: 8px;
    margin-top: 9px;
  }

  .kr-hls-actions-left,
  .kr-hls-actions-right {
    gap: 8px;
  }

  .kr-hls-control-button {
    width: 25px;
    height: 25px;
    flex-basis: 25px;
  }

  .kr-hls-control-button svg {
    width: 15px;
    height: 15px;
  }

  .kr-hls-control-button.is-primary {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }
}
</style>
