<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next'

const isVisible = ref(false)

function updateVisibility() {
  isVisible.value = window.scrollY > 420
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateVisibility)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <button
      v-if="isVisible"
      type="button"
      class="fixed bottom-6 right-5 z-50 grid size-12 place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-950/40 ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-white sm:bottom-8 sm:right-8"
      aria-label="Lên đầu trang"
      @click="scrollToTop"
    >
      <ArrowUp class="size-6" />
    </button>
  </Transition>
</template>
