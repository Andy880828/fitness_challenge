/**
 * useParticipantContext — auth layout 與其下頁面共用的 participant 狀態。
 * Layout 端用 provideParticipantContext() 建立 + 抓資料；
 * Page 端用 useParticipantContext() 消費。
 * 這層讓 dashboard / checkin 不必各自重複 getMine + 錯誤處理樣板。
 */

import type { InjectionKey, Ref } from 'vue'
import type { Participant } from '#shared/types/participant'

export interface ParticipantContext {
  participant: Ref<Participant | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

const KEY = Symbol('participantContext') as InjectionKey<ParticipantContext>

export const provideParticipantContext = (): ParticipantContext => {
  const { getMine } = useParticipants()
  const participant = ref<Participant | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const reload = async () => {
    loading.value = true
    error.value = null
    try {
      participant.value = await getMine()
      if (!participant.value) {
        error.value = '尚未報名，請先到 /register 完成報名'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入失敗'
    } finally {
      loading.value = false
    }
  }

  const ctx: ParticipantContext = { participant, loading, error, reload }
  provide(KEY, ctx)
  return ctx
}

export const useParticipantContext = (): ParticipantContext => {
  const ctx = inject(KEY, null)
  if (!ctx) {
    throw new Error(
      'useParticipantContext() 必須在 auth layout 之下使用；'
        + '請確認頁面有 definePageMeta({ layout: "auth" })',
    )
  }
  return ctx
}
