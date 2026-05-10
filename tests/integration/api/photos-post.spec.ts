/**
 * POST /api/photos — 認證 + multipart 上傳 + storage + DB。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serverSupabaseUser } from '#supabase/server'
import handler from '~~/server/api/photos/index.post'
import { useSupabaseServer } from '~~/server/utils/supabase-server'
import { createMockSupabase } from '../../unit/helpers/supabase-mock'

vi.mock('~~/server/utils/supabase-server', () => ({
  useSupabaseServer: vi.fn(),
}))

const mockEvent = {} as unknown as Parameters<typeof handler>[0]

const makePart = (
  name: string,
  data: Buffer,
  type?: string,
) => ({ name, data, type })

describe('POST /api/photos', () => {
  beforeEach(() => {
    vi.mocked(useSupabaseServer).mockReset()
    vi.mocked(serverSupabaseUser).mockReset()
  })

  it('未登入回 401', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('空表單回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue(null))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('檔案缺失回 400', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-04-01')),
    ]))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('檔案過大回 413', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-04-01')),
      makePart('file', Buffer.alloc(9 * 1024 * 1024), 'image/jpeg'),
    ]))
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 413 })
  })

  it('non-owner 上傳回 403', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-04-01')),
      makePart('file', Buffer.from('fake-jpg'), 'image/jpeg'),
    ]))
    const sb = createMockSupabase({ data: { id: 'p-1', user_id: 'u-other' }, error: null })
    vi.mocked(useSupabaseServer).mockReturnValue(sb as never)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('owner 上傳成功回 photo 物件', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'u1' } as never)
    vi.stubGlobal('readMultipartFormData', vi.fn().mockResolvedValue([
      makePart('participantId', Buffer.from('p-1')),
      makePart('date', Buffer.from('2026-04-01')),
      makePart('file', Buffer.from('fake-jpg'), 'image/jpeg'),
    ]))

    const photoRow = {
      id: 'ph-1',
      participant_id: 'p-1',
      date: '2026-04-01',
      storage_path: 'u1/2026-04-01/x.jpg',
      public_url: 'https://x/p',
      size_bytes: 8,
      uploaded_at: '2026-04-01T00:00:00Z',
    }
    const sb = createMockSupabase(({ table, ops }) => {
      if (table === 'participants') {
        return { data: { id: 'p-1', user_id: 'u1' }, error: null }
      }
      if (table === 'photos' && ops.includes('insert')) {
        return { data: photoRow, error: null }
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
      id: 'ph-1',
      participantId: 'p-1',
      publicUrl: 'https://x/p',
    })
  })
})
