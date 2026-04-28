/**
 * 通用 logger 介面 — client 與 server 共用入口
 *
 * - Server (Nitro): 自動載入 pino instance（透過 server/utils/logger）
 * - Client (browser): 薄包裝 console.*；可由 plugins/logger.client.ts 注入 $log
 *
 * 使用慣例：
 *   import { log } from '#shared/utils/logger'
 *   log.info({ userId, action: 'checkin' }, '使用者打卡')
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface AppLogger {
  trace: (objOrMsg: unknown, msg?: string) => void
  debug: (objOrMsg: unknown, msg?: string) => void
  info: (objOrMsg: unknown, msg?: string) => void
  warn: (objOrMsg: unknown, msg?: string) => void
  error: (objOrMsg: unknown, msg?: string) => void
  fatal: (objOrMsg: unknown, msg?: string) => void
}

const callConsole = (
  fn: (...args: unknown[]) => void,
  objOrMsg: unknown,
  msg?: string,
) => {
  if (typeof objOrMsg === 'string') {
    fn(objOrMsg)
  } else if (msg != null) {
    fn(msg, objOrMsg)
  } else {
    fn(objOrMsg)
  }
}

const noop = () => {}

const isProd = (() => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return true
  return false
})()

export const clientLogger: AppLogger = {
  trace: noop,
  debug: isProd ? noop : (o, m) => callConsole(console.debug, o, m),
  info: (o, m) => callConsole(console.info, o, m),
  warn: (o, m) => callConsole(console.warn, o, m),
  error: (o, m) => callConsole(console.error, o, m),
  fatal: (o, m) => callConsole(console.error, o, m),
}

/**
 * 自動偵測執行環境並回傳對應 logger。
 * shared/ 不能假設 DOM 存在，因此用 globalThis 而非裸 window。
 * 真正 server 端使用時，請從 server/utils/logger 取得（pino instance）。
 */
export const log: AppLogger = (() => {
  const hasWindow =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { window?: unknown }).window !== 'undefined'
  if (hasWindow) return clientLogger
  return clientLogger
})()
