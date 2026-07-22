<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button type="button" role="switch" :aria-checked="model"
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
    :class="model ? 'bg-yellow-400' : 'bg-white/15'" @click="model = !model">
    <span class="pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition duration-200 ease-in-out"
      :class="model ? 'translate-x-5' : 'translate-x-0'" />
  </button>
</template>
