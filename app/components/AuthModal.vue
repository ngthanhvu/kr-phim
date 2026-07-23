<script setup lang="ts">
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound, X } from 'lucide-vue-next'

const open = defineModel<boolean>({ default: false })
const { fetchUser } = useAuth()

const mode = ref<'login' | 'register' | 'forgot'>('login')
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
    if (mode.value === 'forgot') {
      await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: email.value },
      })
      success.value = 'Đã gửi link đặt lại mật khẩu! Kiểm tra email của bạn.'
    } else if (mode.value === 'login') {
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
    setTimeout(() => closeModal(), mode.value === 'login' ? 800 : 1500)
  } catch (err: any) {
    error.value = err?.data?.message || (mode.value === 'login' ? 'Đăng nhập thất bại' : mode.value === 'forgot' ? 'Gửi yêu cầu thất bại' : 'Đăng ký thất bại')
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
      <div v-if="open" class="auth-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="auth-modal-backdrop absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" @click="closeModal" />

        <div class="auth-modal-content relative w-full max-w-[820px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#12121a] shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <button type="button"
            class="absolute right-4 top-4 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white/70 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
            @click="closeModal">
            <X class="size-4" />
          </button>

          <div class="flex flex-col md:flex-row">
            <div class="w-full md:w-1/2">
              <div class="relative h-1.5 bg-gradient-to-r from-[#FFD166] via-[#FFB800] to-[#FFD166] md:hidden" />

              <div class="p-6 pb-4">
                <div v-if="mode !== 'forgot'" class="mb-1 flex items-center gap-2.5">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD166]/10">
                    <svg class="size-5 text-[#FFD166]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white">
                      {{ mode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}
                    </h2>
                    <p class="text-xs text-white/40">
                      <template v-if="mode === 'login'">
                        Chào mừng bạn quay trở lại!
                      </template>
                      <template v-else>
                        Tạo tài khoản miễn phí
                      </template>
                    </p>
                  </div>
                </div>

                <div v-if="mode !== 'forgot'" class="mt-5 flex gap-1 rounded-full bg-white/[0.04] p-1">
                  <button type="button"
                    class="relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                    :class="mode === 'login' ? 'bg-[#FFD166] text-[#0f111a] shadow-[0_4px_15px_rgba(255,209,102,0.25)]' : 'text-white/50 hover:text-white/80'"
                    @click="switchMode('login')">
                    Đăng nhập
                  </button>
                  <button type="button"
                    class="relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                    :class="mode === 'register' ? 'bg-[#FFD166] text-[#0f111a] shadow-[0_4px_15px_rgba(255,209,102,0.25)]' : 'text-white/50 hover:text-white/80'"
                    @click="switchMode('register')">
                    Đăng ký
                  </button>
                </div>

                <div v-if="mode === 'forgot'">
                  <button type="button"
                    class="mb-3 flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
                    @click="mode = 'login'">
                    <ArrowLeft class="size-3.5" />
                    Quay lại đăng nhập
                  </button>
                  <div class="flex items-center gap-2.5">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD166]/10">
                      <KeyRound class="size-5 text-[#FFD166]" />
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Quên mật khẩu</h2>
                      <p class="text-xs text-white/40">Nhập email để nhận link đặt lại mật khẩu</p>
                    </div>
                  </div>
                </div>
              </div>

              <form class="px-6 pb-6 pt-2" @submit.prevent="handleSubmit">
                <Transition name="form-slide" mode="out-in">
                  <div v-if="mode === 'forgot'" :key="'forgot'" class="space-y-3">
                    <div class="relative">
                      <Mail class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input v-model="email" type="email" required placeholder="Email của bạn"
                        class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                    </div>
                  </div>
                  <div v-else :key="mode" class="space-y-3">
                    <Transition name="form-field">
                      <div v-if="mode === 'register'" class="relative">
                        <UserRound class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                        <input v-model="name" type="text" placeholder="Tên hiển thị"
                          class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                      </div>
                    </Transition>

                    <div class="relative">
                      <Mail class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input v-model="email" type="email" required placeholder="Email hoặc số điện thoại"
                        class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                    </div>

                    <div class="relative">
                      <LockKeyhole class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6"
                        :placeholder="mode === 'login' ? 'Mật khẩu' : 'Mật khẩu (tối thiểu 6 ký tự)'"
                        class="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FFD166]/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#FFD166]/10">
                      <button type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                        @click="showPassword = !showPassword">
                        <EyeOff v-if="showPassword" class="size-4" />
                        <Eye v-else class="size-4" />
                      </button>
                    </div>
                  </div>
                </Transition>

                <button type="submit"
                  class="auth-submit-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#FFD166] text-sm font-bold text-[#0f111a] transition-all hover:bg-[#FFC845] hover:shadow-[0_8px_25px_rgba(255,209,102,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
                  :disabled="loading">
                  <svg v-if="loading" class="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : mode === 'forgot' ? 'Gửi link đặt lại mật khẩu' : 'Tạo tài khoản') }}
                </button>

                <div v-if="mode === 'login'" class="mt-3 text-right">
                  <button type="button"
                    class="text-xs text-white/40 transition hover:text-[#FFD166]"
                    @click="mode = 'forgot'">
                    Quên mật khẩu?
                  </button>
                </div>

                <div v-if="mode !== 'forgot'" class="mt-5 flex items-center gap-3">
                  <div class="h-px flex-1 bg-white/[0.08]" />
                  <span class="text-xs text-white/30">hoặc</span>
                  <div class="h-px flex-1 bg-white/[0.08]" />
                </div>

                <div v-if="mode !== 'forgot'" class="mt-4 grid grid-cols-2 gap-2.5">
                  <button type="button"
                    class="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-white/70 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white">
                    <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button"
                    class="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-white/70 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white">
                    <svg class="size-4" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>

                <Transition name="form-message">
                  <p v-if="error" class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                    <svg class="size-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    {{ error }}
                  </p>
                </Transition>

                <Transition name="form-message">
                  <p v-if="success" class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm font-medium text-green-400">
                    <Check class="size-4 shrink-0" />
                    {{ success }}
                  </p>
                </Transition>
              </form>
            </div>

            <div class="auth-modal-image relative hidden overflow-hidden md:block md:w-1/2">
              <div class="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
              <div class="absolute inset-0 opacity-30">
                <div class="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-[#FFD166]/20 blur-3xl" />
                <div class="absolute bottom-1/3 right-1/4 h-40 w-40 rounded-full bg-[#e94560]/20 blur-3xl" />
                <div class="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-[#FFD166]/15 blur-2xl" />
              </div>
              <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD166]/10 backdrop-blur-sm">
                  <svg class="size-8 text-[#FFD166]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                </div>
                <p class="text-center text-lg font-bold text-white drop-shadow-lg">
                  Khám phá hàng ngàn bộ phim hấp dẫn
                </p>
                <p class="mt-2 text-center text-sm text-white/60">
                  Đăng nhập để trải nghiệm trọn vẹn
                </p>
                <div class="mt-6 flex gap-2">
                  <span class="h-1.5 w-8 rounded-full bg-[#FFD166]" />
                  <span class="h-1.5 w-4 rounded-full bg-[#FFD166]/40" />
                  <span class="h-1.5 w-4 rounded-full bg-[#FFD166]/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.auth-modal-content {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-modal-backdrop {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.form-field-enter-active,
.form-field-leave-active {
  transition: all 0.2s ease;
}

.form-field-enter-from,
.form-field-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.form-message-enter-active,
.form-message-leave-active {
  transition: all 0.25s ease;
}

.form-message-enter-from,
.form-message-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
