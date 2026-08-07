<script setup lang="ts">
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
      <h1 class="admin-section-title">Quản lý thành viên</h1>
      <p class="admin-section-subtitle mt-1">Quản lý tài khoản thành viên CineK ({{ data?.total || 0 }} thành viên)</p>
    </div>

    <div class="admin-card overflow-hidden">
      <div class="flex items-center gap-3 border-b border-white/6 p-4">
        <div class="relative flex-1 min-w-0">
          <AppIcon name="search"
            class="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

          <input v-model="searchInput" type="text" placeholder="Tìm kiếm thành viên..."
            class="admin-input h-10 w-full pl-10! pr-3">
        </div>
      </div>

      <div class="overflow-x-auto admin-scrollbar">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/6 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th class="w-14 px-5 py-3">STT</th>
              <th class="px-5 py-3">Thành viên</th>
              <th class="px-5 py-3">Vai trò</th>
              <th class="px-5 py-3">Trạng thái</th>
              <th class="px-5 py-3">Tham gia</th>
              <th class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/4">
            <tr v-for="member in members" :key="member.id" class="transition hover:bg-white/2">
              <td class="px-5 py-3.5 text-sm font-semibold text-slate-500">{{ members.indexOf(member) + 1 }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="grid size-9 place-items-center rounded-full bg-linear-to-br from-slate-700 to-slate-800 text-sm font-bold text-slate-300">
                    {{ (member.name || member.email || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-900">{{ member.name || 'Chưa có tên' }}</p>
                    <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <select :value="member.role"
                  class="h-8 rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-900 outline-none transition hover:bg-slate-100/60 focus:border-sky-500"
                  @change="changeRole(member, ($event.target as HTMLSelectElement).value)">
                  <option value="user" class="bg-white">User</option>
                  <option value="moderator" class="bg-white">Moderator</option>
                  <option value="admin" class="bg-white">Admin</option>
                </select>
              </td>
              <td class="px-5 py-3.5">
                <AdminToggle :model-value="member.active"
                  @update:model-value="(val: boolean) => { member.active = val; toggleActive(member) }" />
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-400">
                {{ new Date(member.createdAt).toLocaleDateString('vi-VN') }}
              </td>
              <td class="px-5 py-3.5 text-right">
                <button type="button"
                  class="grid size-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-500/10"
                  :disabled="currentUser?.id === member.id"
                  :title="currentUser?.id === member.id ? 'Không thể xoá chính mình' : 'Xoá thành viên'"
                  @click="deleteMember(member)">
                  <AppIcon name="trash" class="size-4" />
                </button>
              </td>
            </tr>
            <tr v-if="!members.length">
              <td colspan="6" class="px-5 py-12 text-center text-sm text-slate-400">
                {{ debouncedKeyword ? 'Không tìm thấy thành viên nào.' : 'Chưa có thành viên nào.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-white/6 p-4">
        <p class="text-sm text-slate-400">Hiển thị {{ members.length }} / {{ data?.total || 0 }} thành viên</p>
      </div>
    </div>
  </div>
</template>
