/**
 * Admin 後台共用型別。
 *
 * BatchDeleteResult：批次刪除 API（/api/admin/photos/batch-delete、
 * /api/admin/exercise-proofs/batch-delete）的統一回傳結構。
 * 抽到 shared 後可避免 Nuxt auto-import 因同名 interface 取捨而 WARN。
 */

export interface BatchDeleteResult {
  deleted: string[]
  failed: { id: string; error: string }[]
}
