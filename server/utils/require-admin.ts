/**
 * 驗證當前 request 為已登入 admin；不是則 throw 401 / 403。
 * 回傳 user 與 admin participant 供後續 endpoint 使用。
 */

import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { useSupabaseServer } from './supabase-server'

export interface AdminContext {
  userId: string
  participantId: string
}

export async function requireAdmin(event: H3Event): Promise<AdminContext> {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const sb = useSupabaseServer(event)
  const { data, error } = await sb
    .from('participants')
    .select('id, is_admin')
    .eq('user_id', user.id)
    .single()

  if (error || !data || data.is_admin !== true) {
    throw createError({ statusCode: 403, statusMessage: '無管理員權限' })
  }

  return { userId: user.id, participantId: data.id as string }
}
