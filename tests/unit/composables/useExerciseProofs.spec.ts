/**
 * useExerciseProofs — list / addPhoto / addNote / remove。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExerciseProofs } from '~/composables/useExerciseProofs'
import { createMockSupabase } from '../helpers/supabase-mock'

const noteRow = {
  id: 'ep-1',
  participant_id: 'p-1',
  date: '2026-05-13',
  kind: 'note' as const,
  note: '今天慢跑 5 公里',
  storage_path: null,
  public_url: null,
  size_bytes: null,
  created_at: '2026-05-13T00:00:00Z',
}

const photoRow = {
  id: 'ep-2',
  participant_id: 'p-1',
  date: '2026-05-13',
  kind: 'photo' as const,
  note: null,
  storage_path: 'u1/exercise/2026-05-13/x.jpg',
  public_url: 'https://x/p',
  size_bytes: 1024,
  created_at: '2026-05-13T00:00:00Z',
}

describe('useExerciseProofs', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('listByParticipantDate 回傳 ExerciseProof 陣列', async () => {
    const supabase = createMockSupabase({ data: [noteRow, photoRow], error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listByParticipantDate } = useExerciseProofs()
    const proofs = await listByParticipantDate('p-1', '2026-05-13')
    expect(proofs).toHaveLength(2)
    expect(proofs[0]?.kind).toBe('note')
    expect(proofs[1]?.kind).toBe('photo')
    expect(proofs[1]?.publicUrl).toBe('https://x/p')
  })

  it('listByParticipantDate error 回空陣列', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'x' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listByParticipantDate } = useExerciseProofs()
    expect(await listByParticipantDate('p-1', '2026-05-13')).toEqual([])
  })

  it('listRecent 過濾掉 participant 為 null 的 row', async () => {
    const supabase = createMockSupabase({
      data: [
        { ...noteRow, participant: { id: 'p-1', name: 'Alex', gender: 'M' } },
        { ...photoRow, participant: null },
      ],
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listRecent } = useExerciseProofs()
    const list = await listRecent()
    expect(list).toHaveLength(1)
    expect(list[0]?.owner.name).toBe('Alex')
  })

  it('countDaysByParticipant 回傳不重複日期集合', async () => {
    const supabase = createMockSupabase({
      data: [{ date: '2026-05-13' }, { date: '2026-05-13' }, { date: '2026-05-12' }],
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { countDaysByParticipant } = useExerciseProofs()
    const set = await countDaysByParticipant('p-1')
    expect(set.size).toBe(2)
    expect(set.has('2026-05-13')).toBe(true)
  })

  it('addNote 空字串擋下不打 API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { addNote } = useExerciseProofs()
    const res = await addNote('p-1', '2026-05-13', '   ')
    expect(res.error).toBe('文字證明不可為空')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('addNote 超過 500 字回 error', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { addNote } = useExerciseProofs()
    const res = await addNote('p-1', '2026-05-13', 'a'.repeat(501))
    expect(res.error).toBe('文字證明上限 500 字')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('addNote 成功回傳 ExerciseProof', async () => {
    const expected = {
      id: 'ep-1',
      participantId: 'p-1',
      date: '2026-05-13',
      kind: 'note',
      note: '跑步 5k',
      storagePath: null,
      publicUrl: null,
      sizeBytes: null,
      createdAt: '2026-05-13T00:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(expected)
    vi.stubGlobal('$fetch', fetchMock)
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { addNote } = useExerciseProofs()
    const res = await addNote('p-1', '2026-05-13', '跑步 5k')
    expect(res.error).toBeNull()
    expect(res.data).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('remove 成功不回 error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('$fetch', fetchMock)
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { remove } = useExerciseProofs()
    const res = await remove('ep-1')
    expect(res.error).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/exercise-proofs/ep-1', { method: 'DELETE' })
  })

  it('remove 失敗回 error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('forbidden'))
    vi.stubGlobal('$fetch', fetchMock)
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { remove } = useExerciseProofs()
    const res = await remove('ep-1')
    expect(res.error).toBe('forbidden')
  })
})
