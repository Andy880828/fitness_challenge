/**
 * Supabase chain mock 工廠
 *
 * Supabase query builder（.from().select().eq().single()）長度可能 5+ 層，
 * 每個 .method() 都要回傳一個 thenable + builder。手寫太繁複；
 * 此 helper 用 Proxy 攔截任何 method call 都回傳同一個 builder 物件，
 * await 時 resolve 給 fixture data。
 *
 * 用法：
 *   const supabase = createMockSupabase({ data: [{ id: 1 }], error: null })
 *   vi.stubGlobal('useSupabaseClient', () => supabase)
 *
 *   // 多階段：upsert 與 select 不同 fixture
 *   const supabase = createMockSupabase({
 *     'checkins.upsert': { data: rowFixture, error: null },
 *     'participants.select': { data: [pFixture], error: null },
 *   })
 *
 * 限制：不模擬真實 Supabase 行為（RLS、轉型）；只回 fixture。
 */

import { vi, type Mock } from 'vitest'

export interface SupabaseResponse<T = unknown> {
  data: T | null
  error: { message: string } | null
}

export type ChainResolver = SupabaseResponse | ((args: { table: string; ops: string[] }) => SupabaseResponse)

export interface MockSupabase {
  from: Mock
  auth: {
    signInWithPassword: Mock
    signOut: Mock
    getUser: Mock
    admin: { createUser: Mock; deleteUser: Mock }
  }
  storage: {
    from: Mock
  }
  /** 取得最近一次 builder 接收到的 ops，便於測試 assert call shape */
  lastCalls: Array<{ table: string; ops: Array<{ method: string; args: unknown[] }> }>
  /** 等同 lastCalls 的別名 */
  reset: () => void
}

const isResponse = (v: unknown): v is SupabaseResponse =>
  !!v && typeof v === 'object' && 'data' in (v as object) && 'error' in (v as object)

/**
 * 建立可鏈式呼叫的 Supabase mock client。
 *
 * @param resolver 直接給 SupabaseResponse 套用所有 chain，
 *                 或給函式根據 (table, ops) 動態回應，
 *                 或給 Map 用 'table.method' 字串對應到不同 response。
 */
export const createMockSupabase = (
  resolver: SupabaseResponse | Record<string, SupabaseResponse> | ChainResolver,
): MockSupabase => {
  const lastCalls: MockSupabase['lastCalls'] = []

  const makeBuilder = (table: string) => {
    const ops: Array<{ method: string; args: unknown[] }> = []
    const callRecord = { table, ops }
    lastCalls.push(callRecord)

    const resolveResponse = (terminal: string): SupabaseResponse => {
      if (typeof resolver === 'function') {
        return resolver({ table, ops: ops.map(o => o.method) })
      }
      if (isResponse(resolver)) return resolver

      const opsBare = ops.map(o => o.method)
      const lastOp = opsBare[opsBare.length - 1] ?? terminal
      const keyed =
        (resolver as Record<string, SupabaseResponse>)[`${table}.${lastOp}`] ??
        (resolver as Record<string, SupabaseResponse>)[`${table}.${terminal}`] ??
        (resolver as Record<string, SupabaseResponse>)[table]
      return keyed ?? { data: null, error: { message: `no fixture for ${table}.${terminal}` } }
    }

    const builder: Record<string, unknown> = {}
    const handler: ProxyHandler<typeof builder> = {
      get(target, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: (v: SupabaseResponse) => unknown) =>
            Promise.resolve(resolveResponse('select')).then(onFulfilled)
        }
        return (...args: unknown[]) => {
          ops.push({ method: prop, args })
          if (prop === 'single' || prop === 'maybeSingle') {
            return Promise.resolve(resolveResponse(prop))
          }
          return proxy
        }
      },
    }
    const proxy = new Proxy(builder, handler)
    return proxy
  }

  const supabase: MockSupabase = {
    from: vi.fn((table: string) => makeBuilder(table)),
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      admin: { createUser: vi.fn(), deleteUser: vi.fn() },
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    lastCalls,
    reset: () => {
      lastCalls.length = 0
    },
  }

  return supabase
}
