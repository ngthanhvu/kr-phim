<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Quản lý phim - CineK Admin',
})

const searchInput = ref('')
const debouncedKeyword = ref('')
const statusFilter = ref('')
const sourceFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const syncing = ref(false)
const syncOpen = ref(false)
const deleting = ref(false)
const deleteConfirmOpen = ref(false)
const syncSources = ref({ ophim: true, nguonc: true, kkphim: true })
const syncResult = ref<{ total: number, created: number, updated: number, sourceStats: Record<string, { fetched: number, error?: string }> } | null>(null)

// 3-dot menu state
const menuOpen = ref<number | null>(null)
const selectedMovie = ref<any>(null)

const { bust } = useCacheBust()

let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedKeyword.value = val
    currentPage.value = 1
  }, 400)
})

const { data, refresh } = await useFetch('/api/admin/movies', {
  query: computed(() => ({
    page: currentPage.value,
    keyword: debouncedKeyword.value,
    status: statusFilter.value,
    source: sourceFilter.value,
    type: typeFilter.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    limit: 20,
  })),
})

watch([statusFilter, sourceFilter, typeFilter], () => {
  currentPage.value = 1
})

watch([sortBy, sortOrder], () => {
  currentPage.value = 1
})

function getDefaultSortOrder(column: string): 'asc' | 'desc' {
  if (column === 'name') return 'asc'
  return 'desc'
}

function toggleSort(column: string) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = getDefaultSortOrder(column)
  }
}

async function toggleActive(movie: any) {
  await $fetch(`/api/admin/movies/${movie.id}`, {
    method: 'PATCH',
    body: { active: movie.active },
  })
  bust()
  await refresh()
}

async function handleSync() {
  const sources = Object.entries(syncSources.value)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)

  if (!sources.length) return

  syncing.value = true
  syncResult.value = null
  try {
    const result: any = await $fetch('/api/admin/sync', {
      method: 'POST',
      body: { sources },
    })
    syncResult.value = result
    bust() // Invalidate cached data across all pages
    await refresh()
  } catch (err) {
    console.error('Sync failed:', err)
  } finally {
    syncing.value = false
  }
}

async function handleDeleteAll() {
  deleting.value = true
  try {
    await $fetch('/api/admin/movies', { method: 'DELETE' })
    deleteConfirmOpen.value = false
    bust() // Invalidate cached data across all pages
    await refresh()
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deleting.value = false
  }
}

const movies = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.totalPages || 1)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: (number | 'ellipsis')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 4) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, Math.min(current - 1, total - 4))
  const end = Math.min(total - 1, Math.max(current + 1, 5))

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < total - 1) {
    pages.push('ellipsis')
  }

  pages.push(total)

  return pages
})

function extractEpisodeNumber(value?: string): number {
  if (!value) return 0
  const match = value.match(/(\d+)(?:\/\d+)?\s*$/)
  if (match) return Number(match[1]) || 0
  const anyNumber = value.match(/\d+/)
  return anyNumber ? Number(anyNumber[0]) : 0
}

function formatEpisode(movie: any) {
  const current = extractEpisodeNumber(movie.episode)
  const total = extractEpisodeNumber(movie.episodeTotal)
  if (current > 0 && total > 0) {
    return `${current}/${total}`
  }
  if (current > 0) return String(current)
  if (movie.episode) return movie.episode
  return '-'
}

function formatDate(value?: string | number | Date | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('vi-VN')
}

function formatRelativeTime(dateValue?: string | number | Date | null) {
  if (!dateValue) return 'Không rõ'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Không rõ'
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const units = [
    { label: 'năm', seconds: 365 * 24 * 60 * 60 },
    { label: 'tháng', seconds: 30 * 24 * 60 * 60 },
    { label: 'tuần', seconds: 7 * 24 * 60 * 60 },
    { label: 'ngày', seconds: 24 * 60 * 60 },
    { label: 'giờ', seconds: 60 * 60 },
    { label: 'phút', seconds: 60 },
  ]
  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds)
    if (value > 0) return `${value} ${unit.label} trước`
  }
  return 'Vừa xong'
}

function sortIcon(column: string): import('~/lib/icons').IconName {
  if (sortBy.value !== column) return 'chevron-down' as const
  return sortOrder.value === 'asc' ? 'chevron-up' : 'chevron-down'
}

const syncSourceOptions = [
  { key: 'ophim', label: 'OPhim', domain: 'ophim1.com' },
  { key: 'nguonc', label: 'NguonC', domain: 'phim.nguonc.com' },
  { key: 'kkphim', label: 'KKPhim', domain: 'phimapi.com' },
] as const
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="admin-section-title">Quản lý phim</h1>
        <p class="admin-section-subtitle mt-1">Quản lý phim hiển thị trên CineK ({{ data?.total || 0 }} phim)</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="admin-btn-danger border" @click="deleteConfirmOpen = true">
          <AppIcon name="trash" class="size-4" />
          Xoá tất cả
        </button>
        <button type="button" class="admin-btn-primary" @click="syncOpen = true">
          <AppIcon name="refresh" class="size-4" />
          Đồng bộ từ API
        </button>
      </div>
    </div>

    <div class="admin-card overflow-hidden">
      <div class="grid grid-cols-1 gap-3 border-b border-white/6 p-4
         md:grid-cols-2
         xl:grid-cols-[minmax(280px,1fr)_180px_160px_150px]
         xl:items-center">
        <div class="relative min-w-0 w-full">
          <AppIcon name="search"
            class="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

          <input v-model="searchInput" type="text" placeholder="Tìm kiếm phim..."
            class="admin-input h-10 w-full pl-10! pr-3">
        </div>

        <select v-model="statusFilter" class="admin-input h-10 w-full min-w-0 px-3">
          <option value="" class="bg-[#131418]">Tất cả trạng thái</option>
          <option value="active" class="bg-[#131418]">Đang hiển thị</option>
          <option value="inactive" class="bg-[#131418]">Chưa hiển thị</option>
        </select>

        <select v-model="sourceFilter" class="admin-input h-10 w-full min-w-0 px-3">
          <option value="" class="bg-[#131418]">Tất cả nguồn</option>
          <option value="ophim" class="bg-[#131418]">OPhim</option>
          <option value="nguonc" class="bg-[#131418]">NguonC</option>
          <option value="kkphim" class="bg-[#131418]">KKPhim</option>
        </select>

        <select v-model="typeFilter" class="admin-input h-10 w-full min-w-0 px-3">
          <option value="" class="bg-[#131418]">Tất cả loại</option>
          <option value="series" class="bg-[#131418]">Phim bộ</option>
          <option value="single" class="bg-[#131418]">Phim lẻ</option>
        </select>
      </div>

      <div class="overflow-x-auto admin-scrollbar">
        <table class="w-full" style="border-collapse: collapse; border-spacing: 0;">
          <thead>
            <tr class="text-xs font-bold uppercase tracking-wide text-slate-400">
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">STT</th>
              <th style="border-bottom: 3px solid #eeee;"
                class="cursor-pointer select-none px-4 py-3 text-center transition hover:text-[#333]"
                @click="toggleSort('name')">
                <div class="flex items-center justify-center gap-1">
                  Phim
                  <AppIcon :name="sortIcon('name')" class="size-3"
                    :class="sortBy === 'name' ? 'text-yellow-400' : 'opacity-50'" />
                </div>
              </th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Nguồn</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Tập</th>
              <th style="border-bottom: 3px solid #eeee;"
                class="cursor-pointer select-none px-4 py-3 text-center transition hover:text-white"
                @click="toggleSort('views')">
                <div class="flex items-center justify-center gap-1">
                  Lượt xem
                  <AppIcon :name="sortIcon('views')" class="size-3"
                    :class="sortBy === 'views' ? 'text-yellow-400' : 'opacity-50'" />
                </div>
              </th>
              <th style="border-bottom: 3px solid #eeee;"
                class="cursor-pointer select-none px-4 py-3 text-center transition hover:text-white"
                @click="toggleSort('apiUpdatedAt')">
                <div class="flex items-center justify-center gap-1">
                  Cập nhật API
                  <AppIcon :name="sortIcon('apiUpdatedAt')" class="size-3"
                    :class="sortBy === 'apiUpdatedAt' ? 'text-yellow-400' : 'opacity-50'" />
                </div>
              </th>
              <th style="border-bottom: 3px solid #eeee;"
                class="cursor-pointer select-none px-4 py-3 text-center transition hover:text-white"
                @click="toggleSort('active')">
                <div class="flex items-center justify-center gap-1">
                  Trạng thái
                  <AppIcon :name="sortIcon('active')" class="size-3"
                    :class="sortBy === 'active' ? 'text-yellow-400' : 'opacity-50'" />
                </div>
              </th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Tuỳ chỉnh</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Hiển thị</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eeee]">
            <tr v-for="movie in movies" :key="movie.id" class="transition hover:bg-white/2">
              <td class="px-4 py-3.5 text-center text-sm font-semibold text-slate-500">
                {{ (currentPage - 1) * 20 + movies.indexOf(movie) + 1 }}
              </td>
              <td class="px-4 py-3.5">
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-white">{{ movie.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ movie.originName || movie.slug }}</p>
                </div>
              </td>
              <td class="px-4 py-3.5 text-center">
                <span class="admin-badge bg-blue-400/10 text-blue-400">
                  {{ (movie.sources || []).length }} nguồn
                </span>
              </td>
              <td class="px-4 py-3.5 text-center text-sm">
                <span class="font-bold text-yellow-500" :title="(movie.sources || []).map(
                  (s: any) =>
                    `${s.source.toUpperCase()}: ${s.episode || s.episodeTotal || '?'}`
                ).join('\n')">
                  {{ formatEpisode(movie) }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-center text-sm text-slate-500">
                {{ (movie.views || 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3.5 text-center text-sm text-slate-500">
                <span :title="formatDate(movie.apiUpdatedAt || movie.syncedAt)">
                  {{ formatRelativeTime(movie.apiUpdatedAt || movie.syncedAt) }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-center">
                <span class="admin-badge" :class="movie.active
                  ? 'bg-emerald-400/10 text-emerald-400'
                  : 'bg-slate-400/10 text-slate-400'
                  ">
                  {{ movie.active ? 'Hiển thị' : 'Ẩn' }}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex flex-wrap items-center justify-center gap-1">
                  <span v-if="movie.customContent" class="admin-badge bg-blue-400/10 text-blue-400">
                    Mô tả
                  </span>
                  <span v-if="movie.customPoster" class="admin-badge bg-purple-400/10 text-purple-400">
                    Poster
                  </span>
                  <span v-if="movie.customThumb" class="admin-badge bg-pink-400/10 text-pink-400">
                    Thumb
                  </span>
                  <span v-if="movie.customServers?.length" class="admin-badge bg-emerald-400/10 text-emerald-400">
                    {{ movie.customServers.length }} server ·
                    {{
                      movie.customServers.reduce(
                        (t: number, s: any) => t + (s.episodes?.length || 0),
                        0
                      )
                    }} tập
                  </span>
                  <span v-if="
                    !movie.customContent &&
                    !movie.customPoster &&
                    !movie.customThumb &&
                    !movie.customServers?.length
                  " class="text-xs text-slate-500">
                    Mặc định
                  </span>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center justify-center">
                  <AdminToggle :model-value="movie.active"
                    @update:model-value="(val: boolean) => { movie.active = val; toggleActive(movie) }" />
                </div>
              </td>
              <td class="px-4 py-3.5 text-center">
                <div class="relative inline-flex">
                  <button type="button" class="grid size-9 place-items-center rounded-lg
                     text-zinc-500 transition
                     hover:bg-white/5 hover:text-zinc-300" title="Thao tác"
                    @click="menuOpen = menuOpen === movie.id ? null : movie.id">
                    <AppIcon name="ellipsis-vertical" class="size-5 stroke-[2.5]" />
                  </button>
                  <Transition name="dropdown-fade">
                    <div v-if="menuOpen === movie.id" class="absolute right-0 top-full z-50 mt-1 min-w-40
               rounded-lg border border-white/8
               bg-[#131418] py-1 shadow-xl">
                      <NuxtLink :to="`/admin/phim/${movie.id}`" class="flex w-full items-center gap-2 px-3 py-2
                  text-sm text-slate-300 transition
                  hover:bg-white/5 hover:text-white" @click="menuOpen = null">
                        <AppIcon name="pencil" class="size-4" />
                        Chỉnh sửa
                      </NuxtLink>
                      <button type="button" class="flex w-full items-center gap-2 px-3 py-2
                  text-sm text-red-400 transition hover:bg-white/5" @click="
                    menuOpen = null;
                  selectedMovie = movie;
                  deleteConfirmOpen = true
                    ">
                        <AppIcon name="trash" class="size-4" />
                        Xoá phim
                      </button>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
            <tr v-if="!movies.length">
              <td colspan="10" class="px-5 py-12 text-center text-sm text-slate-400">
                {{ debouncedKeyword ? 'Không tìm thấy phim nào.' : 'Chưa có phim nào. Bấm "Đồng bộ từ API" để lấy phim.'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-white/6 p-4">
        <p class="text-sm text-slate-400">Trang {{ currentPage }} / {{ totalPages }}</p>
        <div class="flex items-center gap-2">
          <button type="button"
            class="grid size-9 place-items-center rounded-lg border border-white/8 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
            :disabled="currentPage <= 1" @click="currentPage--">
            <AppIcon name="chevron-left" class="size-4" />
          </button>
          <template v-for="(page, index) in visiblePages" :key="index">
            <span v-if="page === 'ellipsis'" class="grid size-9 place-items-center text-sm text-slate-500">...</span>
            <button v-else type="button"
              class="grid size-9 place-items-center rounded-lg border text-sm font-semibold transition" :class="page === currentPage
                ? 'border-yellow-400 bg-yellow-400 text-slate-950'
                : 'border-white/8 text-slate-400 hover:bg-white/5 hover:text-white'" @click="currentPage = page">
              {{ page }}
            </button>
          </template>
          <button type="button"
            class="grid size-9 place-items-center rounded-lg border border-white/8 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
            :disabled="currentPage >= totalPages" @click="currentPage++">
            <AppIcon name="chevron-right" class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="syncOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="syncOpen = false" />
          <div class="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#131418] p-6 shadow-2xl">
            <button type="button"
              class="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-white"
              @click="syncOpen = false">
              <AppIcon name="x" class="size-5" />
            </button>

            <div class="mb-5">
              <h2 class="text-xl font-black text-white">Đồng bộ phim</h2>
              <p class="mt-1 text-sm text-slate-400">Chọn nguồn để đồng bộ phim vào hệ thống</p>
            </div>

            <div class="space-y-3">
              <label v-for="source in syncSourceOptions" :key="source.key"
                class="flex cursor-pointer items-center justify-between rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-white/10 hover:bg-white/5">
                <div>
                  <p class="text-sm font-bold text-white">{{ source.label }}</p>
                  <p class="text-xs text-slate-400">{{ source.domain }}</p>
                </div>
                <AdminToggle v-model="syncSources[source.key]" />
              </label>
            </div>

            <div v-if="syncResult" class="mt-4 rounded-xl border border-white/6 bg-white/3 p-4">
              <p class="text-sm font-bold text-white">Kết quả đồng bộ</p>
              <div class="mt-2 space-y-1 text-xs text-slate-400">
                <p>Tổng phim lấy được: <span class="font-bold text-white">{{ syncResult.total }}</span></p>
                <p>Đã tạo: <span class="font-bold text-emerald-400">{{ syncResult.created }}</span></p>
                <p>Đã cập nhật: <span class="font-bold text-yellow-400">{{ syncResult.updated }}</span></p>
                <div v-if="syncResult.sourceStats" class="mt-2">
                  <p class="font-semibold text-white">Theo nguồn:</p>
                  <ul class="mt-1 space-y-0.5">
                    <li v-for="(stats, source) in syncResult.sourceStats" :key="source">
                      <span class="uppercase text-white">{{ source }}</span>: {{ stats.fetched }} phim
                      <span v-if="stats.error" class="text-red-400">({{ stats.error }})</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" class="admin-btn-secondary" @click="syncOpen = false">Huỷ</button>
              <button type="button" class="admin-btn-primary"
                :disabled="syncing || !Object.values(syncSources).some(Boolean)" @click="handleSync">
                <AppIcon name="refresh" class="size-4" :class="syncing ? 'animate-spin' : ''" />
                {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div v-if="deleteConfirmOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="deleteConfirmOpen = false" />
          <div class="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#131418] p-6 shadow-2xl">
            <div class="mb-4 grid size-12 place-items-center rounded-full bg-red-500/10">
              <AppIcon name="trash" class="size-6 text-red-400" />
            </div>
            <h2 class="text-xl font-black text-white">Xoá tất cả phim?</h2>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              Hành động này sẽ xoá toàn bộ {{ data?.total || 0 }} phim trong hệ thống, bao gồm cả các tuỳ chỉnh. Không
              thể
              hoàn tác.
            </p>
            <div class="mt-6 flex justify-end gap-3">
              <button type="button" class="admin-btn-secondary" @click="deleteConfirmOpen = false">Huỷ</button>
              <button type="button" class="admin-btn bg-red-500 text-white hover:bg-red-400 disabled:opacity-50"
                :disabled="deleting" @click="handleDeleteAll">
                <AppIcon name="trash" class="size-4" />
                {{ deleting ? 'Đang xoá...' : 'Xoá tất cả' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
