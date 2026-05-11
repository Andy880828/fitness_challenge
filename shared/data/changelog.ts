/**
 * 更新日誌資料來源 — 顯示在右下角懸浮按鈕的彈窗中。
 *
 * **新版加在陣列最前面（CHANGELOG[0] 永遠是最新）**。
 * `LATEST_VERSION` 由第 0 筆推導，build 時固定。
 *
 * 比對版本是否「未讀」用字串相等：
 *   localStorage['fc:changelog:lastSeen'] === LATEST_VERSION
 * 因此版本號用簡單字串即可（'1.1' / '1.2' / '2.0'），不必語意化。
 */

export type ChangelogKind = 'feat' | 'fix' | 'perf' | 'refactor' | 'docs' | 'chore'

export interface ChangelogItem {
  kind: ChangelogKind
  text: string
}

export interface ChangelogEntry {
  version: string
  date: string // YYYY-MM-DD
  title: string
  items: readonly ChangelogItem[]
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '1.2',
    date: '2026-05-11',
    title: '社群相簿時序修正 + 補打卡上限 + 計分規則放寬',
    items: [
      { kind: 'fix', text: '社群相簿改以照片所屬日期排序，補傳照片不再佔據最新位置；右下角顯示也改為照片日期' },
      { kind: 'feat', text: '補打卡僅限「今天往前 3 天」內，月曆上更早的日期會變灰不可點選' },
      { kind: 'feat', text: '計分公式取消體脂下限保護與減脂/增肌封頂，分數直接反映實際變化幅度（1% 變化 = 1 分）' },
    ],
  },
  {
    version: '1.1',
    date: '2026-05-10',
    title: '社群進度頁、上傳體驗升級、月曆三色',
    items: [
      { kind: 'feat', text: '新增 /gallery 社群進度頁，可看到全體最新照片與每位參賽者的減重 / 體脂趨勢' },
      { kind: 'feat', text: '照片上傳改為雙階段壓縮（前端 1920px / 後端 sharp 1080px），上限提升至 8MB；上傳時顯示骨架載入 + 進度條百分比' },
      { kind: 'feat', text: '打卡月曆加入三色語義：粉色框 = 開始日、黃色框 = 今日、橘色框 = 所選日期，並補上圖例' },
      { kind: 'fix', text: '禁止打未來日期的卡，月曆未來日 disabled、日期輸入框加 max 限制' },
    ],
  },
] as const

export const LATEST_VERSION: string = CHANGELOG[0]!.version
export const CHANGELOG_STORAGE_KEY = 'fc:changelog:lastSeen' as const
