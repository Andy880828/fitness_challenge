/**
 * DELETE /api/photos/:id — 認證 + 擁有者驗證 + storage/DB cleanup。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/photos/[id].delete'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('DELETE /api/photos/:id', () => {
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

  it('photo 不存在回 404', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ph-x'))
    const sb = createMockSupabase({ data: null, error: { message: 'not found' } })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('非擁有者回 403', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ph-1'))
    const sb = createMockSupabase({
      data: {
        id: 'ph-1',
        storage_path: 'u-other/2026-04-01/x.jpg',
        participant_id: 'p-other',
        participants: { user_id: 'u-other' },
      },
      error: null,
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('擁有者刪除成功回 success', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('ph-1'))
    const sb = createMockSupabase(({ ops }) => {
      if (ops.includes('select')) {
        return {
          data: {
            id: 'ph-1',
            storage_path: 'u1/2026-04-01/x.jpg',
            participant_id: 'p-1',
            participants: { user_id: 'u1' },
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    const removeSpy = vi.fn().mockResolvedValue({ error: null })
    sb.storage.from = vi.fn(() => ({
      upload: vi.fn(),
      remove: removeSpy,
      getPublicUrl: vi.fn(),
    })) as never
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    const result = await handler(mockEvent)
    expect(result).toEqual({ success: true })
    expect(removeSpy).toHaveBeenCalledWith(['u1/2026-04-01/x.jpg'])
  })
})
