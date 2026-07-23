<script setup lang="ts">
import { ArrowLeft, Camera, Check, Clock3, Eye, EyeOff, Heart, KeyRound, LogOut, LockKeyhole, Mail, Pencil, Settings, UserRound, X } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const { user, logout: doLogout, fetchUser } = useAuth()
await fetchUser()

const activeTab = ref('account')
const showPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const passwordLoading = ref(false)
const avatarModalOpen = ref(false)
const avatarLoading = ref(false)
const avatarSuccess = ref('')
const avatarError = ref('')
const editName = ref(false)
const displayNameInput = ref('')
const nameLoading = ref(false)
const nameError = ref('')
const nameSuccess = ref('')

const avatarCategories = [
  { id: 'meme', label: 'Meme' },
  { id: 'hoat-hinh', label: 'Hoạt hình' },
  { id: 'viet-nam', label: 'Việt Nam' },
]
const selectedAvatarCategory = ref('meme')

const memberName = computed(() => {
  if (!user.value) return 'Thành viên'
  return user.value.name || user.value.email?.split('@')[0] || 'Thành viên'
})

const avatarUrl = computed(() => {
  if (user.value?.avatar) return user.value.avatar
  return null
})

const avatarGrid = computed(() => {
  const categoryMap: Record<string, string[]> = {
    meme: ['01', '02', '03', '04', '05', '06', '07', '08'],
    'hoat-hinh': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    'viet-nam': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'],
  }
  const nums = categoryMap[selectedAvatarCategory.value] || []
  return nums.map(n => `/avatars/${selectedAvatarCategory.value}/${n}.jpg`)
})

const sidebarItems = [
  { id: 'account', label: 'Quản lý tài khoản', icon: Settings },
  { id: 'password', label: 'Đổi mật khẩu', icon: KeyRound },
  { id: 'history', label: 'Lịch sử xem', icon: Clock3 },
  { id: 'favorites', label: 'Phim yêu thích', icon: Heart },
]

async function handleLogout() {
  await doLogout()
}

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  passwordLoading.value = true

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordError.value = 'Vui lòng điền đầy đủ thông tin'
    passwordLoading.value = false
    return
  }

  if (newPassword.value.length < 6) {
    passwordError.value = 'Mật khẩu mới phải có ít nhất 6 ký tự'
    passwordLoading.value = false
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Mật khẩu xác nhận không khớp'
    passwordLoading.value = false
    return
  }

  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })
    passwordSuccess.value = 'Đổi mật khẩu thành công!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    passwordError.value = err?.data?.message || 'Đổi mật khẩu thất bại'
  } finally {
    passwordLoading.value = false
  }
}

async function selectAvatar(avatar: string) {
  avatarLoading.value = true
  avatarError.value = ''
  avatarSuccess.value = ''
  try {
    await $fetch('/api/auth/avatar', {
      method: 'PUT',
      body: { avatar: avatar.startsWith('/') ? avatar.slice(1) : avatar },
    })
    avatarSuccess.value = 'Cập nhật avatar thành công!'
    await fetchUser()
    setTimeout(() => {
      avatarModalOpen.value = false
      avatarSuccess.value = ''
      avatarError.value = ''
    }, 800)
  } catch (err: any) {
    avatarError.value = err?.data?.message || 'Cập nhật avatar thất bại'
  } finally {
    avatarLoading.value = false
  }
}

async function removeAvatar() {
  avatarLoading.value = true
  try {
    await $fetch('/api/auth/avatar', {
      method: 'PUT',
      body: { avatar: '' },
    })
    await fetchUser()
    avatarModalOpen.value = false
  } catch {
    avatarError.value = 'Xóa avatar thất bại'
  } finally {
    avatarLoading.value = false
  }
}

function startEditName() {
  displayNameInput.value = user.value?.name || ''
  editName.value = true
  nameError.value = ''
  nameSuccess.value = ''
}

function cancelEditName() {
  editName.value = false
  displayNameInput.value = ''
  nameError.value = ''
  nameSuccess.value = ''
}

async function saveName() {
  nameLoading.value = true
  nameError.value = ''
  nameSuccess.value = ''

  const trimmed = displayNameInput.value.trim()
  if (!trimmed) {
    nameError.value = 'Tên hiển thị không được để trống'
    nameLoading.value = false
    return
  }
  if (trimmed.length > 50) {
    nameError.value = 'Tên hiển thị tối đa 50 ký tự'
    nameLoading.value = false
    return
  }

  try {
    await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: { name: trimmed },
    })
    nameSuccess.value = 'Cập nhật tên thành công!'
    await fetchUser()
    setTimeout(() => {
      editName.value = false
      nameSuccess.value = ''
    }, 1000)
  } catch (err: any) {
    nameError.value = err?.data?.message || 'Cập nhật thất bại'
  } finally {
    nameLoading.value = false
  }
}

watch(user, (u) => {
  if (u) {
    displayNameInput.value = u.name || ''
  }
}, { immediate: true })

useHead({
  title: 'Thành viên - CineK',
  meta: [
    {
      name: 'description',
      content: 'Quản lý tài khoản CineK, lịch sử xem và danh sách yêu thích.',
    },
  ],
})
</script>

<template>
  <main class="min-h-screen bg-[#0a0a0f] text-white">
    <AppHeader />

    <section class="mx-auto max-w-[1200px] px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32 xl:px-10">
      <div class="mb-6">
        <p class="text-sm font-black uppercase text-[#FFD166]">Tài khoản</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Thành viên</h1>
      </div>

      <div v-if="user" class="flex flex-col gap-6 lg:flex-row">
        <aside class="w-full lg:w-64 shrink-0">
          <div class="lg:sticky lg:top-28">
            <div class="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#12121a] p-4 lg:hidden">
              <div v-if="avatarUrl" class="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#FFD166]/20">
                <img :src="avatarUrl" :alt="memberName" class="size-full object-cover">
              </div>
              <div v-else class="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFD166]/10">
                <span class="text-sm font-bold text-[#FFD166]">{{ memberName.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ memberName }}</p>
                <p class="truncate text-xs text-white/40">{{ user.email }}</p>
              </div>
            </div>

            <nav
              class="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-xl lg:border lg:border-white/[0.08] lg:bg-[#12121a] lg:p-2">
              <button v-for="item in sidebarItems" :key="item.id" type="button"
                class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:w-full"
                :class="activeTab === item.id
                  ? 'bg-[#FFD166]/10 text-[#FFD166]'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white'" @click="activeTab = item.id">
                <component :is="item.icon" class="size-4" />
                <span>{{ item.label }}</span>
              </button>

              <div class="my-1 hidden border-t border-white/[0.08] lg:block" />

              <NuxtLink to="/"
                class="hidden shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 transition hover:text-white lg:flex">
                <ArrowLeft class="size-4" />
                <span>Về trang chủ</span>
              </NuxtLink>

              <button type="button"
                class="hidden shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/60 transition hover:bg-red-400/8 hover:text-red-400 lg:flex"
                @click="handleLogout">
                <LogOut class="size-4" />
                <span>Đăng xuất</span>
              </button>
            </nav>
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'account'" :key="'account'"
              class="rounded-xl border border-white/[0.08] bg-[#12121a] p-5 sm:p-6">
              <div class="mb-5 flex items-center gap-2.5">
                <Settings class="size-5 text-[#FFD166]" />
                <h2 class="text-lg font-bold">Quản lý tài khoản</h2>
              </div>

              <div class="flex flex-col gap-6 lg:flex-row">
                <div class="min-w-0 flex-1 space-y-4">
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-white/40">Tên hiển thị</label>
                    <div class="relative">
                      <UserRound class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input v-model="displayNameInput" type="text" placeholder="Nhập tên hiển thị"
                        class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-24 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10"
                        @keyup.enter="saveName">
                      <button type="button"
                        class="absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-lg bg-[#FFD166] px-3 text-xs font-bold text-[#0f111a] transition hover:bg-[#FFC845] disabled:opacity-50"
                        :disabled="nameLoading" @click="saveName">
                        {{ nameLoading ? '...' : 'Lưu' }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-white/40">Email</label>
                    <div class="relative">
                      <Mail class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input type="text" :value="user.email" readonly
                        class="h-12 w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-white/[0.02] pl-11 pr-16 text-sm text-white/50 outline-none">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/30">readonly</span>
                    </div>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-white/40">Vai trò</label>
                    <input type="text" :value="user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'" readonly
                      class="h-12 w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 text-sm text-white/50 outline-none">
                  </div>

                  <p v-if="nameError" class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                    <X class="size-4 shrink-0" />
                    {{ nameError }}
                  </p>
                  <p v-if="nameSuccess"
                    class="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm font-medium text-green-400">
                    <Check class="size-4 shrink-0" />
                    {{ nameSuccess }}
                  </p>

                  <div class="flex flex-wrap gap-2 pt-2">
                    <button type="button"
                      class="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FFD166] px-4 text-sm font-bold text-[#0f111a] transition hover:bg-[#FFC845]"
                      @click="avatarModalOpen = true">
                      <Camera class="size-4" />
                      Đổi avatar
                    </button>
                    <button type="button"
                      class="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FFD166] px-4 text-sm font-bold text-[#0f111a] transition hover:bg-[#FFC845]"
                      @click="activeTab = 'password'">
                      <KeyRound class="size-4" />
                      Đổi mật khẩu
                    </button>
                    <button type="button"
                      class="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-400/20 lg:hidden"
                      @click="handleLogout">
                      <LogOut class="size-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>

                <div class="flex flex-col items-center gap-3 lg:w-48 lg:shrink-0">
                  <div class="group/avatar relative">
                    <div v-if="avatarUrl" class="size-32 overflow-hidden rounded-full ring-4 ring-[#FFD166]/20">
                      <img :src="avatarUrl" :alt="memberName" class="size-full object-cover">
                    </div>
                    <div v-else
                      class="grid size-32 place-items-center rounded-full bg-[#FFD166]/10 ring-4 ring-[#FFD166]/20">
                      <span class="text-4xl font-black text-[#FFD166]">{{ memberName.charAt(0).toUpperCase() }}</span>
                    </div>
                    <button type="button"
                      class="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full bg-[#FFD166] text-[#0f111a] shadow-lg transition hover:bg-[#FFC845]"
                      @click="avatarModalOpen = true">
                      <Camera class="size-4" />
                    </button>
                  </div>
                  <p class="text-center text-sm font-semibold">{{ memberName }}</p>
                  <p class="text-center text-xs text-white/40">{{ user.email }}</p>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'password'" :key="'password'"
              class="rounded-xl border border-white/[0.08] bg-[#12121a] p-5 sm:p-6">
              <div class="mb-5 flex items-center gap-2.5">
                <KeyRound class="size-5 text-[#FFD166]" />
                <h2 class="text-lg font-bold">Đổi mật khẩu</h2>
              </div>

              <form class="max-w-md space-y-4" @submit.prevent="handleChangePassword">
                <div class="relative">
                  <label class="mb-1.5 block text-xs font-medium text-white/40">Mật khẩu hiện tại</label>
                  <div class="relative">
                    <LockKeyhole class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <input v-model="currentPassword" :type="showPassword ? 'text' : 'password'" required
                      placeholder="Nhập mật khẩu hiện tại"
                      class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                    <button type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                      @click="showPassword = !showPassword">
                      <EyeOff v-if="showPassword" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                </div>

                <div class="relative">
                  <label class="mb-1.5 block text-xs font-medium text-white/40">Mật khẩu mới</label>
                  <div class="relative">
                    <LockKeyhole class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" required minlength="6"
                      placeholder="Ít nhất 6 ký tự"
                      class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                    <button type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                      @click="showNewPassword = !showNewPassword">
                      <EyeOff v-if="showNewPassword" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                </div>

                <div class="relative">
                  <label class="mb-1.5 block text-xs font-medium text-white/40">Xác nhận mật khẩu mới</label>
                  <div class="relative">
                    <LockKeyhole class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required
                      minlength="6" placeholder="Nhập lại mật khẩu mới"
                      class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                    <button type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                      @click="showConfirmPassword = !showConfirmPassword">
                      <EyeOff v-if="showConfirmPassword" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                </div>

                <button type="submit"
                  class="inline-flex h-12 items-center justify-center rounded-xl bg-[#FFD166] px-6 text-sm font-bold text-[#0f111a] transition-all hover:bg-[#FFC845] hover:shadow-[0_8px_25px_rgba(255,209,102,0.3)] active:scale-[0.98] disabled:opacity-50"
                  :disabled="passwordLoading">
                  {{ passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
                </button>

                <p v-if="passwordError"
                  class="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                  <X class="size-4 shrink-0" />
                  {{ passwordError }}
                </p>

                <p v-if="passwordSuccess"
                  class="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm font-medium text-green-400">
                  <Check class="size-4 shrink-0" />
                  {{ passwordSuccess }}
                </p>
              </form>
            </div>

            <div v-else-if="activeTab === 'history'" :key="'history'"
              class="rounded-xl border border-white/[0.08] bg-[#12121a] p-5 sm:p-6">
              <div class="mb-5 flex items-center gap-2.5">
                <Clock3 class="size-5 text-[#FFD166]" />
                <h2 class="text-lg font-bold">Lịch sử xem</h2>
              </div>
              <NuxtLink to="/lich-su"
                class="flex items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center transition hover:border-[#FFD166]/30 hover:bg-white/[0.04]">
                <div>
                  <Clock3 class="mx-auto size-8 text-white/20" />
                  <p class="mt-2 text-sm text-white/40">Xem lịch sử xem chi tiết</p>
                  <p class="mt-1 text-xs text-[#FFD166]">Nhấn để xem →</p>
                </div>
              </NuxtLink>
            </div>

            <div v-else-if="activeTab === 'favorites'" :key="'favorites'"
              class="rounded-xl border border-white/[0.08] bg-[#12121a] p-5 sm:p-6">
              <div class="mb-5 flex items-center gap-2.5">
                <Heart class="size-5 text-[#FFD166]" />
                <h2 class="text-lg font-bold">Phim yêu thích</h2>
              </div>
              <NuxtLink to="/yeu-thich"
                class="flex items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center transition hover:border-[#FFD166]/30 hover:bg-white/[0.04]">
                <div>
                  <Heart class="mx-auto size-8 text-white/20" />
                  <p class="mt-2 text-sm text-white/40">Xem danh sách phim yêu thích</p>
                  <p class="mt-1 text-xs text-[#FFD166]">Nhấn để xem →</p>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="avatar-modal">
        <div v-if="avatarModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" @click="avatarModalOpen = false" />

          <div
            class="relative w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#12121a] shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
            <div class="relative h-1 bg-gradient-to-r from-[#FFD166] via-[#FFB800] to-[#FFD166]" />

            <button type="button"
              class="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
              @click="avatarModalOpen = false">
              <X class="size-4" />
            </button>

            <div class="p-5 pb-3">
              <div class="mb-4 flex items-center gap-2.5">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD166]/10">
                  <Camera class="size-4 text-[#FFD166]" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-white">Chọn avatar</h2>
                  <p class="text-xs text-white/40">Chọn hình ảnh yêu thích của bạn</p>
                </div>
              </div>

              <div class="flex gap-1 rounded-full bg-white/[0.04] p-1">
                <button v-for="cat in avatarCategories" :key="cat.id" type="button"
                  class="flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all" :class="selectedAvatarCategory === cat.id
                    ? 'bg-[#FFD166] text-[#0f111a] shadow-[0_4px_12px_rgba(255,209,102,0.25)]'
                    : 'text-white/50 hover:text-white/80'" @click="selectedAvatarCategory = cat.id">
                  {{ cat.label }}
                </button>
              </div>
            </div>

            <div class="max-h-[400px] overflow-y-auto px-5 pb-5">
              <div class="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
                <button v-for="(img, idx) in avatarGrid" :key="idx" type="button"
                  class="group/avatar-btn relative aspect-square overflow-hidden rounded-xl border-2 border-transparent transition-all hover:border-[#FFD166]/50 hover:shadow-[0_4px_15px_rgba(255,209,102,0.2)]"
                  :class="avatarUrl === img ? 'border-[#FFD166] ring-2 ring-[#FFD166]/30' : ''"
                  @click="selectAvatar(img)">
                  <img :src="img" :alt="`Avatar ${idx + 1}`"
                    class="size-full object-cover transition-transform group-hover/avatar-btn:scale-110">
                  <div v-if="avatarUrl === img"
                    class="absolute inset-0 flex items-center justify-center bg-[#FFD166]/20">
                    <div class="grid size-6 place-items-center rounded-full bg-[#FFD166]">
                      <Check class="size-3.5 text-[#0f111a]" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="border-t border-white/[0.06] px-5 py-3">
              <div class="flex items-center justify-between">
                <button v-if="avatarUrl" type="button" class="text-xs text-red-400/70 transition hover:text-red-400"
                  :disabled="avatarLoading" @click="removeAvatar">
                  Xóa avatar
                </button>
                <span v-else class="text-xs text-white/30">Chưa chọn avatar</span>

                <p v-if="avatarSuccess" class="text-xs text-green-400">{{ avatarSuccess }}</p>
                <p v-if="avatarError" class="text-xs text-red-400">{{ avatarError }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

.avatar-modal-enter-active,
.avatar-modal-leave-active {
  transition: opacity 0.2s ease;
}

.avatar-modal-enter-from,
.avatar-modal-leave-to {
  opacity: 0;
}
</style>
