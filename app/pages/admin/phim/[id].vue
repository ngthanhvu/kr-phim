<script setup lang="ts">
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
const activeSection = ref<"info" | "content" | "actors" | "images" | "episodes">("info")
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
  customServers.value[serverIndex].episodes.push({ name: '', linkEmbed: '', linkM3u8: '' })
}

function removeServerEpisode(serverIndex: number, episodeIndex: number) {
  customServers.value[serverIndex].episodes.splice(episodeIndex, 1)
}

function applySourceLink(serverIndex: number, episodeIndex: number, key: string) {
  const item = availableEpisodes.value.find((ep) => ep.key === key)
  if (!item) return
  const ep = customServers.value[serverIndex].episodes[episodeIndex]
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

function quickAddEpisode(sourceIndex: number, serverIndex: number, episodeIndex: number) {
  const sources = (sourceData.value?.sources || []) as SourceInfo[]
  const source = sources[sourceIndex]
  const server = source?.servers?.[serverIndex]
  const ep = server?.episodes?.[episodeIndex]
  if (!ep) return
  ensureTargetServer()
  const target = customServers.value[selectedTargetServer.value]
  target.episodes.push({
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
    target.episodes.push({
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
    await $fetch(`/api/admin/movies/${movieId}`, {
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

    <div v-if="!movie" class="admin-card p-12 text-center">
      <p class="text-sm text-zinc-500">Đang tải...</p>
    </div>

    <div v-else class="space-y-5">
      <!-- Header Card -->
      <div class="admin-card p-4 sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div class="shrink-0">
            <div
              class="aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:w-44">
              <img v-if="customPoster || movie.poster" :src="customPoster || movie.poster" :alt="movie.name"
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
              <span class="admin-badge"
                :class="movie.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-400/10 text-zinc-400'">
                {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
              </span>
              <span v-if="movie.quality" class="admin-badge bg-white/[0.06] text-zinc-400">{{ movie.quality }}</span>
              <span class="admin-badge bg-white/[0.06] text-zinc-400">{{ movie.episode || '—' }} tập</span>
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

      <!-- Sidebar nav + content -->
      <div class="grid gap-5 lg:grid-cols-12 lg:items-start">
        <!-- Content -->
        <div class="space-y-5 lg:col-span-9">
          <!-- Section: Thông tin -->
          <div v-if="activeSection === 'info'" class="admin-card p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="admin-icon-square">
                <AppIcon name="info" class="size-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-white">Thông tin chi tiết</h2>
                <p class="text-xs text-zinc-500">Dữ liệu từ hệ thống</p>
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt class="admin-label mb-1">Nguồn</dt>
                <dd class="font-semibold text-white">{{ movie.source?.toUpperCase() }}</dd>
              </div>
              <div>
                <dt class="admin-label mb-1">Slug</dt>
                <dd class="truncate text-zinc-200" :title="movie.slug">{{ movie.slug }}</dd>
              </div>
              <div>
                <dt class="admin-label mb-1">Năm phát hành</dt>
                <dd class="text-zinc-200">{{ movie.year || '—' }}</dd>
              </div>
              <div>
                <dt class="admin-label mb-1">Số tập</dt>
                <dd class="text-zinc-200">{{ movie.episode || '—' }}</dd>
              </div>
              <div>
                <dt class="admin-label mb-1">Chất lượng</dt>
                <dd class="text-zinc-200">{{ movie.quality || '—' }}</dd>
              </div>
              <div>
                <dt class="admin-label mb-1">Trạng thái</dt>
                <dd class="font-semibold" :class="movie.active ? 'text-emerald-400' : 'text-zinc-400'">
                  {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="admin-label mb-1">Đồng bộ gần nhất</dt>
                <dd class="text-zinc-200">{{ new Date(movie.syncedAt).toLocaleString('vi-VN') }}</dd>
              </div>
            </dl>
            <div v-if="movie.categories?.length" class="mt-4 border-t border-white/[0.06] pt-3">
              <h4 class="admin-label mb-2">Thể loại</h4>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="cat in movie.categories" :key="cat"
                  class="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-zinc-300">{{ cat }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Mô tả -->
          <div v-if="activeSection === 'content'" class="admin-card p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="admin-icon-square">
                  <AppIcon name="type" class="size-4" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-white">Mô tả phim</h2>
                  <p class="text-xs text-zinc-500">{{ customContent ? 'Tuỳ chỉnh · Đang áp dụng' : 'Mặc định từ API' }}
                  </p>
                </div>
              </div>
              <button v-if="apiContent && !customContent" type="button"
                class="admin-btn-sm bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20" @click="useApiContent">
                <AppIcon name="pen" class="size-3" />
                Dùng mô tả API
              </button>
              <button v-else-if="customContent" type="button" class="admin-btn-sm text-red-400 hover:bg-red-400/10"
                @click="clearField('customContent')">
                Quay lại mặc định
              </button>
            </div>
            <div v-if="!customContent" class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span class="admin-badge mb-2 bg-blue-400/10 text-blue-400">Nội dung API</span>
              <p class="whitespace-pre-line text-sm leading-7 text-zinc-300">
                {{ apiContent || 'Chưa có mô tả từ nguồn API.' }}
              </p>
            </div>
            <div v-else>
              <textarea v-model="customContent" :rows="contentRows" placeholder="Nhập mô tả phim..."
                style="field-sizing: content; min-height: 140px;"
                class="w-full rounded-xl border border-yellow-400/30 bg-white/[0.03] p-3 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/50 focus:bg-white/[0.05]" />
            </div>
          </div>

          <!-- Section: Diễn viên -->
          <div v-if="activeSection === 'actors'" class="admin-card p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="admin-icon-square">
                  <AppIcon name="users" class="size-4" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-white">Diễn viên</h2>
                  <p class="text-xs text-zinc-500">{{ customActors.length }} diễn viên</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button v-if="apiActors.length" type="button"
                  class="admin-btn-sm bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20" @click="useApiActors">
                  <AppIcon name="pen" class="size-3" />
                  Import ({{ apiActors.length }})
                </button>
                <button type="button" class="admin-btn-sm bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]"
                  @click="addActor">
                  <AppIcon name="plus" class="size-3" />
                  Thêm
                </button>
              </div>
            </div>
            <div v-if="customActors.length" class="max-h-96 space-y-2 overflow-y-auto pr-1">
              <div v-for="(actor, index) in customActors" :key="index"
                class="grid grid-cols-12 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div class="col-span-1 flex justify-center">
                  <img v-if="actor.avatar" :src="actor.avatar" :alt="actor.name"
                    class="size-7 rounded-full object-cover ring-1 ring-white/10">
                  <div v-else
                    class="grid size-7 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-zinc-400">
                    {{ (actor.name || '?')[0].toUpperCase() }}
                  </div>
                </div>
                <input v-model="actor.name" type="text" placeholder="Tên" class="admin-input-sm col-span-3">
                <input v-model="actor.originalName" type="text" placeholder="Tên gốc" class="admin-input-sm col-span-3">
                <input v-model="actor.role" type="text" placeholder="Vai" class="admin-input-sm col-span-2">
                <input v-model="actor.avatar" type="url" placeholder="Avatar URL" class="admin-input-sm col-span-2">
                <button type="button"
                  class="col-span-1 grid size-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                  @click="removeActor(index)">
                  <AppIcon name="trash" class="size-4" />
                </button>
              </div>
            </div>
            <div v-else class="rounded-xl border border-dashed border-white/[0.1] p-6 text-center">
              <p class="text-sm text-zinc-500">Chưa có diễn viên. Bấm "Thêm" hoặc "Import" để bắt đầu.</p>
            </div>
          </div>

          <!-- Section: Hình ảnh -->
          <div v-if="activeSection === 'images'" class="grid gap-5 lg:grid-cols-2">
            <div class="admin-card p-5">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-white">Poster</h3>
                  <p class="text-xs text-zinc-500">Tỷ lệ 16:9 · ảnh ngang</p>
                </div>
                <span v-if="customPoster" class="admin-badge bg-yellow-400/10 text-yellow-400">Tuỳ chỉnh</span>
                <span v-else-if="movie.poster" class="admin-badge bg-white/[0.06] text-zinc-400">Mặc định</span>
              </div>
              <input v-model="customPoster" type="url" placeholder="Dán URL poster..." class="admin-input-sm w-full">
              <div
                class="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <img v-if="customPoster || movie.poster" :src="customPoster || movie.poster" :alt="movie.name"
                  class="h-full w-full object-cover">
                <div v-else class="grid h-full place-items-center text-zinc-600">
                  <div class="flex flex-col items-center gap-1.5">
                    <AppIcon name="image" class="size-8" />
                    <span class="text-sm font-medium">Chưa có ảnh poster</span>
                  </div>
                </div>
                <button v-if="customPoster" type="button"
                  class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-red-300 backdrop-blur-sm transition hover:bg-black/80 hover:text-red-200"
                  @click="clearField('customPoster')">
                  <AppIcon name="trash" class="size-3" />
                  Xoá
                </button>
              </div>
            </div>
            <div class="admin-card p-5">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-white">Thumbnail</h3>
                  <p class="text-xs text-zinc-500">Tỷ lệ 2:3 · ảnh dọc</p>
                </div>
                <span v-if="customThumb" class="admin-badge bg-yellow-400/10 text-yellow-400">Tuỳ chỉnh</span>
                <span v-else-if="movie.thumb" class="admin-badge bg-white/[0.06] text-zinc-400">Mặc định</span>
              </div>
              <input v-model="customThumb" type="url" placeholder="Dán URL thumbnail..." class="admin-input-sm w-full">
              <div
                class="relative mx-auto mt-3 aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <img v-if="customThumb || movie.thumb" :src="customThumb || movie.thumb" :alt="movie.name"
                  class="h-full w-full object-cover">
                <div v-else class="grid h-full place-items-center text-zinc-600">
                  <div class="flex flex-col items-center gap-1.5">
                    <AppIcon name="image" class="size-8" />
                    <span class="text-sm font-medium">Chưa có ảnh</span>
                  </div>
                </div>
                <button v-if="customThumb" type="button"
                  class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-red-300 backdrop-blur-sm transition hover:bg-black/80 hover:text-red-200"
                  @click="clearField('customThumb')">
                  <AppIcon name="trash" class="size-3" />
                  Xoá
                </button>
              </div>
            </div>
          </div>

          <!-- Section: Tập phim -->
          <div v-if="activeSection === 'episodes'" class="grid gap-5 xl:grid-cols-12 xl:items-start">
            <!-- Custom Servers -->
            <div class="space-y-5 xl:col-span-7">
              <div class="admin-card p-5">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="admin-icon-square">
                      <AppIcon name="server" class="size-4" />
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white">Server & tập phim</h3>
                      <p class="text-xs text-zinc-500">Danh sách server hiển thị trên website</p>
                    </div>
                  </div>
                  <button type="button" class="admin-btn-sm bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]"
                    @click="addServer">
                    <AppIcon name="plus" class="size-3" />
                    Thêm server
                  </button>
                </div>
                <div v-if="customServers.length" class="space-y-3">
                  <div v-for="(server, serverIndex) in customServers" :key="serverIndex"
                    class="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div class="flex items-center justify-between gap-3 p-3">
                      <button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left"
                        @click="toggleServer(serverIndex)">
                        <AppIcon name="chevron-down" class="size-4 shrink-0 text-zinc-400 transition"
                          :class="collapsedServers[serverIndex] ? '-rotate-90' : ''" />
                        <span class="truncate text-sm font-bold text-white">{{ server.name || `Server ${serverIndex +
                          1}` }}</span>
                        <span
                          class="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{{
                          server.episodes.length }} tập</span>
                      </button>
                      <button type="button"
                        class="grid size-7 shrink-0 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                        @click="removeServer(serverIndex)">
                        <AppIcon name="trash" class="size-3.5" />
                      </button>
                    </div>
                    <div v-if="!collapsedServers[serverIndex]" class="border-t border-white/[0.06] p-3">
                      <input v-model="server.name" type="text" placeholder="Tên server (vd: Vietsub, Thuyết minh...)"
                        class="admin-input-sm mb-3 w-full font-semibold">
                      <div v-if="server.episodes.length" class="space-y-1.5">
                        <div v-for="(ep, episodeIndex) in server.episodes" :key="episodeIndex"
                          class="rounded-lg border border-white/[0.06] bg-white/[0.02]">
                          <div class="flex items-center gap-2 p-2">
                            <span class="w-6 shrink-0 text-center text-xs font-bold text-zinc-500">{{ episodeIndex + 1
                              }}</span>
                            <input v-model="ep.name" type="text" placeholder="Tên tập"
                              class="admin-input-sm w-24 shrink-0">
                            <select class="admin-input-sm min-w-0 flex-1"
                              @change="handleSourceLinkChange(serverIndex, episodeIndex, $event)">
                              <option value="" class="bg-[#131418] text-white">Chọn link từ API</option>
                              <option v-for="item in availableEpisodes" :key="item.key" :value="item.key"
                                class="bg-[#131418] text-white">{{ item.label }}</option>
                            </select>
                            <button type="button"
                              class="grid size-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                              :class="expandedLinks[`${serverIndex}-${episodeIndex}`] ? 'bg-yellow-400/10 text-yellow-400' : ''"
                              :title="expandedLinks[`${serverIndex}-${episodeIndex}`] ? 'Ẩn link' : 'Sửa link'"
                              @click="toggleLinks(`${serverIndex}-${episodeIndex}`)">
                              <AppIcon name="pencil" class="size-3" />
                            </button>
                            <button type="button"
                              class="grid size-7 shrink-0 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                              @click="removeServerEpisode(serverIndex, episodeIndex)">
                              <AppIcon name="trash" class="size-3" />
                            </button>
                          </div>
                          <div v-if="expandedLinks[`${serverIndex}-${episodeIndex}`]"
                            class="border-t border-white/[0.06] p-2">
                            <div class="grid gap-2 sm:grid-cols-2">
                              <input v-model="ep.linkEmbed" type="url" placeholder="Link embed (iframe)"
                                class="admin-input-sm w-full">
                              <input v-model="ep.linkM3u8" type="url" placeholder="Link HLS (.m3u8)"
                                class="admin-input-sm w-full">
                            </div>
                          </div>
                        </div>
                      </div>
                      <button type="button"
                        class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-white/[0.15] px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                        @click="addServerEpisode(serverIndex)">
                        <AppIcon name="plus" class="size-3.5" />
                        Thêm tập
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-xl border border-dashed border-white/[0.1] p-6 text-center">
                  <p class="text-sm text-zinc-500">Chưa có server. Bấm "Thêm server" để bắt đầu.</p>
                </div>
              </div>
            </div>
            <!-- API Sources Panel -->
            <div class="xl:col-span-5">
              <div class="admin-card p-5 xl:sticky xl:top-5">
                <div class="mb-4 flex items-center gap-3">
                  <div class="admin-icon-square">
                    <AppIcon name="layers" class="size-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white">Nguồn API có sẵn</h3>
                    <p class="text-xs text-zinc-500">Thêm nhanh tập từ API</p>
                  </div>
                </div>
                <div v-if="sourceData?.sources?.length" class="space-y-3">
                  <div class="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <label class="admin-label">Thêm vào server</label>
                    <select v-model="selectedTargetServer" class="admin-input-sm w-full">
                      <option v-for="(server, index) in customServers" :key="index" :value="index"
                        class="bg-[#131418] text-white">
                        {{ server.name || `Server ${index + 1}` }} ({{ server.episodes.length }} tập)
                      </option>
                    </select>
                    <button v-if="!customServers.length" type="button"
                      class="admin-btn-sm w-full justify-center bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]"
                      @click="addServer">
                      <AppIcon name="plus" class="size-3" />
                      Tạo server
                    </button>
                  </div>
                  <div v-for="(source, sourceIndex) in sourceData.sources" :key="source.source"
                    class="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <button type="button"
                      class="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03]"
                      @click="toggleSource(source.source)">
                      <span class="text-sm font-bold text-white uppercase">{{ source.source }} · {{ source.name
                        }}</span>
                      <AppIcon name="chevron-down" class="size-4 text-zinc-400 transition"
                        :class="expandedSources[source.source] ? 'rotate-180' : ''" />
                    </button>
                    <div v-if="expandedSources[source.source]" class="border-t border-white/[0.06] p-4">
                      <div v-for="(server, serverIndex) in source.servers" :key="serverIndex" class="mb-4 last:mb-0">
                        <div class="mb-2 flex items-center justify-between gap-2">
                          <h4 class="admin-label">{{ server.name }}</h4>
                          <button type="button"
                            class="admin-btn-sm bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                            @click="quickAddAllEpisodes(sourceIndex, serverIndex)">
                            <AppIcon name="plus" class="size-3" />
                            Thêm tất cả
                          </button>
                        </div>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div v-for="(ep, epIndex) in server.episodes" :key="epIndex"
                            class="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
                            <p class="truncate text-xs font-semibold text-white">{{ ep.name || `Tập ${epIndex + 1}` }}
                            </p>
                            <p v-if="ep.linkM3u8" class="truncate text-[10px] text-zinc-500">{{ ep.linkM3u8 }}</p>
                            <p v-else-if="ep.linkEmbed" class="truncate text-[10px] text-zinc-500">{{ ep.linkEmbed }}
                            </p>
                            <button type="button"
                              class="absolute right-1 top-1 grid size-6 place-items-center rounded bg-yellow-400/10 text-yellow-400 opacity-0 transition hover:bg-yellow-400/20 group-hover:opacity-100"
                              :title="`Thêm ${ep.name || `Tập ${epIndex + 1}`} vào server`"
                              @click="quickAddEpisode(sourceIndex, serverIndex, epIndex)">
                              <AppIcon name="plus" class="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-xl border border-dashed border-white/[0.1] p-6 text-center">
                  <p class="text-sm text-zinc-500">Chưa có nguồn API hoặc chưa đồng bộ tập phim.</p>
                </div>
              </div>
            </div>
          </div>


        </div>
        <!-- Right Sidebar: Navigation + Save -->
        <aside class="space-y-5 lg:sticky lg:top-5 lg:col-span-3">
          <!-- Nav -->
          <div class="admin-card p-2">
            <nav class="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible no-scrollbar">
              <button v-for="s in sections" :key="s.key"
                class="relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full"
                :class="activeSection === s.key ? 'bg-yellow-400/10 text-yellow-400' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-white'"
                @click="activeSection = s.key">
                <span v-if="activeSection === s.key"
                  class="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-yellow-400 lg:block" />
                <AppIcon :name="s.icon" class="size-4" />
                <span class="flex-1 whitespace-nowrap">{{ s.label }}</span>
                <span v-if="s.key === 'actors' && customActors.length"
                  class="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">{{
                  customActors.length }}</span>
                <span v-else-if="s.key === 'episodes' && customServers.length"
                  class="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">{{
                  customServers.length }}</span>
              </button>
            </nav>
          </div>

          <!-- Save button sticky -->
          <div class="admin-card p-4">
            <button type="button" class="w-full admin-btn-primary justify-center" :disabled="saving"
              @click="handleSave">
              <AppIcon name="save" class="size-4" />
              {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
            <Transition name="fade">
              <div v-if="saved"
                class="mt-2 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-400">
                <AppIcon name="check" class="size-3" />
                Đã lưu thành công
              </div>
            </Transition>
          </div>

          <!-- Quick info -->
          <div class="admin-card p-4">
            <h4 class="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Thông tin nhanh</h4>
            <dl class="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
              <dt class="text-zinc-500">Nguồn</dt>
              <dd class="font-semibold text-white">{{ movie.source?.toUpperCase() }}</dd>
              <dt class="text-zinc-500">Năm</dt>
              <dd class="text-zinc-200">{{ movie.year || '—' }}</dd>
              <dt class="text-zinc-500">Tập</dt>
              <dd class="text-zinc-200">{{ movie.episode || '—' }}</dd>
              <dt class="text-zinc-500">Trạng thái</dt>
              <dd class="font-semibold" :class="movie.active ? 'text-emerald-400' : 'text-zinc-400'">
                {{ movie.active ? 'Hiển thị' : 'Ẩn' }}
              </dd>
            </dl>
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
