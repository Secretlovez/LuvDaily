<script setup lang="ts">
import { computed } from 'vue'

import FlipCard from './FlipCard.vue'

const props = defineProps<{
  value: number
  unit: string
  pad: number
  color?: string
}>()

const digits = computed(() => {
  const str = props.value.toString().padStart(props.pad, '0')
  return str.split('').map(Number)
})
</script>

<template>
  <div class="mx-[0.5vw] flex items-end">
    <div class="flex">
      <FlipCard
        v-for="(digit, index) in digits"
        :key="index"
        class="mx-[0.1vw]"
        :color="color"
        :val="digit"
      />
    </div>
    <span
      class="mb-[1vw] ml-[0.5vw] text-[2vw] font-bold shadow-black drop-shadow-md"
      :style="{ fontFamily: '\'PangMenZhengDao\', sans-serif', color: color || 'white' }"
    >{{ unit }}</span>
  </div>
</template>
