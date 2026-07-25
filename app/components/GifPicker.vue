<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  select: [url: string]
}>()

const config = useRuntimeConfig()
const GIPHY_API_KEY = config.public.giphyApiKey
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'

const searchQuery = ref('')
const gifs = ref<any[]>([])
const isLoading = ref(false)
const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const popupStyle = ref({})

async function fetchTrending() {
  isLoading.value = true
  try {
    const data = await $fetch(`${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=pg-13`)
    gifs.value = data.data || []
  } catch {
    gifs.value = []
  } finally {
    isLoading.value = false
  }
}

async function searchGifs(query: string) {
  if (!query.trim()) {
    fetchTrending()
    return
  }
  isLoading.value = true
  try {
    const data = await $fetch(`${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13&lang=vi`)
    gifs.value = data.data || []
  } catch {
    gifs.value = []
  } finally {
    isLoading.value = false
  }
}

function onSearchInput() {
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(() => {
    searchGifs(searchQuery.value)
  }, 400)
}

function selectGif(gif: any) {
  const url = gif.images?.fixed_width?.url || gif.images?.original?.url || ''
  emit('select', url)
  open.value = false
}

function closePicker() {
  open.value = false
  searchQuery.value = ''
  gifs.value = []
}

function updatePosition(triggerSelector: string) {
  const trigger = document.querySelector(triggerSelector) as HTMLElement
  if (!trigger || !popupRef.value) return
  const rect = trigger.getBoundingClientRect()
  const popupWidth = 340
  const left = Math.min(rect.left, window.innerWidth - popupWidth - 16)
  popupStyle.value = {
    position: 'fixed' as const,
    top: `${rect.top - 8}px`,
    left: `${Math.max(16, left)}px`,
    zIndex: 10000,
    width: `${popupWidth}px`
  }
}

function handleClickOutside(e: MouseEvent, triggerSelector: string) {
  const trigger = document.querySelector(triggerSelector) as HTMLElement
  if (!trigger || !popupRef.value) return
  if (!popupRef.value.contains(e.target as Node) && !trigger.contains(e.target as Node)) {
    closePicker()
  }
}

watch(open, (val) => {
  if (val) {
    fetchTrending()
  }
})

onMounted(() => {
  window.addEventListener('resize', () => {
    const trigger = document.querySelector('.gif-trigger-active') as HTMLElement
    if (trigger) updatePosition('.gif-trigger-active')
  })
})

defineExpose({ updatePosition, handleClickOutside })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" ref="popupRef"
      class="gif-popup rounded-xl border border-white/10 bg-[#1e1e2e] shadow-2xl overflow-hidden" :style="popupStyle">
      <div class="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <div class="flex items-center gap-1.5 flex-1 bg-[#2a2a3d] rounded-lg px-2 py-1.5">
          <AppIcon name="search" class="size-3.5 text-white/40 shrink-0" />
          <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Tìm kiếm GIF..."
            class="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none" />
        </div>
        <button type="button"
          class="size-6 grid place-items-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition"
          @click="closePicker">
          <AppIcon name="x" class="size-3.5" />
        </button>
      </div>

      <div class="max-h-70 overflow-y-auto p-2">
        <div v-if="isLoading" class="grid grid-cols-5 gap-1.5">
          <div v-for="i in 15" :key="i" class="aspect-square animate-pulse rounded-md bg-white/5" />
        </div>

        <div v-else-if="!gifs.length" class="flex flex-col items-center justify-center py-8 text-center">
          <AppIcon name="image" class="size-8 text-white/10 mb-2" />
          <p class="text-xs text-white/30">Không tìm thấy GIF</p>
        </div>

        <div v-else class="grid grid-cols-5 gap-1.5">
          <button v-for="gif in gifs" :key="gif.id" type="button"
            class="group relative aspect-square overflow-hidden rounded-md bg-white/5 transition hover:ring-2 hover:ring-[#FFD166]"
            @click="selectGif(gif)">
            <img :src="gif.images?.fixed_width_small?.url || gif.images?.preview_gif?.url" :alt="gif.title"
              class="h-full w-full object-cover transition group-hover:scale-110" loading="lazy" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-center gap-1 px-3 py-2 border-t border-white/5">
        <span class="text-[10px] text-white/25">POWERED BY</span>
        <span
          class="text-[10px] font-bold bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">GIPHY</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.gif-popup {
  animation: gifPopIn 0.2s ease-out;
}

@keyframes gifPopIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
