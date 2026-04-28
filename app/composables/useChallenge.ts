/**
 * 取得挑戰賽全域設定（startDate、testMode）並提供日期工具。
 * 資料來源：challenge_settings 表（單列 id=1），公開可讀。
 * 為避免每個元件重複 fetch，使用 useState 共享狀態。
 */

import type { ChallengeSettings } from '#shared/types/settings'
import { TOTAL_DAYS, DEFAULT_START_DATE } from '#shared/utils/constants'
import { dayDiff, todayStr, effectiveDaysSinceStart } from '#shared/utils/date'

export const useChallenge = () => {
  const settings = useState<ChallengeSettings>('challenge:settings', () => ({
    startDate: DEFAULT_START_DATE,
    testMode: false,
    updatedAt: new Date().toISOString(),
  }))

  const supabase = useSupabaseClient<any>()

  const refresh = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('challenge_settings')
      .select('start_date, test_mode, updated_at')
      .eq('id', 1)
      .single()

    if (error || !data) return
    settings.value = {
      startDate: data.start_date,
      testMode: data.test_mode,
      updatedAt: data.updated_at,
    }
  }

  const today = computed(() => todayStr())
  const day = computed(() =>
    Math.max(1, Math.min(TOTAL_DAYS, dayDiff(settings.value.startDate, today.value) + 1)),
  )
  const effectiveDays = computed(() =>
    effectiveDaysSinceStart({
      startDate: settings.value.startDate,
      testMode: settings.value.testMode,
      now: today.value,
    }),
  )

  return { settings, refresh, day, today, effectiveDays }
}
