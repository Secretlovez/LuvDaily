<script setup lang="ts">
import type { WorkConfig } from '@/utils/work'

import { Calendar, Input, InputNumber, TimePicker } from 'ant-design-vue'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import {
  calculateWorkMetrics,
  countWorkdaysInMonth,
  DEFAULT_WORK_CONFIG,
  getWorkConfig,
  getWorkDurationSeconds,
  isWorkdayDate,
  saveWorkConfig,
} from '@/utils/work'

const monthlySalary = ref<number | null>(DEFAULT_WORK_CONFIG.monthlySalary)
const workStartTime = ref(dayjs(`2000-01-01T${DEFAULT_WORK_CONFIG.workStartTime}:00`))
const workEndTime = ref(dayjs(`2000-01-01T${DEFAULT_WORK_CONFIG.workEndTime}:00`))
const workdayOverrides = ref<Record<string, boolean>>({})
const calendarValue = ref(dayjs())
const slogan = ref(DEFAULT_WORK_CONFIG.slogan)
const ready = ref(false)

const now = new Date()
const scheduleIsValid = computed(() => workEndTime.value.isAfter(workStartTime.value))
const calendarWorkdays = computed(() => countWorkdaysInMonth(calendarValue.value.toDate(), workdayOverrides.value))
const durationText = computed(() => {
  if (!scheduleIsValid.value) return '下班时间需晚于上班时间'

  const config = buildConfig()
  const totalMinutes = getWorkDurationSeconds(config) / 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `每日计薪 ${hours} 小时${minutes ? ` ${minutes} 分钟` : ''}`
})
const preview = computed(() => calculateWorkMetrics(buildConfig(), now))

onMounted(async () => {
  const config = await getWorkConfig()
  monthlySalary.value = config.monthlySalary
  workStartTime.value = dayjs(`2000-01-01T${config.workStartTime}:00`)
  workEndTime.value = dayjs(`2000-01-01T${config.workEndTime}:00`)
  workdayOverrides.value = { ...config.workdayOverrides }
  slogan.value = config.slogan
  ready.value = true
})

function buildConfig(): WorkConfig {
  return {
    monthlySalary: monthlySalary.value ?? 0,
    workStartTime: workStartTime.value.format('HH:mm'),
    workEndTime: workEndTime.value.format('HH:mm'),
    workdayOverrides: workdayOverrides.value,
    slogan: slogan.value,
  }
}

async function saveConfig() {
  if (!ready.value || !scheduleIsValid.value) return
  await saveWorkConfig(buildConfig())
}

function isConfiguredWorkday(date: dayjs.Dayjs): boolean {
  return isWorkdayDate(date.toDate(), workdayOverrides.value)
}

function handleDateSelect(date: dayjs.Dayjs) {
  const dateKey = date.format('YYYY-MM-DD')
  const nextValue = !isConfiguredWorkday(date)
  const weekday = date.day()
  const defaultValue = weekday !== 0 && weekday !== 6
  const nextOverrides = { ...workdayOverrides.value }

  if (nextValue === defaultValue) {
    delete nextOverrides[dateKey]
  } else {
    nextOverrides[dateKey] = nextValue
  }

  workdayOverrides.value = nextOverrides
  saveConfig()
}
</script>

<template>
  <ProList title="薪资与时间">
    <ProListItem
      description="用于计算本月日薪与每秒收入，仅保存在本机"
      title="税后月薪"
    >
      <InputNumber
        v-model:value="monthlySalary"
        addon-after="元 / 月"
        class="w-42"
        :min="0"
        :precision="2"
        @change="saveConfig"
      />
    </ProListItem>

    <ProListItem
      :description="durationText"
      title="每日工作时间"
    >
      <div class="flex items-center gap-2">
        <TimePicker
          v-model:value="workStartTime"
          :allow-clear="false"
          format="HH:mm"
          :minute-step="5"
          @change="saveConfig"
        />
        <span class="text-color-3">至</span>
        <TimePicker
          v-model:value="workEndTime"
          :allow-clear="false"
          format="HH:mm"
          :minute-step="5"
          @change="saveConfig"
        />
      </div>
    </ProListItem>

    <ProListItem
      description="默认周一至周五为工作日；点击日期可取消或补设工作日"
      title="工作日日历"
      vertical
    >
      <div class="work-calendar-wrap">
        <div class="calendar-summary">
          <div class="calendar-legend">
            <span><i class="legend-dot work" />工作日</span>
            <span><i class="legend-dot rest" />休息日</span>
          </div>
          <strong>当前月份共 {{ calendarWorkdays }} 个工作日</strong>
        </div>

        <Calendar
          v-model:value="calendarValue"
          :fullscreen="false"
          @select="handleDateSelect"
        >
          <template #dateFullCellRender="{ current }">
            <div
              class="workday-cell"
              :class="{
                'is-workday': isConfiguredWorkday(current),
                'is-restday': !isConfiguredWorkday(current),
                'is-other-month': !current.isSame(calendarValue, 'month'),
                'is-today': current.isSame(dayjs(), 'day'),
              }"
            >
              <span class="day-number">{{ current.date() }}</span>
              <span class="day-state">{{ isConfiguredWorkday(current) ? '班' : '休' }}</span>
            </div>
          </template>
        </Calendar>
      </div>
    </ProListItem>
  </ProList>

  <ProList title="显示内容">
    <ProListItem
      description="显示在上班模式左上角，最多 40 个字"
      title="上班心灵鸡汤"
    >
      <Input
        v-model:value="slogan"
        class="w-72"
        :maxlength="40"
        placeholder="给今天的自己一句鼓励"
        show-count
        @change="saveConfig"
      />
    </ProListItem>
  </ProList>

  <ProList title="实时计算预览">
    <div class="preview-card">
      <div>
        <span>本月工作日</span>
        <strong>{{ preview.workdays }} 天</strong>
      </div>
      <div>
        <span>每日工资</span>
        <strong>¥{{ preview.dailySalary.toFixed(2) }}</strong>
      </div>
      <div>
        <span>每秒工资</span>
        <strong>¥{{ preview.salaryPerSecond.toFixed(4) }}</strong>
      </div>
    </div>
  </ProList>
</template>

<style scoped>
.work-calendar-wrap {
  width: 100%;
}

.calendar-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--ant-color-text-secondary);
  font-size: 12px;
}

.calendar-summary strong {
  color: #32b875;
  font-weight: 600;
}

.calendar-legend,
.calendar-legend span {
  display: flex;
  align-items: center;
}

.calendar-legend {
  gap: 14px;
}

.calendar-legend span {
  gap: 5px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-dot.work {
  background: #32b875;
}

.legend-dot.rest {
  background: var(--ant-color-fill-secondary);
}

.workday-cell {
  position: relative;
  display: flex;
  height: 42px;
  margin: 2px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s ease;
}

.workday-cell:hover {
  transform: translateY(-1px);
}

.workday-cell.is-workday {
  color: #218c5a;
  border-color: rgba(50, 184, 117, 0.25);
  background: rgba(50, 184, 117, 0.12);
}

.workday-cell.is-restday {
  color: var(--ant-color-text-tertiary);
  background: var(--ant-color-fill-quaternary);
}

.workday-cell.is-other-month {
  opacity: 0.32;
}

.workday-cell.is-today {
  border-color: #32b875;
  box-shadow: inset 0 0 0 1px rgba(50, 184, 117, 0.18);
}

.day-number {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.day-state {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 9px;
  font-weight: 600;
}

.work-calendar-wrap :deep(.ant-picker-calendar) {
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 10px;
  background: var(--ant-color-bg-container);
}

.work-calendar-wrap :deep(.ant-picker-calendar-header) {
  padding: 12px 12px 6px;
}

.work-calendar-wrap :deep(.ant-picker-panel) {
  border-top: 1px solid var(--ant-color-border-secondary);
}

.work-calendar-wrap :deep(.ant-picker-cell::before) {
  display: none;
}

.preview-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.preview-card > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 10px;
  background: var(--ant-color-bg-container);
}

.preview-card span {
  color: var(--ant-color-text-tertiary);
  font-size: 12px;
}

.preview-card strong {
  color: #32b875;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
</style>
