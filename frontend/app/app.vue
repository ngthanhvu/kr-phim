<script setup lang="ts">
const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

const { settings, loading, loadSettings } = useAppSettings()

onMounted(async () => {
  await loadSettings()
  
  // Apply site name to document title
  if (settings.value) {
    document.title = settings.value.siteName
  }
})

// Watch settings changes and update meta
watch(settings, (s) => {
  if (!s) return
  
  useHead({
    title: s.siteName,
    meta: [
      { name: 'description', content: s.siteDescription || '' },
      { property: 'og:site_name', content: s.siteName },
      { property: 'og:title', content: s.siteName },
      { name: 'twitter:title', content: s.siteName },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: s.siteFavicon || '/favicon.ico' },
      { rel: 'apple-touch-icon', href: s.siteFavicon || '/favicon.ico' },
    ],
  })
}, { immediate: true })

// Update favicon dynamically when settings change
watch(
  () => settings.value?.siteFavicon,
  (favicon) => {
    if (!favicon) return
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
    const appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null
    if (link) link.href = favicon
    if (appleLink) appleLink.href = favicon
  }
)

// Watch font changes
watch(
  () => settings.value?.googleFont,
  (fontUrl) => {
    let fontEl = document.getElementById('custom-google-font')
    if (fontUrl && !fontEl) {
      fontEl = document.createElement('link')
      fontEl.id = 'custom-google-font'
      fontEl.rel = 'stylesheet'
      document.head.appendChild(fontEl)
    }
    if (fontEl && fontUrl) {
      fontEl.href = fontUrl
    } else if (fontEl && !fontUrl) {
      fontEl.remove()
    }
  }
)
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator color="#facc15" :height="2" />
  
  <!-- Maintenance mode page -->
  <div v-if="!isAdmin && settings?.maintenanceMode" class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="mx-auto mb-6 size-20 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <AppIcon name="wrench" class="size-10 text-yellow-300" />
      </div>
      <h1 class="mb-3 text-3xl font-black text-white">{{ settings?.siteName || 'Website' }} đang bảo trì</h1>
      <p class="mb-6 text-zinc-400">Chúng tôi đang cập nhật hệ thống. Vui lòng quay lại sau!</p>
      <a :href="`mailto:${settings?.contactEmail || 'support@cinek.app'}`" class="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">
        <AppIcon name="mail" class="size-4" />
        {{ settings?.contactEmail || 'Hỗ trợ' }}
      </a>
    </div>
  </div>
  
  <!-- Normal pages -->
  <template v-else>
    <NuxtLayout>
      <NuxtPage :key="$route.fullPath" />
    </NuxtLayout>
    <AppFooter v-if="!isAdmin" />
    <ScrollToTop v-if="!isAdmin" />
  </template>
</template>
