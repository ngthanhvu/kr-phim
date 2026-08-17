<script setup lang="ts">
import { apiFetch } from '~/utils/api'
definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const movieId = Number(route.params.id)

const { data: movie, refresh } = await useFetch(`/api/admin/movies/${movieId}`)
const { data: sourceData } = await useFetch(`/api/admin/movies/${movieId}/sources`, { lazy: true, default: () => ({ movie: null, sources: [] }) })

useHead({
  title: computed(() => movie.value ? `Chỉnh sửa: ${movie.value.name} - CineK Admin` : 'Chỉnh sửa phim - CineK Admin'),
})

interface SourceEpisode {
  name: string
  slug?: string
  linkEmbed?: string
  linkM3u8?: string
}

interface SourceServer {
  name: string
  source: string
  sourceSlug: string
  episodes: SourceEpisode[]
}

interface SourceInfo {
  source: string
  slug: string
  name: string
  content: string
  actors: { name: string, originalName?: string, role?: string, avatar?: string }[]
  servers: SourceServer[]
}

interface CustomEpisode {
  name: string
  linkEmbed: string
  linkM3u8: string
}

interface CustomServer {
  name: string
  episodes: CustomEpisode[]
}

const customPoster = ref('')
const customThumb = ref('')
const customContent = ref('')
const customServers = ref<CustomServer[]>([])
const customActors = ref<{ name: string, originalName: string, role: string, avatar: string }[]>([])
const expandedSources = ref<Record<string, boolean>>({})
const selectedTargetServer = ref(0)
const collapsedServers = ref<Record<number, boolean>>({})
const expandedLinks = ref<Record<string, boolean>>({})
const activeSection = ref<"info" | "content" | "actors" | "images" | "episodes">("episodes")
const sections = [
  { key: "info" as const, label: "Thông tin", icon: "info" as const },
  { key: "content" as const, label: "Mô tả", icon: "type" as const },
  { key: "actors" as const, label: "Diễn viên", icon: "users" as const },
  { key: "images" as const, label: "Hình ảnh", icon: "image" as const },
  { key: "episodes" as const, label: "Tập phim", icon: "server" as const },
]
const saving = ref(false)
const saved = ref(false)
const { bust } = useCacheBust()

watch(movie, (m) => {
  if (m) {
    customPoster.value = m.customPoster || ''
    customThumb.value = m.customThumb || ''
    customContent.value = m.customContent || ''
    customActors.value = m.actors?.length
      ? m.actors.map((a: any) => ({ name: a.name || '', originalName: a.originalName || '', role: a.role || '', avatar: a.avatar || '' }))
      : []
    customServers.value = m.customServers?.length
      ? m.customServers.map((server: any) => ({
        name: server.name || '',
        episodes: (server.episodes || []).map((ep: any) => ({ name: ep.name || '', linkEmbed: ep.linkEmbed || '', linkM3u8: ep.linkM3u8 || '' })),
      }))
      : []
  }
}, { immediate: true })

const availableEpisodes = computed(() => {
  const list: { key: string, label: string, linkEmbed?: string, linkM3u8?: string }[] = []
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  sources.forEach((source) => {
    source.servers.forEach((server) => {
      server.episodes.forEach((ep, index) => {
        list.push({
          key: `${source.source}::${server.name}::${index}::${ep.name}`,
          label: `[${source.source.toUpperCase()}] ${server.name} - ${ep.name || `Tập ${index + 1}`}`,
          linkEmbed: ep.linkEmbed,
          linkM3u8: ep.linkM3u8,
        })
      })
    })
  })
  return list
})

const apiContent = computed(() => {
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  const order = ['nguonc', 'ophim', 'kkphim']
  for (const name of order) {
    const found = sources.find((s) => s.source === name)
    if (found?.content?.trim()) return found.content.trim()
  }
  return sources.find((s) => s.content?.trim())?.content?.trim() || ''
})

const apiActors = computed(() => {
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  const order = ['nguonc', 'ophim', 'kkphim']
  for (const name of order) {
    const found = sources.find((s) => s.source === name)
    if (found?.actors?.length) return found.actors
  }
  return sources.find((s) => s.actors?.length)?.actors || []
})

function addServer() {
  customServers.value.push({ name: `Server ${customServers.value.length + 1}`, episodes: [] })
}

function removeServer(serverIndex: number) {
  customServers.value.splice(serverIndex, 1)
}

function addServerEpisode(serverIndex: number) {
  customServers.value[serverIndex]?.episodes?.push({ name: '', linkEmbed: '', linkM3u8: '' })
}

function removeServerEpisode(serverIndex: number, episodeIndex: number) {
  customServers.value[serverIndex]?.episodes?.splice(episodeIndex, 1)
}

function applySourceLink(serverIndex: number, episodeIndex: number, key: string) {
  const item = availableEpisodes.value.find((ep) => ep.key === key)
  if (!item) return
  const ep = customServers.value[serverIndex]?.episodes?.[episodeIndex]
  if (ep) {
    ep.linkEmbed = item.linkEmbed || ''
    ep.linkM3u8 = item.linkM3u8 || ''
  }
}

function handleSourceLinkChange(serverIndex: number, episodeIndex: number, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  applySourceLink(serverIndex, episodeIndex, value)
}

function toggleSource(source: string) {
  expandedSources.value[source] = !expandedSources.value[source]
}

function toggleServer(index: number) {
  collapsedServers.value[index] = !collapsedServers.value[index]
}

function toggleLinks(key: string) {
  expandedLinks.value[key] = !expandedLinks.value[key]
}

function useApiContent() {
  if (apiContent.value) customContent.value = apiContent.value
}

const contentRows = computed(() => {
  if (!customContent.value) return 6
  const lines = customContent.value.split('\n').length
  const estimatedWrappedLines = Math.ceil(customContent.value.length / 38)
  return Math.max(6, Math.max(lines, estimatedWrappedLines))
})

watch(() => customServers.value.length, (length) => {
  if (selectedTargetServer.value >= length) {
    selectedTargetServer.value = Math.max(0, length - 1)
  }
})

function ensureTargetServer() {
  if (!customServers.value.length) {
    customServers.value.push({ name: 'Server 1', episodes: [] })
  }
  if (selectedTargetServer.value >= customServers.value.length) {
    selectedTargetServer.value = 0
  }
}

function getTotalEpisodesCount() {
  return customServers.value.reduce((acc, server) => acc + (server.episodes?.length || 0), 0)
}

function quickAddEpisode(sourceIndex: number, serverIndex: number, episodeIndex: number) {
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  const source = sources[sourceIndex]
  const server = source?.servers?.[serverIndex]
  const ep = server?.episodes?.[episodeIndex]
  if (!ep) return
  ensureTargetServer()
  const target = customServers.value[selectedTargetServer.value]
  target?.episodes?.push({
    name: ep.name || '',
    linkEmbed: ep.linkEmbed || '',
    linkM3u8: ep.linkM3u8 || '',
  })
}

function quickAddAllEpisodes(sourceIndex: number, serverIndex: number) {
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  const source = sources[sourceIndex]
  const server = source?.servers?.[serverIndex]
  if (!server?.episodes?.length) return
  ensureTargetServer()
  const target = customServers.value[selectedTargetServer.value]
  server.episodes.forEach((ep) => {
    target?.episodes?.push({
      name: ep.name || '',
      linkEmbed: ep.linkEmbed || '',
      linkM3u8: ep.linkM3u8 || '',
    })
  })
}

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await apiFetch(`/api/admin/movies/${movieId}`, {
      method: 'PUT',
      body: {
        customPoster: customPoster.value,
        customThumb: customThumb.value,
        customContent: customContent.value,
        actors: customActors.value,
        customServers: customServers.value,
      },
    })
    saved.value = true
    bust() // Invalidate cached data across all pages
    await refresh()
    setTimeout(() => { saved.value = false }, 2500)
  } catch (err) {
    console.error('Save failed:', err)
  } finally {
    saving.value = false
  }
}

function clearField(field: 'customPoster' | 'customThumb' | 'customContent') {
  if (field === 'customPoster') customPoster.value = ''
  if (field === 'customThumb') customThumb.value = ''
  if (field === 'customContent') customContent.value = ''
}

function addActor() {
  customActors.value.push({ name: '', originalName: '', role: '', avatar: '' })
}

function removeActor(index: number) {
  customActors.value.splice(index, 1)
}

function useApiActors() {
  if (!apiActors.value.length) return
  const existingNames = new Set(customActors.value.map((a) => a.name.trim().toLowerCase()))
  for (const a of apiActors.value) {
    if (!existingNames.has(a.name.trim().toLowerCase())) {
      customActors.value.push({ name: a.name, originalName: a.originalName || '', role: a.role || '', avatar: a.avatar || '' })
      existingNames.add(a.name.trim().toLowerCase())
    }
  }
}
</script>

<template>
  <div class="space-y-5">
    <NuxtLink to="/admin/phim"
      class="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white">
      <AppIcon name="arrow-left" class="size-4" />
      Quay lại danh sách phim
    </NuxtLink>

    <div v-if="!movie" class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden p-12 text-center">
      <p class="text-sm text-zinc-500">Đang tải...</p>
    </div>

    <div v-else class="space-y-5">
      <!-- Header Card -->
      <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden p-4 sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div class="shrink-0">
            <div
              class="aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 sm:w-44">
              <img v-if="customPoster || movie.poster" :src="customPoster || movie.poster || undefined" :alt="movie.name"
                class="h-full w-full object-cover">
              <div v-else class="grid h-full place-items-center text-zinc-600">
                <AppIcon name="image" class="size-6" />
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="admin-section-title truncate">{{ movie.name }}</h1>
            <p class="admin-section-subtitle mt-1">
              {{ movie.originName }} · {{ movie.source?.toUpperCase() }} · {{ movie.year || 'N/A' }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="movie.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-400/10 text-zinc-400'">
                {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
              </span>
              <span v-if="movie.quality" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-200/50 text-zinc-400">{{ movie.quality }}</span>
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-200/50 text-zinc-400">{{ movie.episodeTotal || '—' }} tập</span>
            </div>
          </div>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="saved"
          class="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          <AppIcon name="check" class="size-4" />
          Đã lưu thành công
        </div>
      </Transition>

      <!-- WordPress-like editor layout -->
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <!-- Main editor column -->
        <div class="min-w-0 space-y-5">
          <!-- Horizontal tabs -->
          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden overflow-hidden">
            <nav class="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 px-2 pt-2 no-scrollbar">
              <button v-for="s in sections" :key="s.key" type="button"
                class="relative flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-semibold transition"
                :class="activeSection === s.key
                  ? 'bg-zinc-100/60 text-zinc-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-sky-500'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-white'" @click="activeSection = s.key">
                <AppIcon :name="s.icon" class="size-4" />
                <span>{{ s.label }}</span>
                <span v-if="s.key === 'actors' && customActors.length"
                  class="rounded-full bg-zinc-200/50 px-2 py-0.5 text-[10px] text-zinc-600">{{ customActors.length
                  }}</span>
                <span v-else-if="s.key === 'episodes' && customServers.length"
                  class="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-700 font-semibold">
                  {{ getTotalEpisodesCount() }}
                </span>
              </button>
            </nav>

            <div class="p-5">
              <!-- Section: Thông tin -->
              <div v-if="activeSection === 'info'">
                <div class="mb-5 flex items-center gap-3">
                  <div class="grid size-9 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                    <AppIcon name="info" class="size-4" />
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-zinc-900">Thông tin chi tiết</h2>
                    <p class="text-xs text-zinc-500">Dữ liệu hiện tại của phim</p>
                  </div>
                </div>
                <dl class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Nguồn</dt>
                    <dd class="font-semibold text-zinc-900">{{ movie.source?.toUpperCase() }}</dd>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Slug</dt>
                    <dd class="truncate text-zinc-700" :title="movie.slug">{{ movie.slug }}</dd>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Năm phát hành</dt>
                    <dd class="text-zinc-700">{{ movie.year || '—' }}</dd>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Số tập</dt>
                    <dd class="text-zinc-700">{{ movie.episodeTotal || '—' }}</dd>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Chất lượng</dt>
                    <dd class="text-zinc-700">{{ movie.quality || '—' }}</dd>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <dt class="text-sm font-semibold text-zinc-700 mb-1">Trạng thái</dt>
                    <dd class="font-semibold" :class="movie.active ? 'text-emerald-400' : 'text-zinc-500'">{{
                      movie.active ? 'Đang hiển thị' : 'Ẩn' }}</dd>
                  </div>
                </dl>
                <div v-if="movie.categories?.length" class="mt-5 border-t border-zinc-200 pt-4">
                  <h4 class="text-sm font-semibold text-zinc-700 mb-2">Thể loại</h4>
                  <div class="flex flex-wrap gap-2"><span v-for="cat in movie.categories" :key="cat"
                      class="rounded-full bg-zinc-200/50 px-3 py-1 text-xs font-medium text-zinc-600">{{ cat }}</span>
                  </div>
                </div>
              </div>

              <!-- Section: Mô tả -->
              <div v-if="activeSection === 'content'">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="grid size-9 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                      <AppIcon name="type" class="size-4" />
                    </div>
                    <div>
                      <h2 class="text-sm font-bold text-zinc-900">Mô tả phim</h2>
                      <p class="text-xs text-zinc-500">{{ customContent ? 'Nội dung tuỳ chỉnh' : 'Nội dung từ API' }}
                      </p>
                    </div>
                  </div>
                  <button v-if="apiContent && !customContent" type="button"
                    class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition bg-sky-50 text-zinc-900 hover:bg-sky-500/20"
                    @click="useApiContent">Dùng mô tả API</button>
                  <button v-else-if="customContent" type="button" class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition text-red-400 hover:bg-red-400/10"
                    @click="clearField('customContent')">Về mặc định</button>
                </div>
                <textarea v-model="customContent" :rows="contentRows" :placeholder="apiContent || 'Nhập mô tả phim...'"
                  style="field-sizing: content; min-height: 320px;"
                  class="w-full rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm leading-7 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-zinc-100/60" />
              </div>

              <!-- Section: Diễn viên -->
              <div v-if="activeSection === 'actors'">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="grid size-9 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                      <AppIcon name="users" class="size-4" />
                    </div>
                    <div>
                      <h2 class="text-sm font-bold text-zinc-900">Diễn viên</h2>
                      <p class="text-xs text-zinc-500">{{ customActors.length }} diễn viên</p>
                    </div>
                  </div>
                  <div class="flex gap-2"><button v-if="apiActors.length" type="button"
                      class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition bg-sky-50 text-zinc-900 hover:bg-sky-500/20"
                      @click="useApiActors">Import ({{ apiActors.length }})</button><button type="button"
                      class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition bg-zinc-200/50 text-zinc-800 hover:bg-white/10" @click="addActor">
                      <AppIcon name="plus" class="size-3" />Thêm
                    </button></div>
                </div>
                <div v-if="customActors.length" class="space-y-2">
                  <div v-for="(actor, index) in customActors" :key="index"
                    class="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-[44px_1fr_1fr_140px_1fr_36px] md:items-center">
                    <div class="grid size-10 place-items-center overflow-hidden rounded-full bg-zinc-200/50"><img
                        v-if="actor.avatar" :src="actor.avatar" :alt="actor.name" class="size-full object-cover"><span
                        v-else class="text-sm font-bold text-zinc-400">{{ (actor.name?.[0] || '?').toUpperCase() }}</span>
                    </div>
                    <input v-model="actor.name" type="text" placeholder="Tên" class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition"><input
                      v-model="actor.originalName" type="text" placeholder="Tên gốc" class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition"><input
                      v-model="actor.role" type="text" placeholder="Vai" class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition"><input
                      v-model="actor.avatar" type="url" placeholder="Avatar URL" class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition"><button
                      type="button" class="grid size-8 place-items-center rounded-lg text-red-400 hover:bg-red-400/10"
                      @click="removeActor(index)">
                      <AppIcon name="trash" class="size-4" />
                    </button>
                  </div>
                </div>
                <div v-else
                  class="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">Chưa
                  có diễn viên.</div>
              </div>

              <!-- Section: Hình ảnh -->
              <div v-if="activeSection === 'images'" class="space-y-5">
                <div><label class="text-sm font-semibold text-zinc-700 mb-2 block">Ảnh poster ngang (16:9)</label>
                  <div class="flex gap-2"><input v-model="customPoster" type="url" placeholder="Dán URL poster ngang..."
                      class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition min-w-0 flex-1"><button v-if="customPoster" type="button"
                      class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition text-red-400 hover:bg-red-400/10"
                      @click="clearField('customPoster')">Xoá</button></div>
                </div>
                <div><label class="text-sm font-semibold text-zinc-700 mb-2 block">Ảnh poster dọc (2:3)</label>
                  <div class="flex gap-2"><input v-model="customThumb" type="url" placeholder="Dán URL poster dọc..."
                      class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition min-w-0 flex-1"><button v-if="customThumb" type="button"
                      class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition text-red-400 hover:bg-red-400/10"
                      @click="clearField('customThumb')">Xoá</button></div>
                </div>
                <p class="rounded-xl border border-blue-400/15 bg-blue-400/5 p-4 text-sm leading-6 text-blue-200">
                  Preview ảnh được ghim ở sidebar bên phải để bạn theo dõi trong lúc nhập URL.</p>
              </div>

              
              <!-- Section: Tập phim -->
              <div v-if="activeSection === 'episodes'" class="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
                
                <!-- Left Column: Manual Server Management -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-sm font-semibold text-zinc-900">Server & tập phim</h3>
                      <p class="text-xs text-zinc-500 mt-0.5">Quản lý server và tập phim thủ công</p>
                    </div>
                    <button type="button" class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-40" @click="addServer">
                      <AppIcon name="plus" class="size-3" /> Thêm server
                    </button>
                  </div>
                  
                  <div v-for="(server, serverIndex) in customServers" :key="serverIndex" class="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
                    <div class="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-3 py-2">
                      <button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left" @click="toggleServer(serverIndex)">
                        <AppIcon name="chevron-down" class="size-3.5 shrink-0 text-zinc-500 transition" :class="collapsedServers[serverIndex] ? '-rotate-90' : ''" />
                        <span class="truncate text-sm font-semibold text-zinc-900">{{ server.name || `Server ${serverIndex + 1}` }}</span>
                        <span class="shrink-0 text-[10px] font-bold text-zinc-700 bg-zinc-200 px-1.5 py-0.5 rounded-full">{{ server.episodes.length }} tập</span>
                      </button>
                      <button type="button" class="grid size-7 place-items-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition" @click="removeServer(serverIndex)">
                        <AppIcon name="trash" class="size-3.5" />
                      </button>
                    </div>
                    
                    <div v-if="!collapsedServers[serverIndex]" class="p-3 space-y-3">
                      <input v-model="server.name" type="text" placeholder="Tên server..." class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition" />
                      
                      <div v-for="(ep, episodeIndex) in server.episodes" :key="episodeIndex" class="rounded-md border border-zinc-200 bg-zinc-50/50 p-2">
                        <div class="flex gap-2">
                          <input v-model="ep.name" type="text" placeholder="Tên tập..." class="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition" />
                          <select class="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition" @change="handleSourceLinkChange(serverIndex, episodeIndex, $event)">
                            <option value="" class="bg-white">Chọn link từ API...</option>
                            <option v-for="item in availableEpisodes" :key="item.key" :value="item.key" class="bg-white">{{ item.label }}</option>
                          </select>
                          <button type="button" class="grid size-7 place-items-center rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition" @click="toggleLinks(`${serverIndex}-${episodeIndex}`)">
                            <AppIcon name="link" class="size-3.5" />
                          </button>
                          <button type="button" class="grid size-7 place-items-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition" @click="removeServerEpisode(serverIndex, episodeIndex)">
                            <AppIcon name="x" class="size-3.5" />
                          </button>
                        </div>
                        <div v-if="expandedLinks[`${serverIndex}-${episodeIndex}`]" class="mt-2 grid gap-2 sm:grid-cols-2">
                          <input v-model="ep.linkEmbed" type="url" placeholder="Link embed..." class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition" />
                          <input v-model="ep.linkM3u8" type="url" placeholder="Link m3u8..." class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition" />
                        </div>
                      </div>
                      
                      <button type="button" class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition" @click="addServerEpisode(serverIndex)">
                        <AppIcon name="plus" class="size-3" /> Thêm tập phim
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="customServers.length === 0" class="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
                    <AppIcon name="server" class="size-8 mx-auto text-zinc-300" />
                    <p class="mt-2 text-sm font-medium text-zinc-600">Chưa có server nào</p>
                    <button type="button" class="mt-2 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition" @click="addServer">
                      <AppIcon name="plus" class="size-3" /> Thêm server đầu tiên
                    </button>
                  </div>
                </div>
                
                <!-- Right Column: External Sources Sync Panel -->
                <div class="xl:sticky xl:top-5">
                  <details v-if="availableEpisodes.length > 0" class="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <summary class="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-zinc-900 bg-zinc-50/80 hover:bg-zinc-100 transition flex items-center gap-2">
                      <AppIcon name="download" class="size-3.5" />
                      Đồng bộ từ nguồn ngoài
                      <span class="ml-auto text-[10px] font-bold text-zinc-700 bg-zinc-200 px-1.5 py-0.5 rounded-full">{{ availableEpisodes.length }} tập</span>
                    </summary>
                    
                    <div class="border-t border-zinc-200 p-3 max-h-[500px] overflow-y-auto space-y-3">
                      <div v-for="(source, sourceIndex) in (sourceData?.sources || [])" :key="source.source" class="rounded-md border border-zinc-200 bg-white overflow-hidden">
                        <button type="button" class="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-zinc-900 bg-zinc-50/80 hover:bg-zinc-100 transition" @click="toggleSource(source.source)">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
                            {{ source.source.toUpperCase() }} — {{ source.name || '' }}
                          </div>
                          <AppIcon name="chevron-down" class="size-3.5 text-zinc-500 transition" :class="expandedSources[source.source] ? '-rotate-90' : ''" />
                        </button>
                        
                        <div v-show="expandedSources[source.source]" class="p-3 border-t border-zinc-100 space-y-3">
                          <div v-for="(server, srvIdx) in (source.servers || [])" :key="srvIdx">
                            <div class="mb-2 flex items-center justify-between">
                              <span class="text-[11px] font-semibold text-zinc-800 bg-zinc-900 text-white px-2 py-0.5 rounded-full">{{ server.name }}</span>
                              <span class="text-[10px] font-medium text-zinc-600">{{ server.episodes.length }} tập</span>
                            </div>
                            
                            <div class="flex flex-wrap gap-1.5 mb-2">
                              <button v-for="(ep, epIdx) in server.episodes" :key="epIdx" type="button" class="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition cursor-pointer" @click="quickAddEpisode(sourceIndex, srvIdx, epIdx)">
                                <span class="grid size-4 place-items-center rounded bg-zinc-100 text-[9px] font-extrabold text-zinc-600 mr-1">{{ epIdx + 1 }}</span>
                                {{ ep.name || `Tập ${epIdx + 1}` }}
                              </button>
                            </div>
                            
                            <div class="mt-1">
                              <button type="button" class="inline-flex items-center gap-1 rounded-md bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 transition" @click="quickAddAllEpisodes(sourceIndex, srvIdx)">
                                <AppIcon name="plus" class="size-2.5" /> Thêm tất cả ({{ server.episodes.length }})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                  
                  <div v-else class="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center">
                    <AppIcon name="server" class="size-8 mx-auto text-zinc-300" />
                    <p class="mt-2 text-sm text-zinc-500">Không có tập phim nào để đồng bộ từ API</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- WordPress-like right sidebar -->
        <aside class="space-y-4 xl:sticky xl:top-5">
          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden overflow-hidden">
            <div class="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <h3 class="text-sm font-bold text-zinc-900">Đăng phim</h3>
                <p class="text-xs text-zinc-500">Lưu và cập nhật nội dung</p>
              </div><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="movie.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-400/10 text-zinc-400'">{{
                  movie.active ? 'Hiển thị' : 'Đang ẩn' }}</span>
            </div>
            <div class="space-y-3 p-4 text-sm">
              <div class="flex justify-between gap-3"><span class="text-zinc-700">Nguồn</span><strong
                  class="text-white">{{ movie.source?.toUpperCase() }}</strong></div>
              <div class="flex justify-between gap-3"><span class="text-zinc-700">Năm</span><span
                  class="text-zinc-700">{{ movie.year || '—' }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-zinc-700">Tổng tập</span><span
                  class="text-zinc-700">{{ movie.episodeTotal || '—' }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-zinc-700">Đồng bộ</span><span
                  class="truncate text-right text-zinc-700">{{ new Date(movie.syncedAt).toLocaleString('vi-VN')
                  }}</span></div>
            </div>
            <div class="border-t border-zinc-200 p-4"><button type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50 w-full justify-center" :disabled="saving" @click="handleSave">
                <AppIcon name="save" class="size-4" />{{ saving ? 'Đang lưu...' : 'Cập nhật phim' }}
              </button>
              <Transition name="fade">
                <p v-if="saved" class="mt-2 text-center text-xs font-semibold text-emerald-400">Đã lưu thành công</p>
              </Transition>
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden overflow-hidden">
            <div class="border-b border-zinc-200 px-4 py-3">
              <h3 class="text-sm font-bold text-zinc-900">Ảnh đại diện ngang</h3>
              <p class="text-xs text-zinc-500">Poster 16:9</p>
            </div>
            <div class="p-4">
              <div class="aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"><img
                  v-if="customPoster || movie.poster" :src="customPoster || movie.poster || undefined" :alt="movie.name"
                  class="size-full object-cover">
                <div v-else class="grid size-full place-items-center text-zinc-600">
                  <AppIcon name="image" class="size-7" />
                </div>
              </div><input v-model="customPoster" type="url" placeholder="URL ảnh ngang..."
                class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition mt-3 w-full">
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden overflow-hidden">
            <div class="border-b border-zinc-200 px-4 py-3">
              <h3 class="text-sm font-bold text-zinc-900">Ảnh đại diện dọc</h3>
              <p class="text-xs text-zinc-500">Thumbnail 2:3</p>
            </div>
            <div class="p-4">
              <div
                class="mx-auto aspect-2/3 w-full max-w-55 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <img v-if="customThumb || movie.thumb || movie.poster" :src="customThumb || movie.thumb || movie.poster || undefined"
                  :alt="movie.name" class="size-full object-cover">
                <div v-else class="grid size-full place-items-center text-zinc-600">
                  <AppIcon name="image" class="size-7" />
                </div>
              </div><input v-model="customThumb" type="url" placeholder="URL ảnh dọc..."
                class="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition mt-3 w-full">
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>