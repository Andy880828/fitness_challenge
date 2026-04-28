import { describe, it, expect, vi } from 'vitest'
import { clientLogger } from '#shared/utils/logger'

describe('utils/logger · clientLogger', () => {
  it('info 呼叫 console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    clientLogger.info('hello')
    expect(spy).toHaveBeenCalledWith('hello')
    spy.mockRestore()
  })

  it('warn 接收 object + 訊息', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    clientLogger.warn({ userId: 'u1' }, '異常')
    expect(spy).toHaveBeenCalledWith('異常', { userId: 'u1' })
    spy.mockRestore()
  })

  it('error 接收純 object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    clientLogger.error({ err: 'boom' })
    expect(spy).toHaveBeenCalledWith({ err: 'boom' })
    spy.mockRestore()
  })

  it('trace 為 noop（client 不輸出 trace）', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    clientLogger.trace('should not appear')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
