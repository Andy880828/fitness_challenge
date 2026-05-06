/**
 * POST /api/admin/checkins/update — 401 未登入 / 403 非 admin / 200 成功 + audit。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/admin/checkins/update.post'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('POST /api/admin/checkins/update', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(serverSupabaseUser).mockReset()
    vi.stubGlobal('readBody', vi.fn())
  })

  it('未登入回 401', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('非 admin 回 403', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    const sb = createMockSupabase({ data: { id: 'p1', is_admin: false }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('缺欄位回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    const sb = createMockSupabase({ data: { id: 'p1', is_admin: true }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({}))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('admin 成功更新並寫 audit', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'admin-u' } as never)
    const sb = createMockSupabase(({ table, ops }) => {
      if (table === 'participants') {
        return { data: { id: 'p-admin', is_admin: true }, error: null }
      }
      if (table === 'checkins' && ops.includes('upsert')) {
        return {
          data: {
            participant_id: 'p-target',
            date: '2026-05-01',
            workout: true,
            diet: false,
            updated_at: '2026-05-07T00:00:00Z',
            reviewed_at: '2026-05-07T00:00:00Z',
            reviewer_id: 'admin-u',
          },
          error: null,
        }
      }
      if (table === 'checkins') {
        return { data: { workout: false, diet: false }, error: null }
      }
      if (table === 'admin_audit_log') {
        return { data: null, error: null }
      }
      return { data: null, error: null }
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      participantId: 'p-target',
      date: '2026-05-01',
      workout: true,
      markReviewed: true,
    }))

    const result = await handler(mockEvent)
    expect((result as { reviewer_id?: string }).reviewer_id).toBe('admin-u')

    const auditCall = sb.lastCalls.find((c) => c.table === 'admin_audit_log')
    expect(auditCall).toBeDefined()
    const insertOp = auditCall?.ops.find((o) => o.method === 'insert')
    expect(insertOp?.args[0]).toMatchObject({
      action: 'checkin.review',
      target_table: 'checkins',
      target_id: 'p-target:2026-05-01',
    })
  })
})
