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
const saving = ref(false)
const saved = ref(false)

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
  customServers.value.push({ name: '', episodes: [] })
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
  <div>
    <NuxtLink to="/admin/phim"
      class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
      <AppIcon name="arrow-left" class="size-4" />
      Quay lại danh sách phim
    </NuxtLink>

    <div v-if="!movie" class="rounded-xl border border-white/10 bg-slate-900/50 p-12 text-center">
      <p class="text-slate-400">Đang tải...</p>
    </div>

    <div v-else>
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black text-white">{{ movie.name }}</h1>
          <p class="mt-1 text-sm text-slate-400">
            {{ movie.originName }} · {{ movie.source?.toUpperCase() }} · {{ movie.year || 'N/A' }}
          </p>
        </div>
        <button type="button"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
          :disabled="saving" @click="handleSave">
          <AppIcon name="save" class="size-4" />
          {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </div>

      <Transition name="fade">
        <div v-if="saved"
          class="mb-4 flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-400">
          <AppIcon name="check" class="size-4" />
          Đã lưu thành công
        </div>
      </Transition>

      <div class="grid gap-6 lg:grid-cols-12 items-start">
        <!-- LEFT COLUMN: Main Content & Episode Management (7 cols) -->
        <div class="space-y-6 lg:col-span-7">
          <!-- Mô tả phim -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="grid size-9 place-items-center rounded-lg bg-blue-400/10">
                  <AppIcon name="type" class="size-4 text-blue-400" />
                </div>
                <div>
                  <h2 class="text-base font-black text-white">Mô tả phim</h2>
                  <p class="text-xs text-slate-400">
                    {{ customContent ? 'Mô tả tuỳ chỉnh (Đã áp dụng)' : 'Mô tả mặc định từ API' }}
                  </p>
                </div>
              </div>
              <button v-if="apiContent && !customContent" type="button"
                class="inline-flex h-7 items-center gap-1 rounded-lg bg-yellow-400/10 px-2.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/20"
                @click="useApiContent">
                <AppIcon name="pen" class="size-3" />
                Dùng mô tả này
              </button>
              <button v-else-if="customContent" type="button"
                class="text-xs font-semibold text-red-400 transition hover:text-red-300"
                @click="clearField('customContent')">
                Quay lại mặc định
              </button>
            </div>

            <!-- State 1: Chưa bấm dùng mô tả tuỳ chỉnh -> Hiển thị mô tả mặc định API -->
            <div v-if="!customContent" class="rounded-lg border border-white/10 bg-white/5 p-3.5">
              <div class="mb-2 flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-400">
                  <span class="size-1.5 rounded-full bg-blue-400"></span>
                  Nội dung từ API nguồn
                </span>
              </div>
              <p class="text-xs leading-6 text-slate-300 whitespace-pre-line">
                {{ apiContent || 'Chưa có mô tả từ nguồn API.' }}
              </p>
            </div>

            <!-- State 2: Đã bấm dùng mô tả / chỉnh sửa -> Khung nhập full ra toàn bộ chiều cao -->
            <div v-else>
              <textarea v-model="customContent" :rows="contentRows" placeholder="Nhập mô tả phim..."
                style="field-sizing: content; min-height: 140px;"
                class="w-full rounded-lg border border-yellow-400/40 bg-white/5 p-3 text-xs leading-6 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400" />
            </div>
          </div>

          <!-- Diễn viên -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="grid size-9 place-items-center rounded-lg bg-pink-400/10">
                  <AppIcon name="users" class="size-4 text-pink-400" />
                </div>
                <div>
                  <h2 class="text-base font-black text-white">Diễn viên</h2>
                  <p class="text-xs text-slate-400">Danh sách diễn viên của phim ({{ customActors.length }})</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button v-if="apiActors.length" type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-yellow-400/10 px-3 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/20"
                  @click="useApiActors">
                  <AppIcon name="pen" class="size-3.5" />
                  Import từ API ({{ apiActors.length }})
                </button>
                <button type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-pink-500/20 px-3 text-xs font-bold text-pink-400 transition hover:bg-pink-500/30"
                  @click="addActor">
                  <AppIcon name="plus" class="size-3.5" />
                  Thêm diễn viên
                </button>
              </div>
            </div>

            <div v-if="customActors.length" class="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              <div v-for="(actor, index) in customActors" :key="index"
                class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1.5">
                <img v-if="actor.avatar" :src="actor.avatar" :alt="actor.name"
                  class="size-6 shrink-0 rounded-full object-cover ring-1 ring-white/10">
                <div v-else class="grid size-6 shrink-0 place-items-center rounded-full bg-pink-400/10 text-[10px] font-black text-pink-400">
                  {{ (actor.name || '?')[0].toUpperCase() }}
                </div>
                <input v-model="actor.name" type="text" placeholder="Tên diễn viên"
                  class="h-7 w-28 shrink-0 rounded border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50 sm:w-32">
                <input v-model="actor.originalName" type="text" placeholder="Tên gốc"
                  class="h-7 w-24 shrink-0 rounded border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50 sm:w-28">
                <input v-model="actor.role" type="text" placeholder="Vai diễn"
                  class="h-7 w-20 shrink-0 rounded border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50 sm:w-24">
                <input v-model="actor.avatar" type="url" placeholder="Avatar URL"
                  class="h-7 min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                <button type="button"
                  class="grid size-7 shrink-0 place-items-center rounded text-red-400 transition hover:bg-red-400/10"
                  @click="removeActor(index)">
                  <AppIcon name="trash" class="size-3.5" />
                </button>
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p class="text-sm text-slate-500">Chưa có diễn viên nào. Bấm "Thêm diễn viên" hoặc "Import từ API" để bắt đầu.</p>
            </div>
          </div>

          <!-- Server & tập phim -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="grid size-9 place-items-center rounded-lg bg-emerald-400/10">
                  <AppIcon name="server" class="size-4 text-emerald-400" />
                </div>
                <div>
                  <h3 class="text-base font-black text-white">Server & tập phim</h3>
                  <p class="text-xs text-slate-400">Danh sách server phát hiển thị trên website</p>
                </div>
              </div>
              <button type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/30"
                @click="addServer">
                <AppIcon name="plus" class="size-3.5" />
                Thêm server
              </button>
            </div>

            <div v-if="customServers.length" class="space-y-3">
              <div v-for="(server, serverIndex) in customServers" :key="serverIndex"
                class="rounded-lg border border-white/10 bg-white/5">
                <div class="flex items-center justify-between gap-3 p-3">
                  <button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left"
                    @click="toggleServer(serverIndex)">
                    <AppIcon name="chevron-down" class="size-4 shrink-0 text-slate-400 transition"
                      :class="collapsedServers[serverIndex] ? '-rotate-90' : ''" />
                    <span class="truncate text-sm font-bold text-white">{{ server.name || `Server ${serverIndex + 1}` }}</span>
                    <span class="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {{ server.episodes.length }} tập
                    </span>
                  </button>
                  <button type="button"
                    class="grid size-7 shrink-0 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                    @click="removeServer(serverIndex)">
                    <AppIcon name="trash" class="size-3.5" />
                  </button>
                </div>

                <div v-if="!collapsedServers[serverIndex]" class="border-t border-white/10 p-3">
                  <input v-model="server.name" type="text" placeholder="Tên server (vd: Vietsub, Thuyết minh...)"
                    class="mb-3 h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">

                  <div v-if="server.episodes.length" class="space-y-1.5">
                    <div v-for="(ep, episodeIndex) in server.episodes" :key="episodeIndex"
                      class="rounded-md border border-white/10 bg-white/5">
                      <div class="flex items-center gap-2 p-2">
                        <span class="w-7 shrink-0 text-center text-xs font-black text-slate-400">{{ episodeIndex + 1 }}</span>
                        <input v-model="ep.name" type="text" placeholder="Tên tập"
                          class="h-8 w-24 shrink-0 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                        <select
                          class="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-yellow-400/50"
                          @change="handleSourceLinkChange(serverIndex, episodeIndex, $event)">
                          <option value="" class="bg-slate-900 text-white">Chọn link từ API</option>
                          <option v-for="item in availableEpisodes" :key="item.key" :value="item.key"
                            class="bg-slate-900 text-white">
                            {{ item.label }}
                          </option>
                        </select>
                        <button type="button"
                          class="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white"
                          :class="expandedLinks[`${serverIndex}-${episodeIndex}`] ? 'bg-yellow-400/10 text-yellow-400' : ''"
                          :title="expandedLinks[`${serverIndex}-${episodeIndex}`] ? 'Ẩn link' : 'Sửa link'"
                          @click="toggleLinks(`${serverIndex}-${episodeIndex}`)">
                          <AppIcon name="circle" class="size-3" />
                        </button>
                        <button type="button"
                          class="grid h-7 w-7 shrink-0 place-items-center rounded text-red-400 transition hover:bg-red-400/10"
                          @click="removeServerEpisode(serverIndex, episodeIndex)">
                          <AppIcon name="trash" class="size-3" />
                        </button>
                      </div>
                      <div v-if="expandedLinks[`${serverIndex}-${episodeIndex}`]" class="border-t border-white/10 p-2">
                        <div class="grid gap-2 sm:grid-cols-2">
                          <input v-model="ep.linkEmbed" type="url" placeholder="Link embed (iframe)"
                            class="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                          <input v-model="ep.linkM3u8" type="url" placeholder="Link HLS (.m3u8)"
                            class="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="button"
                    class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 text-xs font-semibold text-white transition hover:bg-white/10"
                    @click="addServerEpisode(serverIndex)">
                    <AppIcon name="plus" class="size-3.5" />
                    Thêm tập
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p class="text-sm text-slate-500">Chưa có server nào. Bấm "Thêm server" để bắt đầu.</p>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Metadata & API Sources Sidebar (5 cols) -->
        <div class="space-y-6 lg:col-span-5">
          <!-- Thông tin phim -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-amber-400/10">
                <AppIcon name="info" class="size-4 text-amber-400" />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Thông tin phim</h2>
                <p class="text-xs text-slate-400">Thông tin chi tiết từ hệ thống</p>
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
              <div>
                <dt class="text-slate-500">Nguồn</dt>
                <dd class="truncate font-semibold text-white">{{ movie.source?.toUpperCase() }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Slug</dt>
                <dd class="truncate text-white" :title="movie.slug">{{ movie.slug }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Năm phát hành</dt>
                <dd class="text-white">{{ movie.year || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Số tập</dt>
                <dd class="text-white">{{ movie.episode || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Chất lượng</dt>
                <dd class="text-white">{{ movie.quality || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Trạng thái</dt>
                <dd :class="movie.active ? 'font-semibold text-green-400' : 'text-slate-400'">
                  {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-slate-500">Đồng bộ gần nhất</dt>
                <dd class="text-white">{{ new Date(movie.syncedAt).toLocaleDateString('vi-VN') }}</dd>
              </div>
            </dl>
            <div v-if="movie.categories?.length" class="mt-4 border-t border-white/10 pt-3">
              <h4 class="mb-1.5 text-[11px] font-black uppercase text-slate-400">Thể loại</h4>
              <div class="flex flex-wrap gap-1">
                <span v-for="cat in movie.categories" :key="cat"
                  class="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  {{ cat }}
                </span>
              </div>
            </div>
          </div>

          <!-- Ảnh phim -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center gap-3">
              <div class="grid size-9 place-items-center rounded-lg bg-purple-400/10">
                <AppIcon name="image" class="size-4 text-purple-400" />
              </div>
              <div>
                <h2 class="text-base font-black text-white">Hình ảnh</h2>
                <p class="text-xs text-slate-400">Poster & Thumbnail tuỳ chỉnh</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-400">Poster (ảnh ngang)</label>
                <input v-model="customPoster" type="url" placeholder="https://..."
                  class="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                <div v-if="customPoster || movie.poster" class="mt-2 flex items-center justify-between gap-2">
                  <img :src="customPoster || movie.poster" :alt="movie.name"
                    class="h-20 w-32 rounded-lg object-cover ring-1 ring-white/10">
                  <button v-if="customPoster" type="button"
                    class="text-xs font-semibold text-red-400 transition hover:text-red-300"
                    @click="clearField('customPoster')">
                    Xoá poster
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-400">Thumbnail (ảnh dọc)</label>
                <input v-model="customThumb" type="url" placeholder="https://..."
                  class="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                <div v-if="customThumb || movie.thumb" class="mt-2 flex items-center justify-between gap-2">
                  <img :src="customThumb || movie.thumb" :alt="movie.name"
                    class="h-20 w-14 rounded-lg object-cover ring-1 ring-white/10">
                  <button v-if="customThumb" type="button"
                    class="text-xs font-semibold text-red-400 transition hover:text-red-300"
                    @click="clearField('customThumb')">
                    Xoá thumbnail
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Nguồn API có sẵn -->
          <div class="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="grid size-9 place-items-center rounded-lg bg-cyan-400/10">
                  <AppIcon name="layers" class="size-4 text-cyan-400" />
                </div>
                <div>
                  <h3 class="text-base font-black text-white">Nguồn API có sẵn</h3>
                  <p class="text-xs text-slate-400">Dữ liệu tập phim từ các API</p>
                </div>
              </div>
            </div>

            <div v-if="sourceData?.sources?.length" class="space-y-3">
              <div class="mb-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <label class="text-xs font-semibold text-slate-400">Thêm vào server:</label>
                <select v-model="selectedTargetServer"
                  class="h-8 rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-white outline-none focus:border-yellow-400/50">
                  <option v-for="(server, index) in customServers" :key="index" :value="index"
                    class="bg-slate-900 text-white">
                    {{ server.name || `Server ${index + 1}` }} ({{ server.episodes.length }} tập)
                  </option>
                </select>
                <button v-if="!customServers.length" type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
                  @click="addServer">
                  <AppIcon name="plus" class="size-3.5" />
                  Tạo server
                </button>
              </div>

              <div v-for="(source, sourceIndex) in sourceData.sources" :key="source.source"
                class="rounded-lg border border-white/10 bg-white/5">
                <button type="button"
                  class="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
                  @click="toggleSource(source.source)">
                  <span class="text-sm font-black text-white">
                    {{ source.source.toUpperCase() }} · {{ source.name }}
                  </span>
                  <AppIcon name="chevron-down"
                    class="size-4 text-slate-400 transition"
                    :class="expandedSources[source.source] ? 'rotate-180' : ''" />
                </button>
                <div v-if="expandedSources[source.source]" class="border-t border-white/10 p-4">
                  <div v-for="(server, serverIndex) in source.servers" :key="serverIndex" class="mb-4 last:mb-0">
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h4 class="text-xs font-black uppercase text-slate-400">{{ server.name }}</h4>
                      <button type="button"
                        class="inline-flex h-7 items-center gap-1 rounded-lg bg-yellow-400/10 px-2 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-400/20"
                        @click="quickAddAllEpisodes(sourceIndex, serverIndex)">
                        <AppIcon name="plus" class="size-3" />
                        Thêm tất cả
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div v-for="(ep, epIndex) in server.episodes" :key="epIndex"
                        class="group relative rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5">
                        <p class="truncate text-xs font-semibold text-white">{{ ep.name || `Tập ${epIndex + 1}` }}</p>
                        <p v-if="ep.linkM3u8" class="truncate text-[10px] text-slate-500">{{ ep.linkM3u8 }}</p>
                        <p v-else-if="ep.linkEmbed" class="truncate text-[10px] text-slate-500">{{ ep.linkEmbed }}</p>
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
            <div v-else class="rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p class="text-sm text-slate-500">Chưa có nguồn API nào hoặc chưa đồng bộ tập phim.</p>
            </div>
          </div>
        </div>
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
