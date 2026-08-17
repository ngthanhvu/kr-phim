<script setup lang="ts">
const currentYear = new Date().getFullYear()
const { settings, loadSettings } = useAppSettings()
onMounted(loadSettings)

const socialLinks = computed(() => {
  if (!settings.value) return []
  const links: any[] = []
  if (settings.telegramUrl) links.push({ label: 'Telegram', icon: 'send' as const, url: settings.telegramUrl })
  if (settings.facebookUrl) links.push({ label: 'Facebook', icon: 'facebook' as const, url: settings.facebookUrl })
  if (settings.tiktokUrl) links.push({ label: 'TikTok', icon: 'music' as const, url: settings.tiktokUrl })
  if (settings.youtubeUrl) links.push({ label: 'YouTube', icon: 'circle-play' as const, url: settings.youtubeUrl })
  return links
})
</script>

<template>
  <footer class="border-t border-white/10 bg-[#07090f] text-white">
    <div class="mx-auto max-w-390 px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div class="flex shrink-0 items-center gap-7">
          <AppLogo />
          <span class="hidden h-14 w-px bg-white/10 sm:block" />
        </div>

        <div v-if="socialLinks.length" class="flex flex-wrap gap-3">
          <a v-for="item in socialLinks" :key="item.label" :href="item.url" target="_blank" rel="noopener noreferrer"
            class="grid size-12 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-950/30 transition hover:-translate-y-0.5 hover:bg-white"
            :aria-label="item.label">
            <AppIcon :name="item.icon" class="size-5" />
          </a>
        </div>
      </div>

      <div class="mt-10 flex flex-wrap gap-x-8 gap-y-5 text-sm font-bold">
        <NuxtLink v-for="label in ['Điều khoản sử dụng', 'Chính sách bảo mật', 'Hỏi-Đáp', 'Giới thiệu', 'Liên hệ']" :key="label"
          :to="'/' + label.toLowerCase().replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ợ|ở|õ|ờ|ớ|ở|ỡ/g, a => ({a:'a','ă':'aw','â':'aw'}[a] || a)).replace(/./g, s => s === '-' ? '' : s) + '-su-dung'"
          class="text-slate-100 transition hover:text-yellow-200">
          {{ label }}
        </NuxtLink>
      </div>

      <p class="mt-10 max-w-4xl text-sm leading-7 text-slate-300">
        {{ settings?.siteDescription || 'Xem phim Hàn Quốc online với phụ đề Vietsub' }}
      </p>

      <p class="mt-7 text-sm text-slate-400">
        © {{ currentYear }} {{ settings?.siteName || 'CineK' }}
      </p>
    </div>
  </footer>
</template>
