/**
 * DELETE /api/admin/photos/:id — 認證 + reason 驗證 + audit。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/admin/photos/[id].delete'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('DELETE /api/admin/photos/:id', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(serverSupabaseUser).mockReset()
    vi.stubGlobal('readBody', vi.fn())
    vi.stubGlobal('getRouterParam', vi.fn())
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

  it('缺 reason 回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'admin-u' } as never)
    const sb = createMockSupabase({ data: { id: 'p1', is_admin: true }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ph-1'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({}))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('admin 成功刪除並寫 audit metadata.reason', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'admin-u' } as never)
    const sb = createMockSupabase(({ table }) => {
      if (table === 'participants') {
        return { data: { id: 'p-admin', is_admin: true }, error: null }
      }
      if (table === 'photos') {
        return {
          data: {
            id: 'ph-1',
            participant_id: 'p-target',
            storage_path: 'u-other/2026-05-01/x.jpg',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ph-1'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ reason: '違規內容' }))

    const result = await handler(mockEvent)
    expect(result).toEqual({ success: true })

    const auditCall = sb.lastCalls.find((c) => c.table === 'admin_audit_log')
    const insertOp = auditCall?.ops.find((o) => o.method === 'insert')
    expect(insertOp?.args[0]).toMatchObject({
      action: 'photo.delete',
      target_table: 'photos',
      target_id: 'ph-1',
      metadata: { reason: '違規內容' },
    })
  })
})
