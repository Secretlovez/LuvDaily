<script setup lang="ts">
import type { WorkConfig } from '@/utils/work'

import { computed, onMounted, onUnmounted, ref } from 'vue'

import { calculateWorkMetrics } from '@/utils/work'

const props = defineProps<{
  config: WorkConfig
}>()

const now = ref(new Date())
const salaryTick = ref(0)
const incrementBursts = ref<Array<{ id: number, offset: number }>>([])
let timer: number | null = null

const metrics = computed(() => calculateWorkMetrics(props.config, now.value))
const currentTime = computed(() => {
  const date = now.value
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(value => String(value).padStart(2, '0'))
    .join(':')
})
const earnedSalary = computed(() => metrics.value.earnedToday.toFixed(2))
const salaryPerSecond = computed(() => metrics.value.salaryPerSecond.toFixed(4))
const statusText = computed(() => {
  if (!metrics.value.isWorkday) return 'REST · 今日休息'
  if (metrics.value.isWorking) return 'LIVE · 正在积累'
  if (metrics.value.hasFinished) return 'DONE · 今日已完成'
  return 'READY · 等待上班'
})

function tick() {
  now.value = new Date()
  const currentMetrics = calculateWorkMetrics(props.config, now.value)

  if (currentMetrics.isWorking) {
    salaryTick.value += 1
    incrementBursts.value.push({
      id: salaryTick.value,
      offset: [-8, 5, -2, 9][salaryTick.value % 4],
    })

    if (incrementBursts.value.length > 3) incrementBursts.value.shift()
  } else {
    incrementBursts.value = []
  }

  timer = window.setTimeout(tick, 1000 - now.value.getMilliseconds())
}

onMounted(tick)

onUnmounted(() => {
  if (timer !== null) window.clearTimeout(timer)
})
</script>

<template>
  <section
    class="work-dashboard"
    data-tauri-drag-region
  >
    <header
      class="work-header"
      data-tauri-drag-region
    >
      <div
        class="slogan"
        data-tauri-drag-region
      >
        <span class="slogan-dot" />
        <span>{{ config.slogan }}</span>
      </div>
      <time class="current-time">{{ currentTime }}</time>
    </header>

    <div
      class="salary-card"
      data-tauri-drag-region
    >
      <div
        class="salary-main"
        data-tauri-drag-region
      >
        <span class="today-label">今日累计</span>
        <div class="salary-value">
          <span class="currency">¥</span>
          <span
            :key="salaryTick"
          >{{ earnedSalary }}</span>
        </div>
        <div
          class="live-status"
          :class="{ active: metrics.isWorking }"
        >
          <span class="live-dot" />
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div class="increment-wrap">
        <div
          v-if="metrics.isWorking"
          class="increment-stack"
        >
          <span
            v-for="burst in incrementBursts"
            :key="burst.id"
            class="salary-increment salary-accumulate"
            :style="{ '--burst-offset': `${burst.offset}px` }"
          >+¥{{ salaryPerSecond }}</span>
        </div>
        <span
          v-else
          class="salary-increment idle"
        >¥{{ salaryPerSecond }} / 秒</span>
      </div>

      <div class="progress-area">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${metrics.progress}%` }"
          />
        </div>
        <div class="progress-meta">
          <span>今日进度 {{ metrics.progress.toFixed(1) }}%</span>
          <!-- <span>日薪 ¥{{ metrics.dailySalary.toFixed(2) }}</span> -->
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.work-dashboard {
  --green: #55e89a;
  --green-soft: #3bbf7b;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 22px 24px 24px;
  overflow: hidden;
  color: #f5faf7;
  background:
    radial-gradient(circle at 25% 0%, rgba(54, 170, 114, 0.14), transparent 42%),
    linear-gradient(145deg, rgba(13, 18, 22, 0.98), rgba(8, 11, 15, 0.98));
  font-family: Inter, 'Microsoft YaHei', sans-serif;
}

.work-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  margin-bottom: 18px;
}

.slogan {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--green);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 0 16px rgba(85, 232, 154, 0.22);
}

.slogan > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slogan-dot,
.live-dot {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 10px rgba(85, 232, 154, 0.8);
}

.current-time {
  flex: 0 0 auto;
  margin-left: 16px;
  color: rgba(237, 244, 240, 0.72);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 17px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.salary-card {
  position: relative;
  height: calc(100% - 47px);
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(85, 232, 154, 0.12);
  border-top-color: rgba(85, 232, 154, 0.34);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(17, 21, 29, 0.98), rgba(12, 15, 21, 0.98));
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

.salary-main {
  padding: 26px 30px 0;
}

.today-label {
  color: rgba(225, 235, 230, 0.52);
  font-size: 14px;
  letter-spacing: 0.12em;
}

.salary-value {
  display: flex;
  align-items: baseline;
  margin-top: 2px;
  color: var(--green);
  font-size: 62px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1.12;
  text-shadow: 0 0 26px rgba(85, 232, 154, 0.12);
  filter: drop-shadow(0 0 8px rgba(85, 232, 154, 0.42));
}

.salary-number-add {
  display: inline-block;
  animation: numberAdd 0.4s ease-out both;
}

.currency {
  margin-right: 7px;
  font-size: 33px;
  font-weight: 600;
  letter-spacing: 0;
}

.live-status {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 9px;
  color: rgba(223, 233, 228, 0.5);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.live-status .live-dot {
  width: 8px;
  height: 8px;
  background: rgba(223, 233, 228, 0.38);
  box-shadow: none;
}

.live-status.active {
  color: var(--green);
}

.live-status.active .live-dot {
  background: var(--green);
  box-shadow: 0 0 9px rgba(85, 232, 154, 0.76);
}

.increment-wrap {
  position: absolute;
  top: 50px;
  right: 30px;
  height: 72px;
  min-width: 126px;
  text-align: right;
}

.increment-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.salary-increment {
  display: inline-block;
  color: #ffe06c;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 13px rgba(255, 224, 108, 0.32);
}

.salary-increment.idle {
  color: rgba(225, 235, 230, 0.38);
  font-size: 13px;
  font-weight: 500;
  text-shadow: none;
}

.salary-accumulate {
  position: absolute;
  top: 22px;
  right: 0;
  animation: salaryAccumulate 1.85s cubic-bezier(0.16, 0.78, 0.32, 1) both;
  pointer-events: none;
}

.progress-area {
  position: absolute;
  right: 30px;
  bottom: 22px;
  left: 30px;
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
}

.progress-fill {
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #43db8d, #65eea5);
  box-shadow: 0 0 12px rgba(85, 232, 154, 0.46);
  transition: width 0.35s linear;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: rgba(225, 235, 230, 0.46);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

@keyframes numberAdd {
  0% {
    color: #fff2a6;
    transform: translateY(3px) scale(1.012);
    text-shadow: 0 0 22px rgba(255, 224, 108, 0.52);
  }
  100% {
    color: var(--green);
    transform: translateY(0) scale(1);
    text-shadow: 0 0 26px rgba(85, 232, 154, 0.12);
  }
}

@keyframes salaryAccumulate {
  0% {
    opacity: 0;
    transform: translate3d(var(--burst-offset), 14px, 0) scale(0.82);
    filter: blur(1px);
  }
  18% {
    opacity: 1;
    transform: translate3d(var(--burst-offset), 0, 0) scale(1.06);
    filter: blur(0);
  }
  62% {
    opacity: 0.82;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -34px, 0) scale(0.94);
    filter: blur(0.4px);
  }
}

@media (max-width: 510px), (max-height: 305px) {
  .work-dashboard {
    padding: 16px 18px 18px;
  }

  .work-header {
    margin-bottom: 12px;
  }

  .slogan {
    gap: 8px;
    font-size: 15px;
  }

  .current-time {
    margin-left: 12px;
    font-size: 15px;
  }

  .salary-card {
    height: calc(100% - 32px);
    border-radius: 15px;
  }

  .salary-main {
    padding: 19px 24px 0;
  }

  .salary-value {
    font-size: 54px;
  }

  .currency {
    font-size: 29px;
  }

  .live-status {
    margin-top: 6px;
  }

  .increment-wrap {
    top: 39px;
    right: 24px;
  }

  .salary-increment {
    font-size: 17px;
  }

  .progress-area {
    right: 24px;
    bottom: 15px;
    left: 24px;
  }

  .progress-meta {
    margin-top: 7px;
  }
}
</style>
