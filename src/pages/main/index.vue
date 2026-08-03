<script setup lang="ts">
import type { CountdownConfig } from '@/utils/countdown'
import type { WorkConfig } from '@/utils/work'

import { PhysicalSize } from '@tauri-apps/api/dpi'
import { Menu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import FlipClock from '@/components/countdown/FlipClock.vue'
import WorkDashboard from '@/components/work/WorkDashboard.vue'
import { useSharedMenu } from '@/composables/useSharedMenu'
import { useWindowPosition } from '@/composables/useWindowPosition'
import { hideWindow, setAlwaysOnTop, setTaskbarVisibility, showWindow } from '@/plugins/window'
import { useCatStore } from '@/stores/cat'
import { useGeneralStore } from '@/stores/general'
import { getCountdownConfig } from '@/utils/countdown'
import { DEFAULT_WORK_CONFIG, getWorkConfig } from '@/utils/work'

const appWindow = getCurrentWebviewWindow()
const catStore = useCatStore()
const generalStore = useGeneralStore()
const { getSharedMenu } = useSharedMenu()
const { isMounted, setWindowPosition } = useWindowPosition()
const countdownConfig = ref<CountdownConfig>({ startTime: '', endTime: '' })
const workConfig = ref<WorkConfig>({ ...DEFAULT_WORK_CONFIG })
let configPollTimer: number | null = null

async function updateConfig() {
  if (catStore.window.mode === 'countdown') {
    countdownConfig.value = await getCountdownConfig()
  } else {
    workConfig.value = await getWorkConfig()
  }
}

onMounted(async () => {
  await updateConfig()
  configPollTimer = window.setInterval(updateConfig, 1000)
})

onUnmounted(() => {
  if (configPollTimer !== null) window.clearInterval(configPollTimer)
})

watch(() => catStore.window.mode, async (mode) => {
  await updateConfig()

  const size = mode === 'countdown'
    ? new PhysicalSize({ width: 360, height: 80 })
    : new PhysicalSize({ width: 500, height: 300 })

  await appWindow.setSize(size)
  await setWindowPosition()
}, { immediate: true })

watch(() => catStore.window.visible, async (value) => {
  value ? await showWindow() : await hideWindow()
})

watch(() => catStore.window.passThrough, (value) => {
  appWindow.setIgnoreCursorEvents(value)
}, { immediate: true })

watch(() => catStore.window.alwaysOnTop, setAlwaysOnTop, { immediate: true })
watch(() => generalStore.app.taskbarVisible, setTaskbarVisibility, { immediate: true })

function handleMouseDown(event: MouseEvent) {
  if (event.button === 0) appWindow.startDragging()
}

async function handleContextmenu(event: MouseEvent) {
  event.preventDefault()
  if (event.shiftKey) return

  const menu = await Menu.new({ items: await getSharedMenu() })
  menu.popup()
}
</script>

<template>
  <main
    v-show="isMounted"
    class="size-screen overflow-hidden"
    :style="{
      opacity: catStore.window.opacity / 100,
      borderRadius: `${catStore.window.radius}%`,
    }"
    @contextmenu="handleContextmenu"
    @mousedown="handleMouseDown"
  >
    <div
      v-if="catStore.window.mode === 'countdown'"
      class="size-full flex items-center justify-center"
      data-tauri-drag-region
      :style="{ backgroundColor: countdownConfig.backgroundColor || '#00000080' }"
    >
      <FlipClock
        v-if="countdownConfig.endTime"
        :config="countdownConfig"
        :target-time="countdownConfig.endTime"
      />
    </div>

    <WorkDashboard
      v-else
      :config="workConfig"
    />
  </main>
</template>
