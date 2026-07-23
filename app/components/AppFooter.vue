<script setup lang="ts">
import { CirclePlay, Globe2, MessageCircle, Music2, Send } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const socialLinks = [
  { label: 'Telegram', icon: Send },
  { label: 'Chat', icon: MessageCircle },
  { label: 'Website', icon: Globe2 },
  { label: 'Cộng đồng', icon: MessageCircle },
  { label: 'TikTok', icon: Music2 },
  { label: 'Video', icon: CirclePlay },
]

const linkGroups = [
  ['Điều khoản sử dụng', '/dieu-khoan-su-dung'],
  ['Chính sách bảo mật', '/chinh-sach-bao-mat'],
  ['Hỏi-Đáp', '/hoi-dap'],
  ['Giới thiệu', '/gioi-thieu'],
  ['Liên hệ', '/lien-he'],
]
</script>

<template>
  <footer class="border-t border-white/10 bg-[#07090f] text-white">
    <div class="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div class="flex shrink-0 items-center gap-7">
          <AppLogo />
          <span class="hidden h-14 w-px bg-white/10 sm:block" />
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            v-for="item in socialLinks"
            :key="item.label"
            type="button"
            class="grid size-12 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-950/30 transition hover:-translate-y-0.5 hover:bg-white"
            :aria-label="item.label"
          >
            <component :is="item.icon" class="size-5" />
          </button>
        </div>
      </div>

      <div class="mt-10 flex flex-wrap gap-x-8 gap-y-5 text-sm font-bold">
        <NuxtLink
          v-for="[label, path] in linkGroups"
          :key="label"
          :to="path"
          class="text-slate-100 transition hover:text-yellow-200"
        >
          {{ label }}
        </NuxtLink>
      </div>

      <p class="mt-10 max-w-4xl text-sm leading-7 text-slate-300">
        CineK - Trang xem phim Hàn Quốc online chất lượng cao với Vietsub, thuyết minh, lồng tiếng và trải nghiệm xem mượt trên mọi thiết bị. Kho phim bộ, phim lẻ và nội dung mới được cập nhật thường xuyên.
      </p>

      <p class="mt-7 text-sm text-slate-400">
        © {{ currentYear }} CineK
      </p>
    </div>
  </footer>
</template>
