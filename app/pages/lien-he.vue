<script setup lang="ts">
import { Mail, MessageCircle, Send } from 'lucide-vue-next'

const contactMethods = [
  {
    icon: Send,
    label: 'Telegram',
    value: '@cinek_support',
    link: 'https://telegram.dog/cinek',
    desc: 'Nhắn tin trực tiếp, phản hồi nhanh nhất.',
  },
  {
    icon: MessageCircle,
    label: 'Cộng đồng',
    value: 'Group Facebook CineK',
    link: '#',
    desc: 'Tham gia nhóm để trao đổi, chia sẻ phim.',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@cinek.app',
    link: 'mailto:support@cinek.app',
    desc: 'Gửi email cho các vấn đề cần chi tiết.',
  },
]
</script>

<template>
  <main class="min-h-screen bg-[#0f111a] text-white">
    <AppHeader />

    <section class="mx-auto max-w-[700px] px-4 pt-24 pb-16 sm:px-6 lg:px-8 xl:px-10">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white sm:text-4xl">Liên hệ</h1>
        <p class="mt-2 text-slate-400">
          Có câu hỏi, góp ý hoặc cần hỗ trợ? Liên hệ với chúng tôi qua các kênh bên dưới.
        </p>
      </div>

      <div class="space-y-4 mb-8">
        <NuxtLink v-for="method in contactMethods" :key="method.label" :to="method.link"
          class="flex items-start gap-4 rounded-xl border border-white/10 bg-[#191b24] p-5 transition hover:border-white/20 hover:bg-white/5 group">
          <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-yellow-400/10 text-yellow-400">
            <component :is="method.icon" class="size-6" />
          </div>
          <div>
            <h3 class="font-bold text-white group-hover:text-yellow-300 transition">{{ method.label }}</h3>
            <p class="text-sm text-yellow-200/80">{{ method.value }}</p>
            <p class="text-sm text-slate-400 mt-1">{{ method.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <div class="rounded-xl border border-white/10 bg-[#191b24] p-6">
        <h2 class="text-lg font-bold text-white mb-3">Lưu ý</h2>
        <ul class="space-y-2 text-sm text-slate-300">
          <li class="flex items-start gap-2">
            <span class="text-yellow-400 mt-0.5">•</span>
            <span>Chúng tôi sẽ phản hồi trong vòng 24 giờ.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-yellow-400 mt-0.5">•</span>
            <span>Vui lòng mô tả rõ vấn đề bạn gặp phải để được hỗ trợ nhanh nhất.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-yellow-400 mt-0.5">•</span>
            <span>Nếu báo lỗi phim, hãy kèm theo link phim và tập bị lỗi.</span>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>
