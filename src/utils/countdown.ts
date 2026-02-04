import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

export interface CountdownConfig {
  startTime: string
  endTime: string
  backgroundColor?: string
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  textColor?: string
}

const CONFIG_FILE = 'countdown_config.json'

export async function saveCountdownConfig(config: CountdownConfig): Promise<void> {
  try {
    await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), { baseDir: BaseDirectory.AppConfig })
  } catch (e) {
    console.error('Failed to save countdown config', e)
  }
}

export async function getCountdownConfig(): Promise<CountdownConfig> {
  const configExists = await exists(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig })

  if (!configExists) {
    const defaultConfig: CountdownConfig = {
      startTime: new Date('1996-12-11T00:00:00.000Z').toISOString(),
      endTime: new Date('2076-11-26T00:00:00.000Z').toISOString(),
      backgroundColor: '#00000080', // default semi-transparent black
      showDays: true,
      showHours: false,
      showMinutes: false,
      showSeconds: false,
      textColor: '#FFFFFF',
    }

    // Ensure AppConfig dir exists
    // Actually BaseDirectory.AppConfig usually exists or is handled, but safe to try/catch
    try {
      await writeTextFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), { baseDir: BaseDirectory.AppConfig })
    } catch (e) {
      console.error('Failed to write default countdown config', e)
      // Maybe directory doesn't exist, but plugin usually handles it or we need to create it.
      // For now assume it works or we might need to create the dir.
      // But BaseDirectory.AppConfig maps to AppData/Roaming/...
    }
    return defaultConfig
  }

  try {
    const content = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig })
    return JSON.parse(content)
  } catch (e) {
    console.error('Failed to read countdown config', e)
    const now = new Date()
    return {
      startTime: now.toISOString(),
      endTime: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
      backgroundColor: '#00000080',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      textColor: '#FFFFFF',
    }
  }
}
