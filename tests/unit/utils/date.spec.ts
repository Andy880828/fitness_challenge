import { describe, it, expect } from 'vitest'
import { addDays, dayDiff, formatDateZh, measureDates, effectiveDaysSinceStart, todayStr } from '#shared/utils/date'

describe('utils/date', () => {
  describe('addDays', () => {
    it('正向加天', () => {
      expect(addDays('2026-05-07', 7)).toBe('2026-05-14')
    })

    it('跨月', () => {
      expect(addDays('2026-05-30', 5)).toBe('2026-06-04')
    })

    it('跨年', () => {
      expect(addDays('2026-12-30', 5)).toBe('2027-01-04')
    })

    it('負數 = 倒退', () => {
      expect(addDays('2026-05-10', -3)).toBe('2026-05-07')
    })

    it('0 = 同一天', () => {
      expect(addDays('2026-05-07', 0)).toBe('2026-05-07')
    })
  })

  describe('dayDiff', () => {
    it('回傳天數差', () => {
      expect(dayDiff('2026-05-07', '2026-05-14')).toBe(7)
    })

    it('同一天回傳 0', () => {
      expect(dayDiff('2026-05-07', '2026-05-07')).toBe(0)
    })

    it('反向回傳負值', () => {
      expect(dayDiff('2026-05-14', '2026-05-07')).toBe(-7)
    })
  })

  describe('formatDateZh', () => {
    it('輸出 YYYY/M/D', () => {
      expect(formatDateZh('2026-05-07')).toBe('2026/5/7')
      expect(formatDateZh('2026-12-31')).toBe('2026/12/31')
    })
  })

  describe('measureDates', () => {
    it('回傳 4 個量測日（起始日 + 4/8/12 週）', () => {
      const dates = measureDates('2026-05-07')
      expect(dates).toEqual([
        '2026-05-07',
        '2026-06-04',
        '2026-07-02',
        '2026-07-30',
      ])
    })
  })

  describe('effectiveDaysSinceStart', () => {
    it('testMode=true 直接回傳 84', () => {
      expect(effectiveDaysSinceStart({ startDate: '2026-05-07', testMode: true })).toBe(84)
    })

    it('開始日當天 → 1', () => {
      expect(
        effectiveDaysSinceStart({ startDate: '2026-05-07', now: '2026-05-07' }),
      ).toBe(1)
    })

    it('進行中第 30 天 → 30', () => {
      expect(
        effectiveDaysSinceStart({ startDate: '2026-05-07', now: '2026-06-05' }),
      ).toBe(30)
    })

    it('超出活動結束 → 84', () => {
      expect(
        effectiveDaysSinceStart({ startDate: '2026-05-07', now: '2027-01-01' }),
      ).toBe(84)
    })

    it('開始日之前 → 1（最小值保護，避免除以 0）', () => {
      expect(
        effectiveDaysSinceStart({ startDate: '2026-05-07', now: '2026-04-01' }),
      ).toBe(1)
    })
  })

  describe('todayStr', () => {
    it('用注入時鐘可決定性測試', () => {
      const fixed = new Date('2026-05-07T12:00:00Z')
      expect(todayStr(fixed)).toBe('2026-05-07')
    })
  })
})
