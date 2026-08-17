<script setup lang="ts">
import { apiFetch } from '~/utils/api'
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
  await apiFetch(`/api/admin/movies/${movie.id}`, {
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
    const result: any = await apiFetch('/api/admin/sync', {
      method: 'POST',
      body: { sources },
    })
    syncResult.value = result
    bust()
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
    await apiFetch('/api/admin/movies', { method: 'DELETE' })
    deleteConfirmOpen.value = false
    bust()
    await refresh()
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deleting.value = false
  }
}

const movies = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.totalPages || 1)

function getDropdownPosition(index: number) {
  const total = movies.value?.length || 0
  if (total <= 2 || index < total - 2) {
    return 'top-full mt-1'
  }
  return 'bottom-full mb-1'
}

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
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Quản lý phim</h1>
        <p class="mt-1 text-sm text-zinc-500">Quản lý phim hiển thị trên CineK ({{ data?.total || 0 }} phim)</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          @click="deleteConfirmOpen = true">
          <AppIcon name="trash" class="size-4" />
          Xoá tất cả
        </button>
        <button type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:bg-zinc-900 disabled:opacity-50"
          @click="syncOpen = true">
          <AppIcon name="refresh" class="size-4" />
          Đồng bộ từ API
        </button>
      </div>
    </div>

    <!-- Filters card -->
    <div class="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <!-- Filter row -->
      <div class="grid grid-cols-1 gap-3 border-b border-zinc-200 p-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_160px_150px] xl:items-center">
        <div class="relative min-w-0 w-full">
          <AppIcon name="search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input v-model="searchInput" type="text" placeholder="Tìm kiếm phim..."
            class="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition">
        </div>
        <select v-model="statusFilter" class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Chưa hiển thị</option>
        </select>
        <select v-model="sourceFilter" class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition">
          <option value="">Tất cả nguồn</option>
          <option value="ophim">OPhim</option>
          <option value="nguonc">NguonC</option>
          <option value="kkphim">KKPhim</option>
        </select>
        <select v-model="typeFilter" class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition">
          <option value="">Tất cả loại</option>
          <option value="series">Phim bộ</option>
          <option value="single">Phim lẻ</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-200 bg-zinc-50/50">
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">STT</th>
              <th class="cursor-pointer select-none px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                @click="toggleSort('name')">
                <div class="flex items-center justify-center gap-1">
                  Phim
                  <AppIcon :name="sortIcon('name')" class="size-3" :class="sortBy === 'name' ? 'text-zinc-900' : 'opacity-40'" />
                </div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Nguồn</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Tập</th>
              <th class="cursor-pointer select-none px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                @click="toggleSort('views')">
                <div class="flex items-center justify-center gap-1">
                  Lượt xem
                  <AppIcon :name="sortIcon('views')" class="size-3" :class="sortBy === 'views' ? 'text-zinc-900' : 'opacity-40'" />
                </div>
              </th>
              <th class="cursor-pointer select-none px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                @click="toggleSort('apiUpdatedAt')">
                <div class="flex items-center justify-center gap-1">
                  Cập nhật
                  <AppIcon :name="sortIcon('apiUpdatedAt')" class="size-3" :class="sortBy === 'apiUpdatedAt' ? 'text-zinc-900' : 'opacity-40'" />
                </div>
              </th>
              <th class="cursor-pointer select-none px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                @click="toggleSort('active')">
                <div class="flex items-center justify-center gap-1">
                  Trạng thái
                  <AppIcon :name="sortIcon('active')" class="size-3" :class="sortBy === 'active' ? 'text-zinc-900' : 'opacity-40'" />
                </div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Tuỳ chỉnh</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Hiển thị</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="(movie, idx) in movies" :key="movie.id" class="transition hover:bg-zinc-50">
              <td class="px-4 py-3.5 text-center text-sm font-medium text-zinc-500">{{ (currentPage - 1) * 20 + idx + 1 }}</td>
              <td class="px-4 py-3.5">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-zinc-900">{{ movie.name }}</p>
                  <p class="truncate text-xs text-zinc-500">{{ movie.originName || movie.slug }}</p>
                </div>
              </td>
              <td class="px-4 py-3.5 text-center">
                <span class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-900">
                  {{ (movie.sources || []).length }} nguồn
                </span>
              </td>
              <td class="px-4 py-3.5 text-center text-sm font-semibold text-zinc-700" :title="(movie.sources || []).map((s: any) => `${s.source.toUpperCase()}: ${s.episode || s.episodeTotal || '?'}`).join('\n')">
                {{ formatEpisode(movie) }}
              </td>
              <td class="px-4 py-3.5 text-center text-sm text-zinc-600">{{ (movie.views || 0).toLocaleString() }}</td>
              <td class="px-4 py-3.5 text-center text-sm text-zinc-500">
                <span :title="formatDate(movie.apiUpdatedAt || movie.syncedAt)">{{ formatRelativeTime(movie.apiUpdatedAt || movie.syncedAt) }}</span>
              </td>
              <td class="px-4 py-3.5 text-center">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="movie.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'">
                  {{ movie.active ? 'Hiển thị' : 'Ẩn' }}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex flex-wrap items-center justify-center gap-1.5">
                  <span v-if="movie.customContent" class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-900">Mô tả</span>
                  <span v-if="movie.customPoster" class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">Poster</span>
                  <span v-if="movie.customThumb" class="inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700">Thumb</span>
                  <span v-if="movie.customServers?.length" class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">{{ movie.customServers.length }}srv · {{ movie.customServers.reduce((t: number, s: any) => t + (s.episodes?.length || 0), 0) }}ep</span>
                  <span v-if="!movie.customContent && !movie.customPoster && !movie.customThumb && !movie.customServers?.length" class="text-xs text-zinc-400">Mặc định</span>
                </div>
              </td>
              <td class="px-4 py-3.5 text-center">
                <AdminToggle :model-value="movie.active" @update:model-value="(val: boolean) => { movie.active = val; toggleActive(movie) }" />
              </td>
              <td class="px-4 py-3.5 text-center relative">
                <div class="inline-flex">
                  <button type="button"
                    class="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                    @click="menuOpen = menuOpen === movie.id ? null : movie.id" title="Thao tác">
                    <AppIcon name="ellipsis-vertical" class="size-5" />
                  </button>
                  <Transition name="dropdown-fade">
                    <div v-if="menuOpen === movie.id" :class="['absolute right-0 z-50 min-w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg', getDropdownPosition(idx)]">
                      <NuxtLink :to="`/admin/phim/${movie.id}`" class="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900" @click="menuOpen = null">
                        <AppIcon name="pencil" class="size-4" /> Chỉnh sửa
                      </NuxtLink>
                      <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                        @click="menuOpen = null; selectedMovie = movie; deleteConfirmOpen = true">
                        <AppIcon name="trash" class="size-4" /> Xoá phim
                      </button>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
            <tr v-if="!movies.length">
              <td colspan="10" class="px-5 py-12 text-center text-sm text-zinc-400">
                {{ debouncedKeyword ? 'Không tìm thấy phim nào.' : 'Chưa có phim nào. Bấm "Đồng bộ từ API" để lấy phim.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
        <p class="text-sm text-zinc-500">Trang {{ currentPage }} / {{ totalPages }}</p>
        <div class="flex items-center gap-1">
          <button type="button"
            class="grid size-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-30"
            :disabled="currentPage <= 1" @click="currentPage--">
            <AppIcon name="chevron-left" class="size-4" />
          </button>
          <button v-for="page in visiblePages" :key="page" type="button"
            class="min-w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition"
            :class="page === currentPage ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'"
            @click="page !== 'ellipsis' && (currentPage = page as number)">
            {{ page }}
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-30"
            :disabled="currentPage >= totalPages" @click="currentPage++">
            <AppIcon name="chevron-right" class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="syncOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="syncOpen = false" />
          <div class="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <button type="button"
              class="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              @click="syncOpen = false">
              <AppIcon name="x" class="size-5" />
            </button>
            <div class="mb-5">
              <h2 class="text-lg font-bold text-zinc-900">Đồng bộ phim</h2>
              <p class="mt-1 text-sm text-zinc-500">Chọn nguồn để đồng bộ phim vào hệ thống</p>
            </div>
            <div class="space-y-2">
              <label v-for="source in syncSourceOptions" :key="source.key"
                class="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300 hover:bg-zinc-100">
                <div>
                  <p class="text-sm font-semibold text-zinc-900">{{ source.label }}</p>
                  <p class="text-xs text-zinc-500">{{ source.domain }}</p>
                </div>
                <AdminToggle v-model="syncSources[source.key]" />
              </label>
            </div>
            <div v-if="syncResult" class="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p class="text-sm font-semibold text-zinc-900">Kết quả đồng bộ</p>
              <div class="mt-2 space-y-1 text-xs text-zinc-600">
                <p>Tổng phim: <span class="font-semibold text-zinc-900">{{ syncResult.total }}</span></p>
                <p>Đã tạo: <span class="font-semibold text-emerald-600">{{ syncResult.created }}</span></p>
                <p>Đã cập nhật: <span class="font-semibold text-zinc-800">{{ syncResult.updated }}</span></p>
                <div v-if="syncResult.sourceStats" class="mt-2">
                  <p class="font-semibold text-zinc-900">Theo nguồn:</p>
                  <ul class="mt-1 space-y-0.5">
                    <li v-for="(stats, src) in syncResult.sourceStats" :key="src">
                      <span class="uppercase text-zinc-900">{{ src }}</span>: {{ stats.fetched }} phim
                      <span v-if="stats.error" class="text-red-500">({{ stats.error }})</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button" class="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" @click="syncOpen = false">Huỷ</button>
              <button type="button"
                class="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                :disabled="syncing || !Object.values(syncSources).some(Boolean)" @click="handleSync">
                <AppIcon name="refresh" class="size-4 mr-1" :class="syncing ? 'animate-spin inline' : ''" />
                {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Delete confirmation modal -->
      <Transition name="modal-fade">
        <div v-if="deleteConfirmOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="deleteConfirmOpen = false" />
          <div class="relative w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div class="mb-4 grid size-12 place-items-center rounded-full bg-red-50">
              <AppIcon name="trash" class="size-6 text-red-500" />
            </div>
            <h2 class="text-lg font-bold text-zinc-900">Xoá tất cả phim?</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-500">
              Hành động này sẽ xoá toàn bộ {{ data?.total || 0 }} phim trong hệ thống, bao gồm cả các tuỳ chỉnh. Không thể hoàn tác.
            </p>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button" class="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" @click="deleteConfirmOpen = false">Huỷ</button>
              <button type="button"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                :disabled="deleting" @click="handleDeleteAll">
                <AppIcon name="trash" class="size-4 mr-1" />
                {{ deleting ? 'Đang xoá...' : 'Xoá tất cả' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.98); }
.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
