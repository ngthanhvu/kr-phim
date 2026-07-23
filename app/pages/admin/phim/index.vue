<script setup lang="ts">
import { Pencil, RefreshCw, Search, Trash2, X } from 'lucide-vue-next'

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
const syncing = ref(false)
const syncOpen = ref(false)
const deleting = ref(false)
const deleteConfirmOpen = ref(false)
const syncSources = ref({ ophim: true, nguonc: true, kkphim: true })

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
    limit: 20,
  })),
})

watch([statusFilter, sourceFilter, typeFilter], () => {
  currentPage.value = 1
})

async function toggleActive(movie: any) {
  await $fetch(`/api/admin/movies/${movie.id}`, {
    method: 'PATCH',
    body: { active: movie.active },
  })
  await refresh()
}

async function handleSync() {
  const sources = Object.entries(syncSources.value)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)

  if (!sources.length) return

  syncing.value = true
  try {
    await $fetch('/api/admin/sync', {
      method: 'POST',
      body: { sources },
    })
    syncOpen.value = false
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
    await refresh()
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deleting.value = false
  }
}

const movies = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.totalPages || 1)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Quản lý phim</h1>
        <p class="mt-1 text-sm text-slate-400">Quản lý phim hiển thị trên CineK ({{ data?.total || 0 }} phim)</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button"
          class="inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-black text-red-400 transition hover:bg-red-400/20"
          @click="deleteConfirmOpen = true">
          <Trash2 class="size-4" />
          Xoá tất cả
        </button>
        <button type="button"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
          @click="syncOpen = true">
          <RefreshCw class="size-4" />
          Đồng bộ từ API
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-white/10 bg-slate-900/50">
      <div class="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="searchInput" type="search" placeholder="Tìm kiếm phim..."
            class="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-yellow-400/50">
        </div>
        <select v-model="statusFilter"
          class="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-yellow-400/50">
          <option value="" class="bg-slate-900">Tất cả trạng thái</option>
          <option value="active" class="bg-slate-900">Đang hiển thị</option>
          <option value="inactive" class="bg-slate-900">Chưa hiển thị</option>
        </select>
        <select v-model="sourceFilter"
          class="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-yellow-400/50">
          <option value="" class="bg-slate-900">Tất cả nguồn</option>
          <option value="ophim" class="bg-slate-900">OPhim</option>
          <option value="nguonc" class="bg-slate-900">NguonC</option>
          <option value="kkphim" class="bg-slate-900">KKPhim</option>
        </select>
        <select v-model="typeFilter"
          class="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-yellow-400/50">
          <option value="" class="bg-slate-900">Tất cả loại</option>
          <option value="series" class="bg-slate-900">Phim bộ</option>
          <option value="single" class="bg-slate-900">Phim lẻ</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10 text-center text-xs font-semibold uppercase text-slate-400">
              <th class="w-12 px-4 py-3 text-center">STT</th>
              <th class="px-4 py-3 text-center">Phim</th>
              <th class="px-4 py-3 text-center">Nguồn</th>
              <th class="px-4 py-3 text-center">Tập</th>
              <th class="px-4 py-3 text-center">Lượt xem</th>
              <th class="px-4 py-3 text-center">Trạng thái</th>
              <th class="px-4 py-3 text-center">Chỉnh sửa</th>
              <th class="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="movie in movies" :key="movie.id" class="transition hover:bg-white/5">
              <td class="px-4 py-3 text-center text-sm text-slate-400">
                {{ (currentPage - 1) * 20 + movies.indexOf(movie) + 1 }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">{{ movie.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ movie.originName || movie.slug }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                  {{ movie.source?.toUpperCase() }}
                </span>
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-300">
                <template v-if="movie.episode && movie.episodeTotal && !movie.episode.includes('/')">
                  <span class="font-semibold text-yellow-300">Tập {{ movie.episode.replace(/[^0-9]/g, '') }}/{{ movie.episodeTotal.replace(/[^0-9]/g, '') }}</span>
                </template>
                <span v-else>{{ movie.episode || '-' }}</span>
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-300">
                {{ (movie.views || 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="movie.active ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'">
                  {{ movie.active ? 'Đang hiển thị' : 'Ẩn' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex flex-wrap items-center justify-center gap-1">
                  <span v-if="movie.customContent"
                    class="rounded bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">Mô tả</span>
                  <span v-if="movie.customPoster"
                    class="rounded bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">Poster</span>
                  <span v-if="movie.customThumb"
                    class="rounded bg-pink-400/10 px-2 py-0.5 text-[10px] font-semibold text-pink-400">Thumb</span>
                  <span v-if="movie.customEpisodes?.length"
                    class="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{{ movie.customEpisodes.length }} tập</span>
                  <span v-if="!movie.customContent && !movie.customPoster && !movie.customThumb && !movie.customEpisodes?.length"
                    class="text-xs text-slate-500">Mặc định</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <NuxtLink :to="`/admin/phim/${movie.id}`"
                    class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Chỉnh sửa">
                    <Pencil class="size-4" />
                  </NuxtLink>
                  <AdminToggle :model-value="movie.active"
                    @update:model-value="(val: boolean) => { movie.active = val; toggleActive(movie) }" />
                </div>
              </td>
            </tr>
            <tr v-if="!movies.length">
              <td colspan="8" class="px-4 py-12 text-center text-sm text-slate-400">
                {{ debouncedKeyword ? 'Không tìm thấy phim nào.' : 'Chưa có phim nào. Bấm "Đồng bộ từ API" để lấy phim.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-white/10 p-4">
        <p class="text-sm text-slate-400">Trang {{ currentPage }} / {{ totalPages }}</p>
        <div class="flex items-center gap-2">
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            :disabled="currentPage <= 1" @click="currentPage--">
            ‹
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            :disabled="currentPage >= totalPages" @click="currentPage++">
            ›
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="syncOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="syncOpen = false" />
          <div class="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button type="button"
              class="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white transition hover:bg-white/10"
              @click="syncOpen = false">
              <X class="size-5" />
            </button>

            <h2 class="text-xl font-black text-white">Đồng bộ phim</h2>
            <p class="mt-1 text-sm text-slate-400">Chọn nguồn để đồng bộ phim vào hệ thống</p>

            <div class="mt-5 space-y-3">
              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">OPhim</p>
                  <p class="text-xs text-slate-400">ophim1.com</p>
                </div>
                <AdminToggle v-model="syncSources.ophim" />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">NguonC</p>
                  <p class="text-xs text-slate-400">phim.nguonc.com</p>
                </div>
                <AdminToggle v-model="syncSources.nguonc" />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <div>
                  <p class="text-sm font-semibold text-white">KKPhim</p>
                  <p class="text-xs text-slate-400">phimapi.com</p>
                </div>
                <AdminToggle v-model="syncSources.kkphim" />
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button"
                class="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                @click="syncOpen = false">
                Huỷ
              </button>
              <button type="button"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
                :disabled="syncing || !Object.values(syncSources).some(Boolean)" @click="handleSync">
                <RefreshCw class="size-4" :class="syncing ? 'animate-spin' : ''" />
                {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div v-if="deleteConfirmOpen" class="fixed inset-0 z-70 grid place-items-center px-3">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="deleteConfirmOpen = false" />
          <div class="relative w-full max-w-sm rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h2 class="text-xl font-black text-white">Xoá tất cả phim?</h2>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              Hành động này sẽ xoá toàn bộ {{ data?.total || 0 }} phim trong hệ thống, bao gồm cả các tuỳ chỉnh. Không thể hoàn tác.
            </p>
            <div class="mt-6 flex justify-end gap-3">
              <button type="button"
                class="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                @click="deleteConfirmOpen = false">
                Huỷ
              </button>
              <button type="button"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-black text-white transition hover:bg-red-400 disabled:opacity-50"
                :disabled="deleting" @click="handleDeleteAll">
                <Trash2 class="size-4" />
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
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
