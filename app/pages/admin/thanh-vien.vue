<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Quản lý thành viên - CineK Admin',
})

const searchInput = ref('')
const debouncedKeyword = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedKeyword.value = val.trim()
    currentPage.value = 1
  }, 300)
})

watch([roleFilter, statusFilter], () => {
  currentPage.value = 1
})

const { data, refresh } = await useFetch('/api/admin/thanh-vien', {
  query: computed(() => ({
    keyword: debouncedKeyword.value,
    role: roleFilter.value,
    status: statusFilter.value,
    page: currentPage.value,
    limit: 20,
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

// 3-dot menu state
const menuOpen = ref<number | null>(null)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="admin-section-title">Quản lý thành viên</h1>
      <p class="admin-section-subtitle mt-1">Quản lý tài khoản thành viên CineK ({{ data?.total || 0 }} thành viên)</p>
    </div>

    <div class="admin-card overflow-hidden">
      <div class="grid grid-cols-1 gap-3 border-b border-slate-200 p-4
         md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_160px] xl:items-center">
        <div class="relative min-w-0 w-full">
          <AppIcon name="search"
            class="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />

          <input v-model="searchInput" type="text" placeholder="Tìm kiếm thành viên..."
            class="admin-input h-10 w-full pl-10! pr-3">
        </div>

        <select v-model="roleFilter" class="admin-input h-10 w-full min-w-0 px-3">
          <option value="" class="bg-white">Tất cả vai trò</option>
          <option value="user" class="bg-white">User</option>
          <option value="moderator" class="bg-white">Moderator</option>
          <option value="admin" class="bg-white">Admin</option>
        </select>

        <select v-model="statusFilter" class="admin-input h-10 w-full min-w-0 px-3">
          <option value="" class="bg-white">Tất cả trạng thái</option>
          <option value="active" class="bg-white">Đang hoạt động</option>
          <option value="inactive" class="bg-white">Chưa hoạt động</option>
        </select>
      </div>

      <div class="overflow-x-auto admin-scrollbar">
        <table class="w-full" style="border-collapse: collapse; border-spacing: 0;">
          <thead>
            <tr class="text-xs font-bold uppercase tracking-wide text-slate-400">
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">STT</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Thành viên</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Vai trò</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Trạng thái</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Tham gia</th>
              <th style="border-bottom: 3px solid #eeee;" class="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eeee]">
            <tr v-for="member in members" :key="member.id" class="transition hover:bg-white/2">
              <td class="px-4 py-3.5 text-center text-sm font-semibold text-slate-500">{{ members.indexOf(member) + 1 }}
              </td>
              <td class="px-4 py-3.5 text-center">
                <p class="truncate text-sm font-bold text-white">{{ member.name || 'Chưa có tên' }}</p>
                <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
              </td>
              <td class="px-4 py-3.5 text-center">
                <select :value="member.role"
                  class="h-8 rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-900 outline-none transition hover:bg-slate-100/60 focus:border-sky-500"
                  @change="changeRole(member, ($event.target as HTMLSelectElement).value)">
                  <option value="user" class="bg-white">User</option>
                  <option value="moderator" class="bg-white">Moderator</option>
                  <option value="admin" class="bg-white">Admin</option>
                </select>
              </td>
              <td class="px-4 py-3.5 text-center">
                <AdminToggle :model-value="member.active"
                  @update:model-value="(val: boolean) => { member.active = val; toggleActive(member) }" />
              </td>
              <td class="px-4 py-3.5 text-center text-sm text-slate-400">
                {{ new Date(member.createdAt).toLocaleDateString('vi-VN') }}
              </td>
              <td class="px-4 py-3.5 text-center">
                <div class="relative inline-flex">
                  <button type="button"
                    class="grid size-9 place-items-center rounded-lg text-zinc-500 transition
                       hover:bg-slate-100 hover:text-zinc-700" title="Thao tác"
                    @click="menuOpen = menuOpen === member.id ? null : member.id">
                    <AppIcon name="ellipsis-vertical" class="size-5 stroke-[2.5]" />
                  </button>
                  <Transition name="dropdown-fade">
                    <div v-if="menuOpen === member.id" class="absolute right-0 top-full z-50 mt-1 min-w-40
                       rounded-lg border border-slate-200
                       bg-white py-1 shadow-xl">
                      <button type="button"
                        v-if="currentUser?.id !== member.id"
                        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                        @click="menuOpen = null; deleteMember(member)">
                        <AppIcon name="trash" class="size-4" />
                        Xoá thành viên
                      </button>
                      <div v-else class="px-3 py-2 text-xs text-slate-400">
                        Không thể xoá chính mình
                      </div>
                    </div>
                  </Transition>
                </div>
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

      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-slate-200 p-4">
        <p class="text-sm text-slate-500">Trang {{ currentPage }} / {{ totalPages }}</p>
        <div class="flex items-center gap-2">
          <button type="button"
            class="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            :disabled="currentPage <= 1" @click="currentPage--">
            <AppIcon name="chevron-left" class="size-4" />
          </button>
          <template v-for="(page, index) in visiblePages" :key="index">
            <span v-if="page === 'ellipsis'" class="grid size-9 place-items-center text-sm text-slate-500">...</span>
            <button v-else type="button"
              class="grid size-9 place-items-center rounded-lg border text-sm font-semibold transition" :class="page === currentPage
                ? 'border-[#095DF2] bg-[#095DF2] text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800'" @click="currentPage = page">
              {{ page }}
            </button>
          </template>
          <button type="button"
            class="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            :disabled="currentPage >= totalPages" @click="currentPage++">
            <AppIcon name="chevron-right" class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
