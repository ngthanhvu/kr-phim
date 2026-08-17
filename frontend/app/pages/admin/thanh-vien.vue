<script setup lang="ts">
import { apiFetch } from '~/utils/api'
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
  await apiFetch(`/api/admin/thanh-vien/${member.id}`, {
    method: 'PATCH',
    body: { active: !member.active },
  })
  await refresh()
}

async function changeRole(member: any, role: string) {
  await apiFetch(`/api/admin/thanh-vien/${member.id}`, {
    method: 'PATCH',
    body: { role },
  })
  await refresh()
}

async function deleteMember(member: any) {
  if (!confirm(`Xoá thành viên "${member.name || member.email}"?`)) return
  try {
    await apiFetch(`/api/admin/thanh-vien/${member.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    alert(err?.data?.message || 'Xoá thất bại')
  }
}

const members = computed(() => data.value?.items || [])
const totalPages = computed(() => {
  const limit = 20
  return Math.ceil((data.value?.total || 1) / limit)
})

const menuOpen = ref<number | null>(null)

function getDropdownPosition(index: number) {
  const total = members.value?.length || 0
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
  if (current > 4) pages.push('ellipsis')
  const start = Math.max(2, Math.min(current - 1, total - 4))
  const end = Math.min(total - 1, Math.max(current + 1, 5))
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-zinc-900">Quản lý thành viên</h1>
      <p class="mt-1 text-sm text-zinc-500">Quản lý tài khoản thành viên CineK ({{ data?.total || 0 }} thành viên)</p>
    </div>

    <!-- Filters card -->
    <div class="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div class="grid grid-cols-1 gap-3 border-b border-zinc-200 p-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_160px] xl:items-center">
        <div class="relative min-w-0 w-full">
          <AppIcon name="search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input v-model="searchInput" type="text" placeholder="Tìm kiếm thành viên..."
            class="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 placeholder:text-zinc-400 transition">
        </div>
        <select v-model="roleFilter" class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition">
          <option value="">Tất cả vai trò</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="statusFilter" class="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Chưa hoạt động</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-200 bg-zinc-50/50">
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">STT</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Thành viên</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Vai trò</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Trạng thái</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Ngày tham gia</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="(member, idx) in members" :key="member.id" class="transition hover:bg-zinc-50">
              <td class="px-4 py-3.5 text-center text-sm font-medium text-zinc-500">{{ idx + 1 }}</td>
              <td class="px-4 py-3.5 text-center">
                <p class="truncate text-sm font-semibold text-zinc-900">{{ member.name || 'Chưa có tên' }}</p>
                <p class="truncate text-xs text-zinc-500">{{ member.email }}</p>
              </td>
              <td class="px-4 py-3.5 text-center">
                <select :value="member.role"
                  class="h-7 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition cursor-pointer">
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="px-4 py-3.5 text-center">
                <AdminToggle :model-value="member.active" @update:model-value="(val: boolean) => { member.active = val; toggleActive(member) }" />
              </td>
              <td class="px-4 py-3.5 text-center text-sm text-zinc-500">{{ new Date(member.createdAt).toLocaleDateString('vi-VN') }}</td>
              <td class="px-4 py-3.5 text-center">
                <div class="relative inline-flex">
                  <button type="button"
                    class="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                    @click="menuOpen = menuOpen === member.id ? null : member.id" title="Thao tác">
                    <AppIcon name="ellipsis-vertical" class="size-5" />
                  </button>
                  <Transition name="dropdown-fade">
                    <div v-if="menuOpen === member.id" :class="['absolute right-0 z-50 min-w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg', getDropdownPosition(idx)]">
                      <button v-if="currentUser?.id !== member.id" type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                        @click="menuOpen = null; deleteMember(member)">
                        <AppIcon name="trash" class="size-4" /> Xoá thành viên
                      </button>
                      <div v-else class="px-3 py-2 text-xs text-zinc-400">Không thể xoá chính mình</div>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
            <tr v-if="!members.length">
              <td colspan="6" class="px-5 py-12 text-center text-sm text-zinc-400">
                {{ debouncedKeyword ? 'Không tìm thấy thành viên nào.' : 'Chưa có thành viên nào.' }}
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
          <template v-for="(page, pi) in visiblePages" :key="pi">
            <span v-if="page === 'ellipsis'" class="grid size-8 place-items-center text-sm text-zinc-400">...</span>
            <button v-else type="button"
              class="min-w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition"
              :class="page === currentPage ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'"
              @click="currentPage = page as number">
              {{ page }}
            </button>
          </template>
          <button type="button"
            class="grid size-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-30"
            :disabled="currentPage >= totalPages" @click="currentPage++">
            <AppIcon name="chevron-right" class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
