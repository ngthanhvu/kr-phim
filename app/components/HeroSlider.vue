<script setup lang="ts">
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'

interface Movie {
  source?: string
  slug?: string
  thumb?: string
  poster?: string
  name?: string
}

const props = defineProps<{
  slides: Movie[]
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [index: number]
}>()

const swiperRef = ref<any>(null)

function onSlideChange(swiper: any) {
  emit('update:modelValue', swiper.realIndex ?? 0)
}

function goTo(index: number) {
  if (!swiperRef.value) return
  const swiper = swiperRef.value.swiper ?? swiperRef.value
  if (typeof swiper.slideToLoop === 'function') {
    swiper.slideToLoop(index)
  } else if (typeof swiper.slideTo === 'function') {
    swiper.slideTo(index)
  }
}

defineExpose({ goTo })
</script>

<template>
  <Swiper ref="swiperRef" :modules="[Autoplay, EffectFade]" effect="fade" :fade-effect="{ crossFade: true }"
    :slides-per-view="1" :loop="props.slides.length > 1"
    :autoplay="{ delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true }" :speed="800"
    class="absolute inset-0 h-full w-full" @slide-change="onSlideChange">
    <SwiperSlide v-for="(slide, index) in props.slides" :key="`${slide.source}-${slide.slug}-${index}`"
      class="h-full w-full">
      <img :src="slide.poster || slide.thumb" :alt="slide.name"
        class="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none object-cover object-top lg:object-[72%_center]">
    </SwiperSlide>
  </Swiper>
</template>
