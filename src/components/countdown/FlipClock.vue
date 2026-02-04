<script setup lang="ts">
import type { CountdownConfig } from '@/utils/countdown'

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { onMounted, onUnmounted, ref } from 'vue'

import FlipUnit from './FlipUnit.vue'

const props = defineProps<{
  targetTime: string
  config: CountdownConfig
}>()

dayjs.extend(duration)

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)

let timer: number | null = null

function updateTime() {
  const now = dayjs()
  const target = dayjs(props.targetTime)
  const diff = target.diff(now)

  if (diff <= 0) {
    days.value = 0
    hours.value = 0
    minutes.value = 0
    seconds.value = 0
    return
  }

  const dur = dayjs.duration(diff)
  // Calculate based on what is shown
  // Logic: if higher units are hidden, their time should be added to the next available lower unit

  let totalSeconds = Math.floor(dur.asSeconds())

  // Reset values
  days.value = 0
  hours.value = 0
  minutes.value = 0
  seconds.value = 0

  if (props.config?.showDays) {
    days.value = Math.floor(totalSeconds / (24 * 3600))
    totalSeconds %= (24 * 3600)
  }

  if (props.config?.showHours) {
    hours.value = Math.floor(totalSeconds / 3600)
    totalSeconds %= 3600
  }

  if (props.config?.showMinutes) {
    minutes.value = Math.floor(totalSeconds / 60)
    totalSeconds %= 60
  }

  if (props.config?.showSeconds) {
    seconds.value = totalSeconds
  }
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex select-none items-center justify-center rounded-xl p-[2vw]">
    <FlipUnit
      v-if="config?.showDays"
      :color="config.textColor"
      :pad="3"
      unit="天"
      :value="days"
    />
    <FlipUnit
      v-if="config?.showHours"
      :color="config.textColor"
      :pad="2"
      unit="时"
      :value="hours"
    />
    <FlipUnit
      v-if="config?.showMinutes"
      :color="config.textColor"
      :pad="2"
      unit="分"
      :value="minutes"
    />
    <FlipUnit
      v-if="config?.showSeconds"
      :color="config.textColor"
      :pad="2"
      unit="秒"
      :value="seconds"
    />
  </div>
</template>
