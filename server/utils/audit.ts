/**
 * 寫入 admin 操作稽核 — 寫失敗只記 log 不中斷主流程。
 */

import type { H3Event } from 'h3'
import { childLogger } from './logger'
import { useSupabaseServer } from './supabase-server'

export type AuditAction =
  | 'checkin.update'
  | 'checkin.review'
  | 'photo.delete'
  | 'photo.batch_delete'

export interface AuditPayload {
  actorUserId: string
  action: AuditAction
  targetTable: 'checkins' | 'photos'
  targetId: string
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
}

export async function writeAudit(event: H3Event, payload: AuditPayload): Promise<void> {
  const sb = useSupabaseServer(event)
  const log = childLogger({ scope: 'audit', actor: payload.actorUserId })
  const { error } = await sb.from('admin_audit_log').insert({
    actor_user_id: payload.actorUserId,
    action: payload.action,
    target_table: payload.targetTable,
    target_id: payload.targetId,
    before: payload.before ?? null,
    after: payload.after ?? null,
    metadata: payload.metadata ?? null,
  })
  if (error) {
    log.error({ err: error, payload }, '稽核寫入失敗')
  }
}
