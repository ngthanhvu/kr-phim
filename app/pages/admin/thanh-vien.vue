<script setup lang="ts">
import { Edit, Mail, Search, Trash2, ToggleLeft, ToggleRight, UserRound } from 'lucide-vue-next'

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
    debouncedKeyword.value = val.trim()
  }, 300)
})

const { data, refresh } = await useFetch('/api/admin/thanh-vien', {
  query: computed(() => ({
    keyword: debouncedKeyword.value,
  })),
})

const { data: currentUser } = await useFetch('/api/auth/me')

async function toggleActive(member: any) {
  await $fetch(`/api/admin/thanh-vien/${member.id}`, {
    method: 'PATCH',
    body: { active: !member.active },
  })
  await refresh()
}

async function changeRole(member: any, role: string) {
  await $fetch(`/api/admin/thanh-vien/${member.id}`, {
    method: 'PATCH',
    body: { role },
  })
  await refresh()
}

async function deleteMember(member: any) {
  if (!confirm(`Xoá thành viên "${member.name || member.email}"?`)) return
  try {
    await $fetch(`/api/admin/thanh-vien/${member.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    alert(err?.data?.message || 'Xoá thất bại')
  }
}

const members = computed(() => data.value?.items || [])
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black text-white">Quản lý thành viên</h1>
      <p class="mt-1 text-sm text-slate-400">Quản lý tài khoản thành viên CineK ({{ data?.total || 0 }} thành viên)</p>
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
            <tr v-for="member in members" :key="member.id" class="transition hover:bg-white/5">
              <td class="px-4 py-3 text-center text-sm text-slate-400">{{ members.indexOf(member) + 1 }}</td>
              <td class="px-4 py-3 text-center">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">{{ member.name || '—' }}</p>
                  <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <select :value="member.role"
                  class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white outline-none"
                  :class="{
                    'text-red-400': member.role === 'admin',
                    'text-blue-400': member.role === 'moderator',
                    'text-slate-400': member.role === 'user',
                  }"
                  @change="changeRole(member, ($event.target as HTMLSelectElement).value)">
                  <option value="user" class="bg-slate-900">User</option>
                  <option value="moderator" class="bg-slate-900">Moderator</option>
                  <option value="admin" class="bg-slate-900">Admin</option>
                </select>
              </td>
              <td class="px-4 py-3 text-center">
                <AdminToggle :model-value="member.active"
                  @update:model-value="(val: boolean) => { member.active = val; toggleActive(member) }" />
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-400">
                {{ new Date(member.createdAt).toLocaleDateString('vi-VN') }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button type="button"
                    class="grid size-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-400/10"
                    :disabled="currentUser?.id === member.id"
                    :title="currentUser?.id === member.id ? 'Không thể xoá chính mình' : 'Xoá thành viên'"
                    @click="deleteMember(member)">
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!members.length">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400">
                {{ debouncedKeyword ? 'Không tìm thấy thành viên nào.' : 'Chưa có thành viên nào.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-white/10 p-4">
        <p class="text-sm text-slate-400">Hiển thị {{ members.length }} / {{ data?.total || 0 }} thành viên</p>
      </div>
    </div>
  </div>
</template>
