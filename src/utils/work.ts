import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

export interface WorkConfig {
  monthlySalary: number
  workStartTime: string
  workEndTime: string
  workdayOverrides: Record<string, boolean>
  slogan: string
}

export interface WorkMetrics {
  autoWorkdays: number
  workdays: number
  dailySalary: number
  salaryPerSecond: number
  earnedToday: number
  progress: number
  isWorkday: boolean
  isWorking: boolean
  hasFinished: boolean
}

export const DEFAULT_WORK_CONFIG: WorkConfig = {
  monthlySalary: 10000,
  workStartTime: '09:00',
  workEndTime: '18:00',
  workdayOverrides: {},
  slogan: '稳步守住此刻，日子会越来越宽裕',
}

const CONFIG_FILE = 'work_config.json'
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value)
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function countWeekdaysInMonth(date = new Date()): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let count = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = new Date(year, month, day).getDay()
    if (weekday !== 0 && weekday !== 6) count += 1
  }

  return count
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isWorkdayDate(date: Date, overrides: Record<string, boolean> = {}): boolean {
  const override = overrides[getDateKey(date)]
  if (typeof override === 'boolean') return override

  const weekday = date.getDay()
  return weekday !== 0 && weekday !== 6
}

export function countWorkdaysInMonth(date = new Date(), overrides: Record<string, boolean> = {}): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let count = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (isWorkdayDate(new Date(year, month, day), overrides)) count += 1
  }

  return count
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function getWorkDurationSeconds(config: Pick<WorkConfig, 'workStartTime' | 'workEndTime'>): number {
  const durationMinutes = timeToMinutes(config.workEndTime) - timeToMinutes(config.workStartTime)
  return Math.max(durationMinutes * 60, 60)
}

export function normalizeWorkConfig(value: unknown): WorkConfig {
  const input = isRecord(value) ? value : {}
  const monthlySalary = Number(input.monthlySalary)
  const workStartTime = validTime(input.workStartTime) ? input.workStartTime : DEFAULT_WORK_CONFIG.workStartTime
  const workEndTime = validTime(input.workEndTime) ? input.workEndTime : DEFAULT_WORK_CONFIG.workEndTime
  const hasValidSchedule = timeToMinutes(workEndTime) > timeToMinutes(workStartTime)
  const rawWorkdayOverrides = isRecord(input.workdayOverrides) ? input.workdayOverrides : {}
  const workdayOverrides: Record<string, boolean> = {}

  for (const [date, isWorkday] of Object.entries(rawWorkdayOverrides)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && typeof isWorkday === 'boolean') {
      workdayOverrides[date] = isWorkday
    }
  }

  return {
    monthlySalary: Number.isFinite(monthlySalary) ? Math.max(0, monthlySalary) : DEFAULT_WORK_CONFIG.monthlySalary,
    workStartTime: hasValidSchedule ? workStartTime : DEFAULT_WORK_CONFIG.workStartTime,
    workEndTime: hasValidSchedule ? workEndTime : DEFAULT_WORK_CONFIG.workEndTime,
    workdayOverrides,
    slogan: typeof input.slogan === 'string' && input.slogan.trim()
      ? input.slogan.trim().slice(0, 40)
      : DEFAULT_WORK_CONFIG.slogan,
  }
}

export function calculateWorkMetrics(configValue: WorkConfig, now = new Date()): WorkMetrics {
  const config = normalizeWorkConfig(configValue)
  const autoWorkdays = countWeekdaysInMonth(now)
  const workdays = countWorkdaysInMonth(now, config.workdayOverrides)
  const dailySalary = workdays > 0 ? config.monthlySalary / workdays : 0
  const durationSeconds = getWorkDurationSeconds(config)
  const salaryPerSecond = dailySalary / durationSeconds
  const isWorkday = isWorkdayDate(now, config.workdayOverrides)
  const start = new Date(now)
  const end = new Date(now)
  const [startHour, startMinute] = config.workStartTime.split(':').map(Number)
  const [endHour, endMinute] = config.workEndTime.split(':').map(Number)

  start.setHours(startHour, startMinute, 0, 0)
  end.setHours(endHour, endMinute, 0, 0)

  const elapsedSeconds = isWorkday
    ? Math.min(durationSeconds, Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000)))
    : 0
  const isWorking = isWorkday && now >= start && now < end
  const hasFinished = isWorkday && now >= end

  return {
    autoWorkdays,
    workdays,
    dailySalary,
    salaryPerSecond,
    earnedToday: Math.min(dailySalary, elapsedSeconds * salaryPerSecond),
    progress: durationSeconds ? elapsedSeconds / durationSeconds * 100 : 0,
    isWorkday,
    isWorking,
    hasFinished,
  }
}

export async function saveWorkConfig(config: WorkConfig): Promise<void> {
  try {
    await writeTextFile(CONFIG_FILE, JSON.stringify(normalizeWorkConfig(config), null, 2), { baseDir: BaseDirectory.AppConfig })
  } catch (error) {
    console.error('Failed to save work config', error)
  }
}

export async function getWorkConfig(): Promise<WorkConfig> {
  try {
    const configExists = await exists(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig })

    if (!configExists) {
      await saveWorkConfig(DEFAULT_WORK_CONFIG)
      return { ...DEFAULT_WORK_CONFIG }
    }

    const content = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig })
    return normalizeWorkConfig(JSON.parse(content))
  } catch (error) {
    console.error('Failed to read work config', error)
    return { ...DEFAULT_WORK_CONFIG }
  }
}
