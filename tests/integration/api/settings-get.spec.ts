/**
 * GET /api/settings — 公開讀取挑戰賽設定。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/settings/index.get'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
  })

  it('回傳 startDate / testMode / updatedAt', async () => {
    const sb = createMockSupabase({
      data: { start_date: '2026-05-07', test_mode: false, updated_at: '2026-04-01T00:00:00Z' },
      error: null,
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    const result = await handler(mockEvent)
    expect(result).toEqual({
      startDate: '2026-05-07',
      testMode: false,
      updatedAt: '2026-04-01T00:00:00Z',
    })
  })

  it('DB 失敗回 500', async () => {
    const sb = createMockSupabase({ data: null, error: { message: 'connection lost' } })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })
})
