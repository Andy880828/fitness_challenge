/**
 * GET /api/cron/ping — Supabase keep-alive 端點的授權與 DB 行為。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cron/ping.get'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

describe('GET /api/cron/ping', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.unstubAllEnvs()
  })

  it('未帶 Authorization 且 production 模式回 401', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'sekret' }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue(undefined))

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('Authorization 不對回 401', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'sekret' }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue('Bearer wrong'))

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('production 環境且未設 CRON_SECRET 回 500（防誤上線忘設）', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: undefined }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue(undefined))

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: expect.stringMatching(/CRON_SECRET/),
    })
  })

  it('正確 token 通過授權並 SELECT challenge_settings', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'sekret' }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue('Bearer sekret'))
    const sb = createMockSupabase({ data: { id: 1 }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    const result = await handler(mockEvent)
    expect(result).toMatchObject({ ok: true })
    expect(typeof result.elapsed).toBe('number')
    expect(sb.from).toHaveBeenCalledWith('challenge_settings')
  })

  it('DB 失敗回 500', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'sekret' }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue('Bearer sekret'))
    const sb = createMockSupabase({ data: null, error: { message: 'paused' } })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('開發環境且未設 CRON_SECRET 也允許（方便 curl 測試）', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: undefined }))
    vi.stubGlobal('getRequestHeader', vi.fn().mockReturnValue(undefined))
    const sb = createMockSupabase({ data: { id: 1 }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)

    const result = await handler(mockEvent)
    expect(result.ok).toBe(true)
  })
})
