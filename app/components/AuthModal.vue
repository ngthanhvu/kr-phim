<script setup lang="ts">
import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-vue-next'

const open = defineModel<boolean>({ default: false })
const { fetchUser } = useAuth()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const showPassword = ref(false)

function switchMode(m: 'login' | 'register') {
  mode.value = m
  error.value = ''
  success.value = ''
}

function resetForm() {
  name.value = ''
  email.value = ''
  password.value = ''
  error.value = ''
  success.value = ''
  showPassword.value = false
}

function closeModal() {
  open.value = false
  resetForm()
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: email.value, password: password.value },
      })
      success.value = 'Đăng nhập thành công!'
    } else {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { name: name.value, email: email.value, password: password.value },
      })
      success.value = 'Đăng ký thành công!'
    }
    await fetchUser()
    setTimeout(() => closeModal(), 1000)
  } catch (err: any) {
    error.value = err?.data?.message || (mode.value === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại')
  } finally {
    loading.value = false
  }
}

watch(open, (val) => {
  if (val) {
    resetForm()
    mode.value = 'login'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-modal">
      <div v-if="open" class="fixed inset-0 z-70 grid place-items-center px-3">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeModal" />
        <div class="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          <button type="button"
            class="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-white transition hover:bg-white/10"
            @click="closeModal">
            <X class="size-5" />
          </button>

          <div class="border-b border-white/10 p-6 pb-5">
            <h2 class="text-2xl font-black text-white">
              {{ mode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}
            </h2>
            <p class="mt-1 text-sm text-slate-400">
              <template v-if="mode === 'login'">
                Chào mừng bạn quay trở lại CineK
              </template>
              <template v-else>
                Tạo tài khoản CineK miễn phí
              </template>
            </p>

            <div class="mt-4 flex gap-1 rounded-lg bg-white/5 p-1">
              <button type="button"
                class="flex-1 rounded-md px-3 py-2 text-sm font-semibold transition"
                :class="mode === 'login' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-white'"
                @click="switchMode('login')">
                Đăng nhập
              </button>
              <button type="button"
                class="flex-1 rounded-md px-3 py-2 text-sm font-semibold transition"
                :class="mode === 'register' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-white'"
                @click="switchMode('register')">
                Đăng ký
              </button>
            </div>
          </div>

          <form class="p-6 pt-5" @submit.prevent="handleSubmit">
            <div class="space-y-3">
              <div v-if="mode === 'register'">
                <div class="relative">
                  <UserRound class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input v-model="name" type="text" placeholder="Tên hiển thị"
                    class="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                </div>
              </div>

              <div class="relative">
                <Mail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input v-model="email" type="email" required placeholder="Email"
                  class="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
              </div>

              <div class="relative">
                <LockKeyhole class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6"
                  :placeholder="mode === 'login' ? 'Mật khẩu' : 'Ít nhất 6 ký tự'"
                  class="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-yellow-400/50">
                <button type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  @click="showPassword = !showPassword">
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
            </div>

            <button type="submit"
              class="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-yellow-400 text-sm font-black text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
              :disabled="loading">
              {{ loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký') }}
            </button>

            <p v-if="error" class="mt-3 rounded-lg bg-red-500/12 p-3 text-center text-sm text-red-300">
              {{ error }}
            </p>

            <p v-if="success" class="mt-3 flex items-center justify-center gap-2 rounded-lg bg-green-500/12 p-3 text-center text-sm font-semibold text-green-300">
              <Check class="size-4" />
              {{ success }}
            </p>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity 0.18s ease;
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;
}
</style>
