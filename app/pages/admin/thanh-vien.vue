<script setup lang="ts">
import { Edit, Search, Trash2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Quản lý thành viên - CineK Admin',
})

const searchInput = ref('')
const debouncedKeyword = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedKeyword.value = val.trim().toLowerCase()
  }, 300)
})

const allUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'admin', joined: '2024-01-01', status: 'active' },
  { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', role: 'user', joined: '2024-01-05', status: 'active' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', role: 'user', joined: '2024-01-10', status: 'active' },
  { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'user', joined: '2024-01-12', status: 'inactive' },
  { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', role: 'moderator', joined: '2024-01-15', status: 'active' },
]

const filteredUsers = computed(() => {
  if (!debouncedKeyword.value) return allUsers
  const kw = debouncedKeyword.value
  return allUsers.filter((u) =>
    u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw),
  )
})
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
          <input v-model="searchInput" type="search" placeholder="Tìm kiếm thành viên..."
            class="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-yellow-400/50">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10 text-center text-xs font-semibold uppercase text-slate-400">
              <th class="w-12 px-4 py-3 text-center">STT</th>
              <th class="px-4 py-3 text-center">Thành viên</th>
              <th class="px-4 py-3 text-center">Vai trò</th>
              <th class="px-4 py-3 text-center">Trạng thái</th>
              <th class="px-4 py-3 text-center">Tham gia</th>
              <th class="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="user in filteredUsers" :key="user.id" class="transition hover:bg-white/5">
              <td class="px-4 py-3 text-center text-sm text-slate-400">{{ filteredUsers.indexOf(user) + 1 }}</td>
              <td class="px-4 py-3 text-center">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">{{ user.name }}</p>
                  <p class="truncate text-xs text-slate-400">{{ user.email }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="{
                    'bg-red-400/10 text-red-400': user.role === 'admin',
                    'bg-blue-400/10 text-blue-400': user.role === 'moderator',
                    'bg-slate-400/10 text-slate-400': user.role === 'user',
                  }">
                  {{ user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'User' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="user.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-400/10 text-slate-400'">
                  {{ user.status === 'active' ? 'Hoạt động' : 'Khóa' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-400">{{ user.joined }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
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
            <tr v-if="!filteredUsers.length">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400">
                {{ debouncedKeyword ? 'Không tìm thấy thành viên nào.' : 'Chưa có thành viên nào.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-white/10 p-4">
        <p class="text-sm text-slate-400">Hiển thị {{ filteredUsers.length }} / {{ allUsers.length }} thành viên</p>
      </div>
    </div>
  </div>
</template>
