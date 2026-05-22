<script setup lang="ts">
import {
  Bell,
  Chrome,
  Heart,
  History,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Search,
  User,
  UserRound,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const {
  user,
  loading: authLoading,
  initAuth,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  resetPassword,
  signOut,
} = useSupabaseAuth()
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const mobileMenuOpen = ref(false)
const loginOpen = ref(false)
const memberMenuOpen = ref(false)
const authMode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const authMessage = ref('')
const authError = ref('')
const submittingAuth = ref(false)
const submittingProvider = ref(false)
const defaultAvatar = 'https://thumbs.dreamstime.com/b/avatar-vietnam-character-your-project-others-avatar-vietnam-character-274539000.jpg'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Duyệt phim', to: '/phim' },
  { label: 'Lịch chiếu', to: '/lich-chieu' },
  { label: 'Phim bộ', to: '/phim?type=series' },
  { label: 'Phim lẻ', to: '/phim?type=single' },
]

const memberName = computed(() => {
  const metadata = user.value?.user_metadata || {}
  const name = metadata.name || metadata.full_name || metadata.user_name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.value?.email?.split('@')[0] || 'Thành viên'
})

const memberAvatar = computed(() => {
  const metadata = user.value?.user_metadata || {}
  return typeof metadata.avatar_url === 'string' && metadata.avatar_url
    ? metadata.avatar_url
    : defaultAvatar
})

const memberMenuItems = [
  { label: 'Trang cá nhân', icon: UserRound, to: '/thanh-vien' },
  { label: 'Yêu thích', icon: Heart, to: '/yeu-thich' },
  { label: 'Lịch sử', icon: History, to: '/lich-su' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.fullPath === to || route.path === to.split('?')[0] && route.fullPath.includes(to.split('?')[1] || '')
}

function submitSearch() {
  const q = keyword.value.trim()
  router.push({
    path: '/phim',
    query: q ? { q } : undefined,
  })
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function openLogin() {
  authMessage.value = ''
  authError.value = ''
  email.value = user.value?.email || ''
  password.value = ''
  authMode.value = 'login'
  loginOpen.value = true
}

function handleMemberClick() {
  if (!user.value) {
    openLogin()
    return
  }

  memberMenuOpen.value = !memberMenuOpen.value
}

async function submitLogin() {
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail || !password.value) return

  submittingAuth.value = true
  authMessage.value = ''
  authError.value = ''

  const { error } = authMode.value === 'login'
    ? await signInWithPassword(trimmedEmail, password.value)
    : await signUpWithPassword(trimmedEmail, password.value)

  submittingAuth.value = false
  if (error) {
    authError.value = error.message
    return
  }

  authMessage.value = authMode.value === 'login'
    ? 'Đăng nhập thành công.'
    : 'Đăng ký thành công. Nếu Supabase yêu cầu xác nhận, bạn mở email để xác nhận nhé.'

  if (authMode.value === 'login') loginOpen.value = false
}

async function handleGoogleLogin() {
  submittingProvider.value = true
  authError.value = ''
  const { error } = await signInWithGoogle()
  submittingProvider.value = false
  if (error) authError.value = error.message
}

async function handleResetPassword() {
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    authError.value = 'Nhập email trước để lấy lại mật khẩu nhé.'
    return
  }

  submittingAuth.value = true
  authMessage.value = ''
  authError.value = ''
  const { error } = await resetPassword(trimmedEmail)
  submittingAuth.value = false

  if (error) {
    authError.value = error.message
    return
  }

  authMessage.value = 'Đã gửi email đặt lại mật khẩu.'
}

async function handleSignOut() {
  await signOut()
  loginOpen.value = false
  memberMenuOpen.value = false
}

onMounted(() => {
  initAuth()
})

watch(() => route.path, () => {
  closeMobileMenu()
  memberMenuOpen.value = false
})

watch(user, (currentUser) => {
  if (currentUser) loginOpen.value = false
})
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
    <nav class="mx-auto flex max-w-390 items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 xl:px-10">
      <AppLogo />

      <div class="hidden lg:flex lg:items-center lg:gap-7 lg:text-sm lg:font-semibold lg:text-slate-200">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="shrink-0 transition hover:text-emerald-200"
          :class="isActive(item.to) ? 'text-emerald-200' : 'text-slate-200'">
          {{ item.label }}
        </NuxtLink>
      </div>

      <form
        class="ml-auto flex w-full max-w-xs items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 shadow-2xl shadow-emerald-950/20 sm:max-w-sm"
        @submit.prevent="submitSearch">
        <Search class="mr-3 size-4 shrink-0 text-emerald-200" />
        <input v-model="keyword" type="search" placeholder="Tìm phim Hàn Quốc..."
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400">
      </form>

      <div class="group/member relative hidden shrink-0 items-center gap-2.5 md:flex" @mouseenter="memberMenuOpen = true"
        @mouseleave="memberMenuOpen = false">
        <button v-if="user" type="button"
          class="grid size-9 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/16"
          aria-label="Thông báo">
          <Bell class="size-4 fill-current" />
        </button>

        <button type="button"
          class="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-2.5 pl-1 text-xs font-black text-slate-950 shadow-xl shadow-black/20 transition hover:bg-emerald-100"
          :aria-label="user ? 'Tài khoản thành viên' : 'Đăng nhập thành viên'" @click="handleMemberClick">
          <Loader2 v-if="authLoading" class="mx-1 size-4 animate-spin" />
          <template v-else-if="user">
            <img :src="memberAvatar" :alt="memberName"
              class="size-7 rounded-full object-cover ring-2 ring-emerald-200/80">
          </template>
          <User v-else class="ml-1 size-4 fill-current" />
          <span class="max-w-24 truncate">{{ user ? memberName : 'Thành viên' }}</span>
        </button>

        <Transition name="member-menu">
          <div v-if="user && memberMenuOpen"
            class="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-lg border border-white/10 bg-[#101116] py-2 text-sm font-semibold text-slate-200 shadow-2xl shadow-black/40">
            <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
              class="flex h-12 w-full cursor-pointer items-center gap-3 px-5 text-left transition hover:bg-white/8 hover:text-white">
              <component :is="item.icon" class="size-4 shrink-0" />
              {{ item.label }}
            </NuxtLink>
            <div class="my-2 border-t border-white/10" />
            <button type="button"
              class="flex h-12 w-full cursor-pointer items-center gap-3 px-5 text-left font-black text-emerald-300 transition hover:bg-white/8 hover:text-white"
              @click="handleSignOut">
              <LogOut class="size-4 shrink-0" />
              Đăng xuất
            </button>
          </div>
        </Transition>
      </div>

      <button type="button"
        class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/8 text-white transition hover:bg-white/16 lg:hidden"
        aria-label="Mở menu" @click="mobileMenuOpen = true">
        <Menu class="size-5" />
      </button>
    </nav>

    <Teleport to="body">
      <Transition name="sidebar">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-60 lg:hidden">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMobileMenu" />
          <div class="absolute inset-y-0 left-0 w-72 bg-slate-950 shadow-2xl">
            <div class="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <AppLogo />
              <button type="button"
                class="grid size-10 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/8 text-white transition hover:bg-white/16"
                aria-label="Đóng menu" @click="closeMobileMenu">
                <X class="size-5" />
              </button>
            </div>
            <nav class="flex flex-col gap-1 p-4">
              <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
                class="rounded-lg px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-emerald-200"
                :class="isActive(item.to) ? 'bg-white/8 text-emerald-200' : ''" @click="closeMobileMenu">
                {{ item.label }}
              </NuxtLink>
            </nav>
            <div class="border-t border-white/10 p-4">
              <button type="button"
                class="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-100"
                @click="handleMemberClick">
                <img v-if="user" :src="memberAvatar" :alt="memberName"
                  class="size-7 rounded-full object-cover">
                <User v-else class="size-4 fill-current" />
                <span>{{ user ? memberName : 'Đăng nhập thành viên' }}</span>
              </button>
              <div v-if="user" class="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <NuxtLink v-for="item in memberMenuItems" :key="item.label" :to="item.to"
                  class="flex h-11 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white">
                  <component :is="item.icon" class="size-4 shrink-0" />
                  {{ item.label }}
                </NuxtLink>
                <div class="border-t border-white/10" />
                <button type="button"
                  class="flex h-11 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-black text-emerald-300 transition hover:bg-white/8 hover:text-white"
                  @click="handleSignOut">
                  <LogOut class="size-4 shrink-0" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="auth-modal">
        <div v-if="loginOpen" class="fixed inset-0 z-70 grid place-items-center px-3 py-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" @click="loginOpen = false" />
          <div
            class="relative grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/50 md:grid-cols-[1fr_1fr]">
            <button type="button"
              class="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full text-white transition hover:bg-white/10"
              aria-label="Đóng đăng nhập" @click="loginOpen = false">
              <X class="size-5" />
            </button>

            <div class="auth-poster-panel hidden min-h-[32rem] items-end p-8 md:flex">
              <div>
                <AppLogo />
              </div>
            </div>

            <div class="bg-slate-950 px-5 py-10 sm:px-10 md:px-16 md:py-16">
              <div v-if="user">
                <p class="text-sm font-bold text-emerald-300">Thành viên</p>
                <h2 class="mt-2 text-2xl font-black">Tài khoản của bạn</h2>
                <p class="mt-6 rounded-md bg-white/8 px-4 py-3 text-sm font-semibold text-slate-100">{{ user.email }}</p>
                <button type="button"
                  class="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 text-sm font-black text-slate-950 transition hover:bg-white"
                  @click="handleSignOut">
                  <LogOut class="size-4" />
                  Đăng xuất
                </button>
              </div>

              <form v-else @submit.prevent="submitLogin">
                <h2 class="text-2xl font-black">{{ authMode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}</h2>
                <p class="mt-5 text-sm text-slate-300">
                  <template v-if="authMode === 'login'">
                    Nếu bạn chưa có tài khoản,
                    <button type="button" class="font-black text-emerald-300 hover:text-white"
                      @click="authMode = 'register'; authError = ''; authMessage = ''">
                      đăng ký ngay
                    </button>
                  </template>
                  <template v-else>
                    Nếu bạn đã có tài khoản,
                    <button type="button" class="font-black text-emerald-300 hover:text-white"
                      @click="authMode = 'login'; authError = ''; authMessage = ''">
                      đăng nhập ngay
                    </button>
                  </template>
                </p>

                <div class="mt-8 space-y-3">
                  <div class="flex h-12 items-center rounded-md border border-white/10 bg-white/8 px-4">
                    <Mail class="mr-3 size-4 shrink-0 text-slate-400" />
                    <input v-model="email" type="email" required placeholder="Email"
                      class="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400">
                  </div>
                  <div class="flex h-12 items-center rounded-md border border-white/10 bg-white/8 px-4">
                    <LockKeyhole class="mr-3 size-4 shrink-0 text-slate-400" />
                    <input v-model="password" type="password" required minlength="6" placeholder="Mật khẩu"
                      class="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400">
                  </div>
                </div>

                <button type="button"
                  class="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-white/8 text-sm font-black text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="submittingProvider" @click="handleGoogleLogin">
                  <Loader2 v-if="submittingProvider" class="size-4 animate-spin" />
                  <Chrome v-else class="size-4" />
                  Tiếp tục với Google
                </button>

                <div class="my-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span class="h-px flex-1 bg-white/10" />
                  hoặc
                  <span class="h-px flex-1 bg-white/10" />
                </div>

                <button type="submit"
                  class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 text-sm font-black text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="submittingAuth">
                  <Loader2 v-if="submittingAuth" class="size-4 animate-spin" />
                  <User v-else class="size-4 fill-current" />
                  {{ authMode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}
                </button>

                <button v-if="authMode === 'login'" type="button"
                  class="mt-7 block w-full text-center text-sm font-bold text-white hover:text-emerald-300"
                  @click="handleResetPassword">
                  Quên mật khẩu?
                </button>

                <p v-if="authMessage" class="mt-4 rounded-md bg-emerald-400/12 px-3 py-2 text-sm text-emerald-100">
                  {{ authMessage }}
                </p>
                <p v-if="authError" class="mt-4 rounded-md bg-red-500/12 px-3 py-2 text-sm text-red-100">
                  {{ authError }}
                </p>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-enter-active>div:last-child,
.sidebar-leave-active>div:last-child {
  transition: transform 0.2s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from>div:last-child,
.sidebar-leave-to>div:last-child {
  transform: translateX(-100%);
}

.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity 0.18s ease;
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;
}

.member-menu-enter-active,
.member-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.member-menu-enter-from,
.member-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

.auth-poster-panel {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.45), rgba(2, 6, 23, 0.92)),
    linear-gradient(135deg, rgba(0, 220, 130, 0.12) 0 18%, transparent 18% 100%),
    radial-gradient(circle at 22% 18%, rgba(0, 220, 130, 0.24), transparent 8rem),
    linear-gradient(120deg, #061f17 0%, #0f172a 54%, #020617 100%);
  position: relative;
}

.auth-poster-panel::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(115deg, transparent 0 10%, rgba(0, 220, 130, 0.12) 10% 10.6%, transparent 10.6% 100%),
    repeating-linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0 7.5rem, transparent 7.5rem 8rem),
    repeating-linear-gradient(15deg, rgba(0, 220, 130, 0.08) 0 10rem, transparent 10rem 10.6rem);
  content: "";
  opacity: 0.75;
}

.auth-poster-panel > div {
  position: relative;
  z-index: 1;
}
</style>
