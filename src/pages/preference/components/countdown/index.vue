<script setup lang="ts">
import type { CountdownConfig } from '@/utils/countdown'

import { Checkbox, DatePicker, Input } from 'ant-design-vue'
import dayjs from 'dayjs'
import { onMounted, ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { getCountdownConfig, saveCountdownConfig } from '@/utils/countdown'

const startTime = ref<dayjs.Dayjs>()
const endTime = ref<dayjs.Dayjs>()
const backgroundColor = ref('#00000080')
const showDays = ref(true)
const showHours = ref(true)
const showMinutes = ref(true)
const showSeconds = ref(true)
const textColor = ref('#FFFFFF')

onMounted(async () => {
  const config = await getCountdownConfig()
  console.warn(config)
  if (config.startTime) startTime.value = dayjs(config.startTime)
  if (config.endTime) endTime.value = dayjs(config.endTime)
  if (config.backgroundColor) backgroundColor.value = config.backgroundColor
  if (config.textColor) textColor.value = config.textColor
  if (config.showDays !== undefined) showDays.value = config.showDays
  if (config.showHours !== undefined) showHours.value = config.showHours
  if (config.showMinutes !== undefined) showMinutes.value = config.showMinutes
  if (config.showSeconds !== undefined) showSeconds.value = config.showSeconds
})

async function saveConfig() {
  const config: CountdownConfig = {
    startTime: startTime.value?.toISOString() || '',
    endTime: endTime.value?.toISOString() || '',
    backgroundColor: backgroundColor.value,
    textColor: textColor.value,
    showDays: showDays.value,
    showHours: showHours.value,
    showMinutes: showMinutes.value,
    showSeconds: showSeconds.value,
  }
  await saveCountdownConfig(config)
  // Optionally notify main window to reload config or use store to sync
}
</script>

<template>
  <ProList title="倒数设置">
    <ProListItem
      description="设置倒计时的起始时间"
      title="开始时间"
    >
      <DatePicker
        v-model:value="startTime"
        format="YYYY-MM-DD HH:mm:ss"
        show-time
        @change="saveConfig"
      />
    </ProListItem>

    <ProListItem
      description="设置倒计时的目标时间"
      title="结束时间"
    >
      <DatePicker
        v-model:value="endTime"
        format="YYYY-MM-DD HH:mm:ss"
        show-time
        @change="saveConfig"
      />
    </ProListItem>

    <ProListItem
      description="选择要显示的时间单位"
      title="显示设置"
    >
      <div class="flex gap-4">
        <Checkbox
          v-model:checked="showDays"
          @change="saveConfig"
        >
          天
        </Checkbox>
        <Checkbox
          v-model:checked="showHours"
          @change="saveConfig"
        >
          时
        </Checkbox>
        <Checkbox
          v-model:checked="showMinutes"
          @change="saveConfig"
        >
          分
        </Checkbox>
        <Checkbox
          v-model:checked="showSeconds"
          @change="saveConfig"
        >
          秒
        </Checkbox>
      </div>
    </ProListItem>

    <ProListItem
      description="设置倒计时窗口的背景颜色"
      title="背景颜色"
    >
      <div class="flex items-center gap-2">
        <div
          class="h-8 w-8 border border-gray-500 rounded"
          :style="{ backgroundColor }"
        />
        <Input
          v-model:value="backgroundColor"
          class="w-32"
          @change="saveConfig"
        />
      </div>
    </ProListItem>

    <ProListItem
      description="设置倒计时文字的颜色"
      title="文字颜色"
    >
      <div class="flex items-center gap-2">
        <div
          class="h-8 w-8 border border-gray-500 rounded"
          :style="{ backgroundColor: textColor }"
        />
        <Input
          v-model:value="textColor"
          class="w-32"
          @change="saveConfig"
        />
      </div>
    </ProListItem>
  </ProList>
</template>
