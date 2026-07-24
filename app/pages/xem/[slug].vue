<script setup lang="ts">
import type Hls from 'hls.js'
import {
  AlertTriangle, BadgeCheck, Bug, ChevronRight, CircleHelp, CornerDownLeft, Crown, Eye, EyeOff, FastForward, Heart, Image, Layers,
  Loader2, LogIn, Maximize, MessageCircle, MessageSquare, Pause, PictureInPicture2, Pin, Play, Plus, Rewind,
  Send, Settings, Share2, SkipForward, Star, ThumbsDown, ThumbsUp, Trash2, User, Volume2, VolumeX, Captions, Languages,
} from 'lucide-vue-next'

const route = useRoute()
const selectedServer = ref(Math.max(Number(route.query.server || 0), 0))
const selectedEpisode = ref(Math.max(Number(route.query.ep || 1) - 1, 0))
const selectedSubtitle = ref(0)
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
let touchStartX = 0, touchStartY = 0, touchStartAt = 0
let lastTapAt = 0, lastTapX = 0, holdRestoreRate = 1, ignoreNextTap = false
let hlsFatalRetryCount = 0, autoOrientationFullscreen = false
let hlsPlayer: Hls | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
let lastSavedProgress = 0
const { loadWatchHistory: fetchWatchHistory, saveWatchHistory: persistWatchHistory } = useWatchHistory()
const { isFavorite, saveFavorite, removeFavorite, saveWatchLater } = useMovieLibrary()

const { data: movie, pending, error } = useFetch(() => `/api/movies/${route.params.slug}`, {
  query: computed(() => ({ source: route.query.source, srcs: route.query.srcs })),
  watch: [() => route.query.source, () => route.query.srcs],
})

const currentMovieSource = computed(() => String(route.query.source || movie.value?.source || ''))
const libraryItem = computed(() => movie.value ? {
  source: currentMovieSource.value, slug: String(route.params.slug),
  name: movie.value.name, originName: movie.value.originName, thumb: movie.value.thumb, poster: movie.value.poster, updatedAt: Date.now(),
} : null)

const servers = computed(() => movie.value?.servers ?? [])
const activeServer = computed(() => servers.value[selectedServer.value] ?? servers.value[0])
const activeSubtitle = computed(() => activeServer.value?.channels?.[selectedSubtitle.value] ?? activeServer.value)
const activeEpisode = computed(() => activeSubtitle.value?.episodes?.[selectedEpisode.value] ?? activeSubtitle.value?.episodes?.[0])


// Related movies
const { data: relatedData } = await useFetch('/api/movies', {
  query: computed(() => ({ page: 1 })),
  lazy: true, default: () => ({ items: [] }),
})
const relatedMovies = computed(() => {
  const items = relatedData.value?.items ?? []
  const currentSlug = route.params.slug
  const currentCategories = movie.value?.categories ?? []
  return items
    .filter((m: any) => m.slug !== currentSlug)
    .filter((m: any) => m.categories?.some((c: string) => currentCategories.includes(c)))
    .slice(0, 8)
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

function subtitleLabel(server: any, index: number) {
  return String(server?.name || `Vietsub #${index + 1}`).replace(/^(ophim|nguonc|kkphim)\s*-\s*/i, '').trim()
}

function episodeLink(index: number) {
  return { path: `/xem/${route.params.slug}`, query: { source: route.query.source, srcs: route.query.srcs, server: selectedServer.value, ep: index + 1 } }
}

function episodeIndexForServer(serverIndex: number, subIndex = selectedSubtitle.value, episodeIndex = selectedEpisode.value) {
  const sub = servers.value[serverIndex]?.channels?.[subIndex] ?? servers.value[serverIndex]
  const count = sub?.episodes?.length || 0
  return count ? Math.min(Math.max(episodeIndex, 0), count - 1) : 0
}

async function selectServer(index: number) {
  if (index === selectedServer.value) return
  const shouldAutoplay = hasStarted.value
  selectedServer.value = index
  selectedSubtitle.value = 0
  selectedEpisode.value = episodeIndexForServer(index, 0)
  resetProgressTimer(); destroyHlsPlayer()
  await navigateTo({ path: `/xem/${route.params.slug}`, query: { ...route.query, server: index, ep: selectedEpisode.value + 1 } }, { replace: true })
  if (shouldAutoplay) nextTick(() => startPlayer())
}

async function selectSubtitle(index: number) {
  if (index === selectedSubtitle.value) return
  selectedSubtitle.value = index
  selectedEpisode.value = episodeIndexForServer(selectedServer.value, index)
  resetProgressTimer(); destroyHlsPlayer()
  await navigateTo({ path: `/xem/${route.params.slug}`, query: { ...route.query, server: selectedServer.value, ep: selectedEpisode.value + 1 } }, { replace: true })
  if (hasStarted.value) nextTick(() => startPlayer())
}

async function startPlayer() {
  hasStarted.value = true
  await loadResumeProgress()
  startProgressTimer(); saveWatchHistory()
  nextTick(() => setupHlsPlayer(true))
  nextTick(() => handleOrientationFullscreen())
}

function parseDurationSeconds(value: string) {
  const nv = value.toLowerCase()
  const h = nv.match(/(\d+)\s*(?:h|giờ|gio)/)
  const m = nv.match(/(\d+)\s*(?:m|min|phút|phut|p)/) || nv.match(/^(\d+)$/)
  return Math.max(((h ? Number(h[1]) : 0) * 60 + (m ? Number(m[1]) : 0)) * 60, 0)
}

function resetProgressTimer() {
  progressSeconds.value = 0; videoCurrentTime.value = 0; videoDuration.value = 0
  isVideoPlaying.value = false; isVideoBuffering.value = false; hlsErrorMessage.value = ''
  pendingResumeSeconds.value = 0; lastSavedProgress = 0; clearHlsFallbackTimer(); stopProgressTimer()
}
function stopProgressTimer() { if (progressTimer) { clearInterval(progressTimer); progressTimer = undefined } }
function tickProgress() {
  if (!hasStarted.value || (import.meta.client && document.visibilityState === 'hidden')) return
  if (videoRef.value) { progressSeconds.value = Math.floor(videoRef.value.currentTime || 0); videoCurrentTime.value = progressSeconds.value }
  else progressSeconds.value += 1
  if (durationSeconds.value) progressSeconds.value = Math.min(progressSeconds.value, durationSeconds.value)
  if (progressSeconds.value - lastSavedProgress >= 10) { lastSavedProgress = progressSeconds.value; saveWatchHistory() }
}
function startProgressTimer() { if (!import.meta.client || progressTimer) return; progressTimer = setInterval(tickProgress, 1000) }
function handleVisibilityChange() { if (!import.meta.client || document.visibilityState !== 'hidden' || !hasStarted.value) return; saveWatchHistory() }
function handleKeyboardShortcut(event: KeyboardEvent) {
  if (!hasStarted.value || !videoRef.value) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return
  const key = event.key.toLowerCase()
  if (key === ' ') { event.preventDefault(); toggleHlsPlayback() }
  else if (key === 'arrowleft') { event.preventDefault(); seekBy(-10) }
  else if (key === 'arrowright') { event.preventDefault(); seekBy(10) }
  else if (key === 'f') { event.preventDefault(); toggleFullscreen() }
  else if (key === 'm') { event.preventDefault(); toggleMute() }
  else if (key === 'p') { event.preventDefault(); togglePictureInPicture() }
}
function showControlsTemporarily() {
  controlsVisible.value = true
  if (controlsHideTimer) clearTimeout(controlsHideTimer)
  if (!isVideoPlaying.value || isSettingsOpen.value) return
  controlsHideTimer = setTimeout(() => { controlsVisible.value = false }, 2600)
}
function showFullscreenProgressOnly() {
  if (!isHlsFullscreen.value) return
  edgeProgressVisible.value = true; controlsVisible.value = false
  if (edgeProgressTimer) clearTimeout(edgeProgressTimer)
  edgeProgressTimer = setTimeout(() => { edgeProgressVisible.value = false }, 1400)
}
function clearHlsFallbackTimer() { if (hlsFallbackTimer) { clearTimeout(hlsFallbackTimer); hlsFallbackTimer = undefined } }
function scheduleHlsFallback(message = 'HLS phản hồi chậm...') {
  clearHlsFallbackTimer()
  hlsFallbackTimer = setTimeout(() => { hlsErrorMessage.value = message; isVideoBuffering.value = false; isVideoPlaying.value = false }, 12000)
}
function flashGestureHint(message: string) { gestureHint.value = message; window.setTimeout(() => { if (gestureHint.value === message) gestureHint.value = '' }, 650) }
function formatPlayerTime(seconds = 0) {
  const t = Math.max(Math.floor(seconds), 0)
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

async function setupHlsPlayer(autoplay = false, tryProxy = true) {
  if (!import.meta.client || !videoRef.value || !hlsPlayerUrl.value) return
  destroyHlsPlayer(); hlsFatalRetryCount = 0
  const video = videoRef.value; isVideoBuffering.value = true; hlsErrorMessage.value = ''
  video.volume = videoVolume.value; video.muted = isVideoMuted.value; video.playbackRate = playbackRate.value
  let sourceUrl = tryProxy ? getProxyUrl(hlsPlayerUrl.value) : hlsPlayerUrl.value
  if (video.canPlayType('application/vnd.apple.mpegurl') && !tryProxy) {
    video.src = sourceUrl; scheduleHlsFallback()
    const handleError = () => { video.removeEventListener('error', handleError); setupHlsPlayer(autoplay, false) }
    video.addEventListener('error', handleError)
  } else {
    try {
      const { default: HlsPlayer } = await import('hls.js')
      if (!HlsPlayer.isSupported()) { hlsErrorMessage.value = 'Trình duyệt chưa hỗ trợ HLS.'; isVideoBuffering.value = false; return }
      hlsPlayer = new HlsPlayer({ enableWorker: true, lowLatencyMode: true, xhrSetup: (xhr) => { xhr.withCredentials = false } })
      hlsPlayer.on(HlsPlayer.Events.MANIFEST_PARSED, () => {
        clearHlsFallbackTimer()
        qualityLevels.value = hlsPlayer?.levels.map((l, i) => ({ label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`, level: i })).filter(l => l.label !== '0kbps') ?? []
        selectedQuality.value = -1; applyResumeProgress()
      })
      hlsPlayer.on(HlsPlayer.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        if (tryProxy) { hlsErrorMessage.value = 'Proxy lỗi, đang thử trực tiếp...'; hlsPlayer?.destroy(); setTimeout(() => { setupHlsPlayer(autoplay, false) }, 100); return }
        hlsFatalRetryCount += 1
        if (hlsFatalRetryCount >= 2) { hlsErrorMessage.value = 'HLS tải không ổn định.'; isVideoBuffering.value = false; isVideoPlaying.value = false; return }
        if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR) { hlsErrorMessage.value = 'Mạng chập chờn, đang thử lại...'; hlsPlayer?.startLoad() }
        else if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR) { hlsErrorMessage.value = 'Lỗi giải mã, đang khôi phục...'; hlsPlayer?.recoverMediaError() }
        else { hlsErrorMessage.value = 'Link HLS lỗi, chuyển sang chế độ Nhúng nhé.' }
      })
      hlsPlayer.loadSource(sourceUrl); hlsPlayer.attachMedia(video); scheduleHlsFallback()
    } catch { hlsErrorMessage.value = 'Lỗi khởi tạo HLS player.'; isVideoBuffering.value = false; isVideoPlaying.value = false }
  }
  if (autoplay) { try { await video.play() } catch { isVideoPlaying.value = false; hlsErrorMessage.value = 'HLS chưa phát được.' } }
}

function destroyHlsPlayer() {
  clearHlsFallbackTimer()
  if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = undefined }
  if (videoRef.value) { videoRef.value.removeAttribute('src'); videoRef.value.load() }
  qualityLevels.value = []; selectedQuality.value = -1
}

function updateVideoTime() {
  if (!videoRef.value) return
  videoCurrentTime.value = Math.floor(videoRef.value.currentTime || 0); progressSeconds.value = videoCurrentTime.value
  if (Number.isFinite(videoRef.value.duration)) videoDuration.value = Math.floor(videoRef.value.duration || 0)
}
function updateVideoMetadata() { clearHlsFallbackTimer(); updateVideoTime(); applyResumeProgress(); isVideoBuffering.value = false }
function handleVideoCanPlay() { clearHlsFallbackTimer(); isVideoBuffering.value = false }
function handleVideoWaiting() { isVideoBuffering.value = true; scheduleHlsFallback('HLS bị đứng...') }
function handleVideoPlaying() { clearHlsFallbackTimer(); isVideoBuffering.value = false }
function handleVideoError() { hlsErrorMessage.value = 'HLS phát lỗi.'; isVideoBuffering.value = false; isVideoPlaying.value = false }

async function loadResumeProgress() {
  if (!import.meta.client || !movie.value) return
  const source = String(route.query.source || movie.value.source || '')
  const items = await fetchWatchHistory(30)
  const item = items.find((i) => i.slug === String(route.params.slug) && i.source === source)
  const saved = Math.floor(item?.progressSeconds || 0)
  if (!saved || (item?.episodeIndex ?? 0) !== selectedEpisode.value) return
  pendingResumeSeconds.value = saved; progressSeconds.value = saved; videoCurrentTime.value = saved
}

function applyResumeProgress() {
  if (!videoRef.value || !pendingResumeSeconds.value) return
  const resumeAt = durationSeconds.value ? Math.min(pendingResumeSeconds.value, Math.max(durationSeconds.value - 8, 0)) : pendingResumeSeconds.value
  videoRef.value.currentTime = resumeAt; videoCurrentTime.value = Math.floor(resumeAt); progressSeconds.value = videoCurrentTime.value; pendingResumeSeconds.value = 0
}

function toggleHlsPlayback() { if (!videoRef.value) return; videoRef.value.paused ? videoRef.value.play() : videoRef.value.pause() }
function seekBy(seconds: number) {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.min(Math.max((videoRef.value.currentTime || 0) + seconds, 0), durationSeconds.value || Number.MAX_SAFE_INTEGER)
  updateVideoTime()
  if (isHlsFullscreen.value) showFullscreenProgressOnly(); else showControlsTemporarily()
  saveWatchHistory()
}
function seekHlsPlayer(event: Event) { if (!videoRef.value) return; videoRef.value.currentTime = Number((event.target as HTMLInputElement).value); updateVideoTime(); if (isHlsFullscreen.value) showFullscreenProgressOnly(); saveWatchHistory() }
function toggleMute() { if (!videoRef.value) return; videoRef.value.muted = !videoRef.value.muted; isVideoMuted.value = videoRef.value.muted }
function changeVolume(event: Event) { if (!videoRef.value) return; const v = Number((event.target as HTMLInputElement).value); videoVolume.value = v; videoRef.value.volume = v; videoRef.value.muted = v === 0; isVideoMuted.value = videoRef.value.muted }
function changePlaybackRate(event: Event) { if (!videoRef.value) return; playbackRate.value = Number((event.target as HTMLSelectElement).value); videoRef.value.playbackRate = playbackRate.value; showControlsTemporarily() }
function changeQuality(event: Event) { const v = Number((event.target as HTMLSelectElement).value); selectedQuality.value = v; if (hlsPlayer) hlsPlayer.currentLevel = v; showControlsTemporarily() }
function getDocumentFullscreenElement() { if (!import.meta.client) return null; return document.fullscreenElement || (document as any).webkitFullscreenElement || null }
async function enterPlayerFullscreen() {
  if (!import.meta.client) return false
  const video = videoRef.value as any, target = (playerShellRef.value || playerViewportRef.value || video?.parentElement || video) as any
  if (!target && !video) return false
  try { if (target?.requestFullscreen) { await target.requestFullscreen(); return true } if (target?.webkitRequestFullscreen) { await target.webkitRequestFullscreen(); return true } if (video?.webkitEnterFullscreen) { video.webkitEnterFullscreen(); return true } } catch { try { video?.webkitEnterFullscreen?.(); return Boolean(video) } catch { return false } }
  return false
}
async function exitPlayerFullscreen() { if (document.exitFullscreen) await document.exitFullscreen(); else await (document as any).webkitExitFullscreen?.() }
async function toggleFullscreen() { if (!import.meta.client) return; try { if (getDocumentFullscreenElement()) { await exitPlayerFullscreen(); return } await enterPlayerFullscreen() } catch { await enterPlayerFullscreen() } }
function updateFullscreenState() {
  if (!import.meta.client) return
  const fe = getDocumentFullscreenElement(), pe = playerShellRef.value || playerViewportRef.value
  isHlsFullscreen.value = Boolean(fe && pe && (pe.contains(fe) || fe.contains(pe)))
  if (!isHlsFullscreen.value) edgeProgressVisible.value = false
  if (!fe) autoOrientationFullscreen = false
}
function isMobileLandscapeViewport() {
  if (!import.meta.client) return false
  return (window.matchMedia?.('(pointer: coarse)').matches ?? false) && (window.matchMedia?.('(max-width: 940px)').matches ?? window.innerWidth <= 940) && (window.matchMedia?.('(orientation: landscape)').matches ?? window.innerWidth > window.innerHeight)
}
async function handleOrientationFullscreen() {
  if (!import.meta.client || !hasStarted.value) return
  const fe = getDocumentFullscreenElement()
  if (!isMobileLandscapeViewport()) { if (fe && autoOrientationFullscreen) await exitPlayerFullscreen(); return }
  if (fe) return
  autoOrientationFullscreen = await enterPlayerFullscreen()
  if (autoOrientationFullscreen) { controlsVisible.value = false; showFullscreenProgressOnly() }
}
async function togglePictureInPicture() { if (!videoRef.value || !document.pictureInPictureEnabled) return; document.pictureInPictureElement ? await document.exitPictureInPicture() : await videoRef.value.requestPictureInPicture() }
function skipIntro() { if (!videoRef.value) return; videoRef.value.currentTime = Math.max(videoRef.value.currentTime, skipIntroSeconds); updateVideoTime() }
function skipOutro() { if (!videoRef.value || !skipOutroSeconds.value) return; videoRef.value.currentTime = skipOutroSeconds.value; updateVideoTime() }
function playNextEpisode(autoplay = true) {
  if (!hasNextEpisode.value) return
  selectedEpisode.value += 1; hasStarted.value = false; resetProgressTimer(); destroyHlsPlayer()
  navigateTo(episodeLink(selectedEpisode.value), { replace: true })
  if (autoplay) nextTick(() => startPlayer())
}
function handleVideoEnded() { isVideoPlaying.value = false; saveWatchHistory(); playNextEpisode(true) }
function seekByTapPosition(clientX: number) { seekBy(clientX < (playerShellRef.value?.getBoundingClientRect().left || 0) + (playerShellRef.value?.getBoundingClientRect().width || 0) / 2 ? -10 : 10); flashGestureHint(clientX < (playerShellRef.value?.getBoundingClientRect().left || 0) + (playerShellRef.value?.getBoundingClientRect().width || 0) / 2 ? '-10s' : '+10s') }
function handlePlayerPointerDown() {
  if (!videoRef.value) return
  if (holdSpeedTimer) clearTimeout(holdSpeedTimer)
  holdSpeedTimer = setTimeout(() => {
    if (!videoRef.value) return
    holdRestoreRate = videoRef.value.playbackRate || playbackRate.value || 1; videoRef.value.playbackRate = 2; isHoldSpeedActive.value = true; ignoreNextTap = true; flashGestureHint('2x')
    if (isHlsFullscreen.value) showFullscreenProgressOnly()
  }, 420)
}
function stopHoldSpeed() {
  if (holdSpeedTimer) { clearTimeout(holdSpeedTimer); holdSpeedTimer = undefined }
  if (!isHoldSpeedActive.value) return
  if (videoRef.value) videoRef.value.playbackRate = playbackRate.value || holdRestoreRate || 1
  isHoldSpeedActive.value = false; window.setTimeout(() => { ignoreNextTap = false }, 80)
}
function handlePlayerTap(event: MouseEvent) {
  if (ignoreNextTap) { ignoreNextTap = false; return }
  const now = Date.now(), tapX = event.clientX, isDouble = now - lastTapAt < 280 && Math.abs(tapX - lastTapX) < 90
  if (isDouble) { if (singleTapTimer) { clearTimeout(singleTapTimer); singleTapTimer = undefined }; lastTapAt = 0; seekByTapPosition(tapX); return }
  lastTapAt = now; lastTapX = tapX; if (singleTapTimer) clearTimeout(singleTapTimer)
  singleTapTimer = setTimeout(() => { toggleHlsPlayback(); singleTapTimer = undefined }, 260)
}
function handleTouchStart(event: TouchEvent) { const t = event.touches[0]; if (!t) return; touchStartX = t.clientX; touchStartY = t.clientY; touchStartAt = Date.now() }
function handleTouchEnd(event: TouchEvent) {
  if (!videoRef.value) return; const t = event.changedTouches[0]; if (!t) return
  const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY, el = Date.now() - touchStartAt
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) && el < 700) { seekBy(dx > 0 ? 10 : -10); flashGestureHint(dx > 0 ? '+10s' : '-10s'); return }
  if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx)) {
    const nv = Math.min(Math.max(videoVolume.value + (dy < 0 ? 0.1 : -0.1), 0), 1)
    videoVolume.value = Number(nv.toFixed(1)); videoRef.value.volume = videoVolume.value; videoRef.value.muted = videoVolume.value === 0; isVideoMuted.value = videoRef.value.muted
  }
}

async function saveWatchHistory() {
  if (!import.meta.client || !movie.value) return
  await persistWatchHistory({
    source: String(route.query.source || movie.value.source || ''), slug: String(route.params.slug),
    name: movie.value.name, originName: movie.value.originName, thumb: movie.value.thumb, poster: movie.value.poster,
    episodeName: activeEpisode.value?.name, episodeIndex: selectedEpisode.value, serverIndex: selectedServer.value,
    progressSeconds: Math.floor(progressSeconds.value), durationSeconds: Math.floor(durationSeconds.value), updatedAt: Date.now(),
  })
}

function flashActionMessage(message: string) { actionMessage.value = message; window.setTimeout(() => { if (actionMessage.value === message) actionMessage.value = '' }, 2200) }
async function refreshFavoriteState() { if (!libraryItem.value) return; isFavoriteMovie.value = await isFavorite(libraryItem.value) }
async function toggleFavorite() {
  if (!libraryItem.value || actionBusy.value) return; actionBusy.value = true
  if (isFavoriteMovie.value) { await removeFavorite(libraryItem.value); isFavoriteMovie.value = false; flashActionMessage('Đã bỏ khỏi yêu thích.') }
  else { await saveFavorite(libraryItem.value); isFavoriteMovie.value = true; flashActionMessage('Đã lưu vào yêu thích.') }
  actionBusy.value = false
}
async function addToWatchLater() {
  if (!libraryItem.value || actionBusy.value) return; actionBusy.value = true; await saveWatchLater(libraryItem.value); actionBusy.value = false; flashActionMessage('Đã thêm vào xem sau.')
}
async function shareMovie() {
  if (!import.meta.client || !movie.value) return
  try { if (navigator.share) { await navigator.share({ title: `${movie.value.name} - CineK`, text: activeEpisode.value?.name || movie.value.name, url: window.location.href }); return } await navigator.clipboard.writeText(window.location.href); flashActionMessage('Đã copy link.') }
  catch { flashActionMessage('Chưa chia sẻ được.') }
}

function getEpisodeDisplay() {
  const ep = movie.value?.episode, total = movie.value?.episodeTotal
  if (!ep) return undefined
  const totalNum = total ? total.replace(/[^0-9]/g, '') : '', epNum = ep.replace(/[^0-9]/g, '')
  if (epNum && totalNum && epNum !== totalNum) return `Tập ${epNum}/${totalNum}`
  return ep
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
  if (hasStarted.value) saveWatchHistory(); stopProgressTimer()
  if (controlsHideTimer) clearTimeout(controlsHideTimer); if (edgeProgressTimer) clearTimeout(edgeProgressTimer)
  if (singleTapTimer) clearTimeout(singleTapTimer); if (holdSpeedTimer) clearTimeout(holdSpeedTimer)
  if (draftAutoSaveTimer) clearTimeout(draftAutoSaveTimer)
  clearHlsFallbackTimer(); destroyHlsPlayer()
  if (import.meta.client) { document.removeEventListener('visibilitychange', handleVisibilityChange); document.removeEventListener('keydown', handleKeyboardShortcut); document.removeEventListener('fullscreenchange', updateFullscreenState); document.removeEventListener('webkitfullscreenchange', updateFullscreenState); window.removeEventListener('orientationchange', handleOrientationFullscreen); window.removeEventListener('resize', handleOrientationFullscreen); screen.orientation?.removeEventListener?.('change', handleOrientationFullscreen) }
})
watch(() => route.query, () => { selectedServer.value = Math.max(Number(route.query.server || 0), 0); selectedEpisode.value = Math.max(Number(route.query.ep || 1) - 1, 0); selectedSubtitle.value = 0; hasStarted.value = false; resetProgressTimer(); destroyHlsPlayer() })
watch([movie, activeEpisode], () => { if (hasStarted.value) saveWatchHistory() })
watch(libraryItem, () => { refreshFavoriteState() })
useHead(() => ({
  title: movie.value ? `Xem ${movie.value.name} - CineK` : 'Đang tải - CineK',
  meta: [{ name: 'description', content: movie.value ? `Xem ${movie.value.name} online` : '' }, { property: 'og:title', content: movie.value ? `${movie.value.name} - CineK` : 'CineK' }, { property: 'og:image', content: movie.value?.poster || movie.value?.thumb || '/icon.png' }],
}))
</script>

<template>
  <main class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <!-- Loading -->
    <section v-if="pending && !movie" class="mx-auto max-w-350 px-4 pt-20 sm:px-6 lg:px-8 xl:px-10">
      <div class="-mx-4 mb-6 overflow-hidden sm:mx-0 sm:rounded-xl">
        <div class="aspect-video w-full animate-pulse rounded-none sm:rounded-t-xl bg-white/10" />
        <div class="flex h-14 items-center justify-between border-t border-white/5 bg-black px-4 sm:px-6">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            <div class="h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
          <div class="flex items-center gap-3">
            <div v-for="i in 4" :key="i" class="h-7 w-7 animate-pulse rounded-md bg-white/10" />
          </div>
        </div>
      </div>
    </section>

    <!-- Error -->
    <div v-else-if="error || !movie" class="mx-auto flex min-h-screen max-w-4xl items-center px-4 pt-36">
      <div>
        <h1 class="text-3xl font-black">Không mở được phim</h1>
        <p class="mt-3 text-slate-300">Phim có thể đang được cập nhật.</p>
      </div>
    </div>

    <!-- Watch Page -->
    <template v-else>
      <section class="mx-auto max-w-350 px-4 pt-16 sm:px-6 lg:px-8 xl:px-10">
        <!-- Player -->
        <div class="-mx-4 mb-6 overflow-hidden sm:mx-0 sm:rounded-xl">
          <div ref="playerViewportRef" class="relative aspect-video bg-slate-950">
            <div v-if="pending"
              class="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/45 text-yellow-200 backdrop-blur-[1px]">
              <div
                class="inline-flex items-center gap-3 rounded-full border border-yellow-300/25 bg-black/70 px-4 py-2 text-xs font-black shadow-xl shadow-black/30">
                <Loader2 class="size-4 animate-spin" /> Đang tải phim
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
                {{ hlsErrorMessage }}</div>
              <button v-if="videoCurrentTime < skipIntroSeconds && durationSeconds > 180" type="button"
                class="absolute bottom-24 right-4 z-20 rounded-md border border-yellow-300/80 bg-black/55 px-4 py-2 text-xs font-black text-yellow-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-yellow-200 hover:bg-yellow-400 hover:text-slate-950"
                @click="skipIntro">Bỏ intro</button>
              <button v-if="skipOutroSeconds && videoCurrentTime > skipOutroSeconds - 45 && hasNextEpisode"
                type="button"
                class="absolute bottom-24 right-4 z-20 inline-flex items-center gap-2 rounded-md border border-yellow-300/80 bg-black/55 px-4 py-2 text-xs font-black text-yellow-200 shadow-lg shadow-black/30 backdrop-blur transition hover:border-yellow-200 hover:bg-yellow-400 hover:text-slate-950"
                @click="playNextEpisode(true)">
                <SkipForward class="size-4" /> Tập tiếp
              </button>
              <button type="button"
                class="absolute inset-0 grid cursor-pointer place-items-center text-white transition"
                :class="isVideoPlaying && !controlsVisible ? 'opacity-0' : 'opacity-100'" @click="handlePlayerTap"
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
                {{ isHoldSpeedActive ? '2x' : gestureHint }}</div>
              <div class="kr-hls-edge-progress"
                :class="edgeProgressVisible || (isHlsFullscreen && !shouldShowHlsControls) ? 'opacity-100' : 'opacity-0'" />
              <div class="kr-hls-controls text-white transition"
                :class="shouldShowHlsControls ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'">
                <div class="kr-hls-time-row"><span>{{ formatPlayerTime(videoCurrentTime) }}</span><span>{{
                  formatPlayerTime(durationSeconds) }}</span></div>
                <input class="kr-hls-range" type="range" min="0" :max="durationSeconds || 0" :value="videoCurrentTime"
                  step="1" @input="seekHlsPlayer">
                <div class="kr-hls-actions">
                  <div class="kr-hls-actions-left">
                    <button type="button" class="kr-hls-control-button is-primary" @click="toggleHlsPlayback">
                      <Pause v-if="isVideoPlaying" class="fill-current" />
                      <Play v-else class="fill-current" />
                    </button>
                    <button type="button" class="kr-hls-control-button" @click="seekBy(-10)">
                      <Rewind />
                    </button>
                    <button type="button" class="kr-hls-control-button" @click="seekBy(10)">
                      <FastForward />
                    </button>
                    <button type="button" class="kr-hls-control-button" @click="toggleMute">
                      <VolumeX v-if="isVideoMuted" />
                      <Volume2 v-else />
                    </button>
                    <input class="kr-volume-range hidden sm:block" type="range" min="0" max="1" step="0.05"
                      :value="videoVolume" @input="changeVolume">
                  </div>
                  <div class="kr-hls-actions-right">
                    <div class="relative">
                      <button type="button" class="kr-hls-control-button"
                        :class="isSettingsOpen ? 'bg-yellow-400 text-slate-950' : ''"
                        @click="isSettingsOpen = !isSettingsOpen; controlsVisible = true">
                        <Settings />
                      </button>
                      <div v-if="isSettingsOpen"
                        class="absolute bottom-10 right-0 z-30 w-48 rounded-md border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur sm:bottom-12 sm:w-56">
                        <label class="block text-[11px] font-black uppercase text-slate-400">Tốc độ phát</label>
                        <select
                          class="mt-2 h-10 w-full cursor-pointer rounded-md border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none"
                          :value="playbackRate" @change="changePlaybackRate">
                          <option class="bg-slate-950" value="0.75">0.75x</option>
                          <option class="bg-slate-950" value="1">1x</option>
                          <option class="bg-slate-950" value="1.25">1.25x</option>
                          <option class="bg-slate-950" value="1.5">1.5x</option>
                          <option class="bg-slate-950" value="2">2x</option>
                        </select>
                        <label class="mt-4 block text-[11px] font-black uppercase text-slate-400">Chất lượng</label>
                        <select
                          class="mt-2 h-10 w-full cursor-pointer rounded-md border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          :value="selectedQuality" :disabled="!qualityLevels.length" @change="changeQuality">
                          <option class="bg-slate-950" value="-1">Auto</option>
                          <option v-for="level in qualityLevels" :key="level.level" class="bg-slate-950"
                            :value="level.level">{{ level.label }}</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" class="kr-hls-control-button kr-hls-desktop-button"
                      @click="togglePictureInPicture">
                      <PictureInPicture2 />
                    </button>
                    <button v-if="hasNextEpisode" type="button" class="kr-hls-control-button kr-hls-desktop-button"
                      @click="playNextEpisode(true)">
                      <SkipForward />
                    </button>
                    <button type="button" class="kr-hls-control-button" @click="toggleFullscreen">
                      <Maximize />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button v-else type="button" class="absolute inset-0 text-white" @click="startPlayer">
              <img :src="movie.thumb || movie.poster" :alt="movie.name" class="h-full w-full object-cover opacity-45">
              <div class="absolute inset-0 bg-black/45" />
              <div class="absolute inset-0 grid place-items-center">
                <span
                  class="grid size-16 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-xl shadow-yellow-950/30">
                  <Play class="size-7 fill-current" />
                </span>
              </div>
            </button>
          </div>

          <!-- Player Toolbar -->
          <div class="flex h-14 items-center justify-between border-t border-white/5 bg-black px-4 sm:px-6">
            <div class="flex items-center gap-3">
              <div class="grid size-8 place-items-center rounded-full bg-yellow-400/20 text-yellow-300">
                <Play class="size-4 fill-current" />
              </div>
              <div class="text-sm">
                <span class="font-semibold text-white">{{ formatEpisodeName(activeEpisode?.name, selectedEpisode)
                }}</span>
                <span class="mx-2 text-white/30">•</span>
                <span class="text-white/60">{{ serverLabel(activeServer, selectedServer) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button type="button"
                class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
                title="Báo lỗi">
                <Bug class="size-4" /><span class="hidden sm:inline">Báo lỗi</span>
              </button>
              <button type="button"
                class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
                title="Hướng dẫn">
                <CircleHelp class="size-4" /><span class="hidden sm:inline">Hướng dẫn</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Movie Info + Episodes -->
        <div class="mt-4 flex flex-col gap-8 xl:mt-8 xl:flex-row">
          <!-- Main Content -->
          <div class="min-w-0 flex-1">
            <!-- Movie Info Card -->
            <div class="mb-6 flex items-start gap-6 lg:gap-8">
              <div
                class="hidden shrink-0 aspect-2/3 w-32 rounded-xl overflow-hidden shadow-2xl sm:block md:w-40 lg:w-37.5">
                <img :src="movie.poster || movie.thumb" :alt="movie.name" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 flex flex-col gap-4 pt-1 w-full text-center sm:text-left">
                <div>
                  <h1 class="text-2xl md:text-[28px] font-bold text-white mb-2 leading-tight">{{ movie.name }}</h1>
                  <h2 class="text-cinek-500 text-sm md:text-[15px] font-medium opacity-90">{{ movie.originName }}</h2>
                </div>

                <!-- Badges -->
                <div class="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <span v-if="movie.rating"
                    class="inline-flex items-center rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                    <span class="bg-[#01B4E4] text-white px-1.5 py-0.5 font-bold text-[10px]">TMDb</span>
                    <span class="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5 text-[10px]">{{
                      movie.rating.toFixed(1) }}</span>
                  </span>
                  <span v-if="movie.quality"
                    class="inline-flex items-center justify-center rounded-sm font-black h-5.5 px-2 text-[11px]"
                    style="background-color:#ffd875;background-image:linear-gradient(220deg, #ffd875 0%, #ffe7a8 45%, #ffffff 100%);color:#141414">{{
                      movie.quality }}</span>
                  <span v-if="movie.year"
                    class="text-[11px] font-medium px-2 py-0.5 border border-white/20 rounded text-white/90">{{
                      movie.year }}</span>
                  <span v-if="getEpisodeDisplay()"
                    class="text-[11px] font-medium px-2 py-0.5 border border-white/20 rounded text-white/90">{{
                      getEpisodeDisplay() }}</span>
                </div>

                <!-- Genres -->
                <div v-if="movie.categories?.length"
                  class="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <span v-for="cat in movie.categories.slice(0, 4)" :key="cat"
                    class="text-[11px] font-medium px-2.5 py-1 bg-white/5 rounded text-white/70">{{ cat }}</span>
                </div>

                <!-- Episode Progress -->
                <div v-if="episodeProgress?.total"
                  class="inline-flex self-center sm:self-start items-center gap-1.5 px-3 py-1.5 rounded-full mt-2 border bg-cinek-500/10 border-cinek-500/20 text-cinek-500">
                  <Loader2 class="size-3.5 animate-spin" />
                  <span class="text-xs font-medium">Đã chiếu: {{ episodeProgress.available }} / {{ episodeProgress.total
                    }} tập</span>
                </div>

                <!-- Description -->
                <div class="mt-2 text-left">
                  <p class="text-[13px] md:text-sm text-white/70 leading-relaxed line-clamp-3"
                    :class="descriptionExpanded ? 'line-clamp-none' : ''">{{ movie.content ||
                      'Đang cập nhật nội dung phim.' }}</p>
                  <NuxtLink
                    :to="{ path: `/phim/${route.params.slug}`, query: { source: route.query.source, srcs: route.query.srcs } }"
                    class="inline-flex items-center gap-1 text-[13px] text-cinek-500 hover:underline mt-1">
                    Thông tin phim
                    <ChevronRight class="size-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Episode Section -->
            <div id="episodes-section" class="mt-8 mb-12 scroll-mt-24">
              <!-- Header: Season + Server -->
              <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div class="relative flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <div class="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-white/50">
                    <Layers class="size-4" /> Phần:
                  </div>
                  <button
                    class="flex items-center gap-1.5 border border-white/30 text-white bg-white/5 rounded-md px-3 py-1.5 text-sm font-medium">
                    <span>Phần 1</span>
                  </button>
                </div>
                <div class="flex min-w-0 items-center gap-2">
                  <span class="text-[13px] text-white/60 font-medium hidden sm:inline-block shrink-0">Chọn
                    Server:</span>
                  <div class="relative min-w-0 sm:w-auto">
                    <div class="flex flex-wrap gap-2">
                      <button v-for="(server, index) in servers" :key="server.name" type="button"
                        class="flex items-center gap-1.5 text-[13px] transition-colors rounded-md px-3 py-1.5 border font-medium"
                        :class="selectedServer === index ? 'border-white/30 text-white bg-white/5' : 'border-transparent text-white/60 hover:text-white'"
                        @click="selectServer(index)">
                        {{ serverLabel(server, index) }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Subtitle/Source Buttons -->
              <div v-if="activeServer?.channels?.length" class="flex flex-wrap gap-2 mb-6">
                <button v-for="(sub, index) in activeServer.channels" :key="sub.name || index" type="button"
                  class="group flex items-center gap-1.5 text-xs transition-colors rounded-md px-3 py-1.5 border font-medium"
                  :class="selectedSubtitle === index ? 'border-white/30 text-white bg-white/5' : 'border-transparent text-white/60 hover:text-white'"
                  @click="selectSubtitle(index)">
                  <Captions v-if="index === 0" class="size-3.5" />
                  <Languages v-else class="size-3.5" />
                  <span>{{ subtitleLabel(sub, index) }}</span>
                  <span class="rounded px-1.5 text-[10px] font-bold"
                    :class="selectedSubtitle === index ? 'bg-white text-black' : 'bg-white/10 text-white/50'">
                    {{ sub.episodes?.length || 0 }}
                  </span>
                </button>
              </div>

              <!-- Episode Grid -->
              <div v-if="activeSubtitle?.episodes?.length"
                class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-2.5 gap-y-2.5">
                <NuxtLink v-for="(episode, index) in activeSubtitle.episodes" :key="`${episode.name}-${index}`"
                  :to="episodeLink(index)"
                  class="group flex items-center justify-center gap-1.5 rounded-lg transition-all py-2.5 px-2 text-[13px] bg-[#191b24] text-white/90 hover:text-[#FFD166] hover:bg-[#1f2130] shadow-sm"
                  :class="selectedEpisode === index ? 'bg-[#F5C518]/20 text-[#FFD166] border border-[#F5C518]/40' : ''">
                  <Play class="size-3 fill-current" />
                  {{ formatEpisodeName(episode.name, index) }}
                </NuxtLink>
              </div>
              <p v-else
                class="mt-4 rounded-lg border border-white/10 bg-[#191b24] p-6 text-center text-sm text-slate-400">
                Chưa có tập xem.
              </p>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="xl:w-[320px] shrink-0 xl:border-l xl:border-white/5 xl:pl-8">
            <h3 class="text-sm font-bold text-white mb-4">Phim đề xuất</h3>
            <div class="space-y-3">
              <NuxtLink v-for="rel in relatedMovies" :key="rel.slug"
                :to="{ path: `/phim/${rel.slug}`, query: { source: rel.source } }"
                class="flex gap-3 group rounded-lg p-2 transition hover:bg-white/5 bg-[#1A1A24]">
                <img :src="rel.thumb || rel.poster" :alt="rel.name" class="w-12 h-16 rounded object-cover shrink-0">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-white group-hover:text-yellow-300 transition truncate">{{
                    rel.name }}</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ rel.year || rel.quality || '' }}</p>
                  <p v-if="rel.episode" class="text-[10px] text-white/60 mt-1">{{ rel.episode }}</p>
                </div>
              </NuxtLink>
            </div>
          </aside>
        </div>

        <div class="mb-3">
          <ClientOnly>
            <CommentSection :source="currentMovieSource" :slug="String(route.params.slug)" :movie-name="movie?.name" />
          </ClientOnly>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
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
  cursor: pointer;
}

.kr-hls-edge-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  height: 3px;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.kr-hls-edge-progress::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgb(250 204 21) v-bind('`${progressPercent}%`'), transparent 0);
}
</style>
