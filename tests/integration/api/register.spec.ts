/**
 * POST /api/participants/register — 註冊三步驟（auth + participant + measure[0]）。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/participants/register.post'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

const validBody = {
  email: 'a@b.c',
  password: 'pw1234',
  participant: {
    name: 'Test',
    gender: 'M' as const,
    age: 30,
    height: 175,
    startWeight: 80,
  },
  startMeasure: { weight: 80, fatPct: 20, muscle: 30 },
}

describe('POST /api/participants/register', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
  })

  const setupSupabase = (overrides: Partial<{
    auth: unknown
    participant: { data: unknown; error: unknown }
    measurement: { data: unknown; error: unknown }
  }> = {}) => {
    const participantRow = { id: 'p-1', user_id: 'u-1', name: 'Test', gender: 'M', age: 30, height: 175, start_weight: '80', joined_at: '2026-04-01T00:00:00Z' }

    const sb = createMockSupabase(({ table, ops }) => {
      if (table === 'participants' && ops.includes('insert')) {
        return overrides.participant ?? { data: participantRow, error: null } as never
      }
      if (table === 'measurements' && ops.includes('insert')) {
        return overrides.measurement ?? { data: { participant_id: 'p-1' }, error: null } as never
      }
      if (table === 'participants' && ops.includes('delete')) {
        return { data: null, error: null }
      }
      return { data: null, error: null }
    })
    sb.auth.admin.createUser = vi.fn().mockResolvedValue(
      overrides.auth ?? { data: { user: { id: 'u-1' } }, error: null },
    )
    sb.auth.admin.deleteUser = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    return sb
  }

  it('欄位不完整回 400', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({}))
    setupSupabase()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('gender 非 M/F 回 400', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({
      ...validBody,
      participant: { ...validBody.participant, gender: 'X' },
    }))
    setupSupabase()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('auth user 建立失敗回 400', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(validBody))
    setupSupabase({ auth: { data: null, error: { message: 'duplicate email' } } })
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'duplicate email',
    })
  })

  it('participant 建立失敗時回滾 auth user 並回 500', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(validBody))
    const sb = setupSupabase({ participant: { data: null, error: { message: 'fk fail' } } })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
    expect(sb.auth.admin.deleteUser).toHaveBeenCalledWith('u-1')
  })

  it('measurement 失敗時回滾 participant + auth user 並回 500', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(validBody))
    const sb = setupSupabase({ measurement: { data: null, error: { message: 'measure fail' } } })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
    expect(sb.auth.admin.deleteUser).toHaveBeenCalledWith('u-1')
  })

  it('成功流程回 participant 物件', async () => {
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(validBody))
    setupSupabase()
    const result = await handler(mockEvent)
    expect(result).toMatchObject({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      gender: 'M',
      startWeight: 80,
    })
  })
})
