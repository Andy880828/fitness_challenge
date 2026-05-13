/**
 * DELETE /api/exercise-proofs/[id] — kind=photo 刪檔 + row；kind=note 只刪 row。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/exercise-proofs/[id].delete'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('DELETE /api/exercise-proofs/[id]', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(serverSupabaseUser).mockReset()
  })

  it('未登入回 401', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('缺 id 回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue(undefined))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('證明不存在回 404', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-x'))
    const sb = createMockSupabase({ data: null, error: { message: 'not found' } })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('非 owner 回 403', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-1'))
    const sb = createMockSupabase({
      data: {
        id: 'ep-1',
        kind: 'photo',
        storage_path: 'x/y/z.jpg',
        participant_id: 'p-1',
        participants: { user_id: 'u-other' },
      },
      error: null,
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('owner 刪 photo 同步清 storage 與 row', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-1'))
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    const sb = createMockSupabase({
      data: {
        id: 'ep-1',
        kind: 'photo',
        storage_path: 'u1/exercise/2026-05-13/x.jpg',
        participant_id: 'p-1',
        participants: { user_id: 'u1' },
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
  })

  it('owner 刪 note 不呼叫 storage', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ep-2'))
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    const sb = createMockSupabase({
      data: {
        id: 'ep-2',
        kind: 'note',
        storage_path: null,
        participant_id: 'p-1',
        participants: { user_id: 'u1' },
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
    expect(removeMock).not.toHaveBeenCalled()
  })
})
