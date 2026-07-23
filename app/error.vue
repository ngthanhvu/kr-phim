<script setup lang="ts">
import { ArrowLeft, Home, Search } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

const router = useRouter()
const keyword = ref('')

function handleSearch() {
  if (keyword.value.trim()) {
    router.push({ path: '/phim', query: { q: keyword.value.trim() } })
  }
}

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}

useHead({
  title: `${props.error?.statusCode || 404} - Không tìm thấy trang - CineK`,
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})
</script>

<template>
  <main class="min-h-screen overflow-hidden bg-black">
    <AppHeader />

    <section
      class="relative mx-auto flex min-h-[80vh] max-w-390 items-center justify-center px-4 pt-24 sm:px-6 lg:px-8 xl:px-10">
      <!-- Background glow -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          class="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
        <div
          class="absolute left-1/4 top-1/3 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/5 blur-2xl" />
      </div>

      <!-- Dot pattern -->
      <div class="absolute inset-0 pointer-events-none opacity-20 hidden md:block"
        style="background-image:radial-gradient(rgba(250,204,21,0.3) 0.5px, transparent 1px);background-size:4px 4px">
      </div>

      <div class="relative z-10 w-full max-w-xl text-center">
        <!-- 404 Number -->
        <div class="relative mb-8">
          <span class="text-[10rem] font-black leading-none tracking-tighter text-white sm:text-[12rem]">
            {{ error?.statusCode || 404 }}
          </span>
          <div class="absolute inset-0 blur-3xl opacity-20">
            <span class="text-[10rem] font-black leading-none tracking-tighter text-yellow-400 sm:text-[12rem]">
              {{ error?.statusCode || 404 }}
            </span>
          </div>
        </div>
        <!-- Error message -->
        <p class="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
          Trang bạn đang tìm không tồn tại hoặc đã bị xóa.
        </p>
        <!-- Action buttons -->
        <div class="mt-8 flex items-center justify-center gap-3">
          <button type="button"
            class="inline-flex h-12 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
            @click="goHome">
            <Home class="size-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    </section>

    <AppFooter />
  </main>
</template>
