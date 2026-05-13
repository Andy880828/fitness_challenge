/**
 * DELETE /api/admin/exercise-proofs/[id] — 驗 reason 必填、kind 路徑分流、audit 寫入。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/admin/exercise-proofs/[id].delete'
import { requireAdmin } from '~~/server/utils/require-admin'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { writeAudit } from '~~/server/utils/audit'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/require-admin', () => ({
  requireAdmin: vi.fn(),
}))
vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))
vi.mock('~~/server/utils/audit', () => ({
  writeAudit: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('DELETE /api/admin/exercise-proofs/[id]', () => {
  beforeEach(() => {
    vi.mocked(requireAdmin).mockReset()
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(writeAudit).mockReset()
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-u' } as never)
  })

  it('缺 id 回 400', async () => {
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue(undefined))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('缺 reason 回 400', async () => {
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-1'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ reason: '   ' }))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('證明不存在回 404', async () => {
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-x'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ reason: '違規' }))
    const sb = createMockSupabase({ data: null, error: { message: 'not found' } })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('刪 photo 同步清 storage', async () => {
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-1'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ reason: '違規' }))
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    const sb = createMockSupabase({
      data: {
        id: 'ep-1',
        kind: 'photo',
        storage_path: 'u1/exercise/2026-05-13/x.jpg',
      },
      error: null,
    })
    sb.storage.from = vi.fn(() => ({
      upload: vi.fn(),
      remove: removeMock,
      getPublicUrl: vi.fn(),
    })) as never
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    const res = await handler(mockEvent)
    expect(res).toEqual({ success: true })
    expect(removeMock).toHaveBeenCalledWith(['u1/exercise/2026-05-13/x.jpg'])
    expect(writeAudit).toHaveBeenCalled()
  })

  it('刪 note 不呼叫 storage', async () => {
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-2'))
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ reason: '違規' }))
    const removeMock = vi.fn()
    const sb = createMockSupabase({
      data: { id: 'ep-2', kind: 'note', note: 'x', storage_path: null },
      error: null,
    })
    sb.storage.from = vi.fn(() => ({
      upload: vi.fn(),
      remove: removeMock,
      getPublicUrl: vi.fn(),
    })) as never
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    const res = await handler(mockEvent)
    expect(res).toEqual({ success: true })
    expect(removeMock).not.toHaveBeenCalled()
  })
})
