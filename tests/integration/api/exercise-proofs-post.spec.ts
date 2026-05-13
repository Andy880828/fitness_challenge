/**
 * POST /api/exercise-proofs — kind=note / kind=photo 兩條路徑、認證與越權保護。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/exercise-proofs/index.post'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

const makePart = (name: string, data: Buffer, type?: string) => ({ name, data, type })

describe('POST /api/exercise-proofs', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(serverSupabaseUser).mockReset()
  })

  it('未登入回 401', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('缺 kind 回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
    ]))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('kind 非 photo/note 回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('weird')),
    ]))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('越權新增回 403', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('note')),
      makePart('note', Buffer.from('test')),
    ]))
    const sb = createMockSupabase({ data: { id: 'p-1', user_id: 'u-other' }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('note 空字串回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('note')),
      makePart('note', Buffer.from('   ')),
    ]))
    const sb = createMockSupabase({ data: { id: 'p-1', user_id: 'u1' }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('note 過長回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('note')),
      makePart('note', Buffer.from('a'.repeat(501))),
    ]))
    const sb = createMockSupabase({ data: { id: 'p-1', user_id: 'u1' }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('owner 新增 note 成功回 ExerciseProof', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('note')),
      makePart('note', Buffer.from('跑步 5k')),
    ]))
    const row = {
      id: 'ep-1',
      participant_id: 'p-1',
      date: '2026-05-13',
      kind: 'note',
      note: '跑步 5k',
      storage_path: null,
      public_url: null,
      size_bytes: null,
      created_at: '2026-05-13T00:00:00Z',
    }
    const sb = createMockSupabase(({ table, ops }) => {
      if (table === 'participants') return { data: { id: 'p-1', user_id: 'u1' }, error: null }
      if (table === 'exercise_proofs' && ops.includes('insert')) {
        return { data: row, error: null }
      }
      return { data: null, error: null }
    })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    const result = await handler(mockEvent)
    expect(result).toMatchObject({
      id: 'ep-1',
      kind: 'note',
      note: '跑步 5k',
    })
  })

  it('owner 新增 photo 成功回 ExerciseProof', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-05-13')),
      makePart('kind', Buffer.from('photo')),
      makePart('file', Buffer.from('fake-jpg'), 'image/jpeg'),
    ]))
    const row = {
      id: 'ep-2',
      participant_id: 'p-1',
      date: '2026-05-13',
      kind: 'photo',
      note: null,
      storage_path: 'u1/exercise/2026-05-13/x.jpg',
      public_url: 'https://x/p',
      size_bytes: 8,
      created_at: '2026-05-13T00:00:00Z',
    }
    const sb = createMockSupabase(({ table, ops }) => {
      if (table === 'participants') return { data: { id: 'p-1', user_id: 'u1' }, error: null }
      if (table === 'exercise_proofs' && ops.includes('insert')) {
        return { data: row, error: null }
      }
      return { data: null, error: null }
    })
    sb.storage.from = vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://x/p' } }),
    })) as never
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    const result = await handler(mockEvent)
    expect(result).toMatchObject({
      id: 'ep-2',
      kind: 'photo',
      publicUrl: 'https://x/p',
    })
  })
})
