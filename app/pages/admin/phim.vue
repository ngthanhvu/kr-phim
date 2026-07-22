<script setup lang="ts">
import { Edit, Eye, Film, MoreVertical, Plus, Search, Trash2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Quản lý phim - CineK Admin',
})

const searchQuery = ref('')

const movies = [
  { id: 1, name: 'Phim Hàn Quốc 1', originName: 'Korean Drama 1', views: 1234, status: 'active', updatedAt: '2024-01-15' },
  { id: 2, name: 'Phim Hàn Quốc 2', originName: 'Korean Drama 2', views: 890, status: 'active', updatedAt: '2024-01-14' },
  { id: 3, name: 'Phim Hàn Quốc 3', originName: 'Korean Movie 1', views: 2345, status: 'active', updatedAt: '2024-01-13' },
  { id: 4, name: 'Phim Hàn Quốc 4', originName: 'Korean Drama 3', views: 567, status: 'draft', updatedAt: '2024-01-12' },
  { id: 5, name: 'Phim Hàn Quốc 5', originName: 'Korean Movie 2', views: 1890, status: 'active', updatedAt: '2024-01-11' },
]
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Quản lý phim</h1>
        <p class="mt-1 text-sm text-slate-400">Quản lý tất cả phim trên CineK</p>
      </div>
      <button type="button"
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-yellow-400 px-4 text-sm font-black text-slate-950 transition hover:bg-yellow-300">
        <Plus class="size-4" />
        Thêm phim mới
      </button>
    </div>

    <div class="rounded-xl border border-white/10 bg-slate-900/50">
      <div class="flex items-center gap-3 border-b border-white/10 p-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" type="search" placeholder="Tìm kiếm phim..."
            class="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-yellow-400/50">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10 text-left text-xs font-semibold uppercase text-slate-400">
              <th class="px-4 py-3">Phim</th>
              <th class="px-4 py-3">Lượt xem</th>
              <th class="px-4 py-3">Trạng thái</th>
              <th class="px-4 py-3">Cập nhật</th>
              <th class="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="movie in movies" :key="movie.id" class="transition hover:bg-white/5">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="grid size-10 shrink-0 place-items-center rounded-lg bg-yellow-400/10">
                    <Film class="size-4 text-yellow-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-white">{{ movie.name }}</p>
                    <p class="truncate text-xs text-slate-400">{{ movie.originName }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-300">{{ movie.views.toLocaleString() }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="movie.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'">
                  {{ movie.status === 'active' ? 'Hoạt động' : 'Nháp' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-400">{{ movie.updatedAt }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button type="button"
                    class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
                    <Eye class="size-4" />
                  </button>
                  <button type="button"
                    class="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
                    <Edit class="size-4" />
                  </button>
                  <button type="button"
                    class="grid size-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10">
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-white/10 p-4">
        <p class="text-sm text-slate-400">Hiển thị 1-5 / 1,234 phim</p>
        <div class="flex items-center gap-2">
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white">
            ‹
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-lg bg-yellow-400/10 text-sm font-semibold text-yellow-400">
            1
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white">
            2
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white">
            3
          </button>
          <button type="button"
            class="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white">
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
