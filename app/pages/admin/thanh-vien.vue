<script setup lang="ts">
import { Edit, Mail, Search, Trash2, UserRound } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Quản lý thành viên - CineK Admin',
})

const searchQuery = ref('')

const users = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'admin', joined: '2024-01-01', status: 'active' },
  { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', role: 'user', joined: '2024-01-05', status: 'active' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', role: 'user', joined: '2024-01-10', status: 'active' },
  { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'user', joined: '2024-01-12', status: 'inactive' },
  { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', role: 'moderator', joined: '2024-01-15', status: 'active' },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black text-white">Quản lý thành viên</h1>
      <p class="mt-1 text-sm text-slate-400">Quản lý tài khoản thành viên CineK</p>
    </div>

    <div class="rounded-xl border border-white/10 bg-slate-900/50">
      <div class="flex items-center gap-3 border-b border-white/10 p-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="searchQuery" type="search" placeholder="Tìm kiếm thành viên..."
            class="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-yellow-400/50">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10 text-left text-xs font-semibold uppercase text-slate-400">
              <th class="px-4 py-3">Thành viên</th>
              <th class="px-4 py-3">Vai trò</th>
              <th class="px-4 py-3">Trạng thái</th>
              <th class="px-4 py-3">Tham gia</th>
              <th class="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="user in users" :key="user.id" class="transition hover:bg-white/5">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="grid size-10 shrink-0 place-items-center rounded-full bg-yellow-400/10">
                    <UserRound class="size-4 text-yellow-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-white">{{ user.name }}</p>
                    <p class="flex items-center gap-1.5 truncate text-xs text-slate-400">
                      <Mail class="size-3" />
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="{
                    'bg-red-400/10 text-red-400': user.role === 'admin',
                    'bg-blue-400/10 text-blue-400': user.role === 'moderator',
                    'bg-slate-400/10 text-slate-400': user.role === 'user',
                  }">
                  {{ user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'User' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="user.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'">
                  {{ user.status === 'active' ? 'Hoạt động' : 'Khóa' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-400">{{ user.joined }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
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
        <p class="text-sm text-slate-400">Hiển thị 1-5 / 5,678 thành viên</p>
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
