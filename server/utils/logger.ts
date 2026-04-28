/**
 * Server-side logger — pino + pino-roll (30 天輪替)
 * - 開發環境：pino-pretty 輸出到 stdout
 * - production 本地：pino-roll 寫入 logs/app-YYYY-MM-DD.log，保留 30 天
 * - Vercel serverless：直接 stdout，由平台收集（無持久檔案系統）
 */

import pino, { type Logger } from 'pino'

const isDev = process.env.NODE_ENV !== 'production'
const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV
const logLevel = process.env.NUXT_LOG_LEVEL ?? (isDev ? 'debug' : 'info')
const retentionDays = Number(process.env.NUXT_LOG_RETENTION_DAYS ?? 30)

const buildTransport = () => {
  if (isVercel) return undefined
  if (isDev) {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  }
  return {
    target: 'pino-roll',
    options: {
      file: 'logs/app.log',
      frequency: 'daily',
      mkdir: true,
      size: '20m',
      limit: { count: retentionDays },
      dateFormat: 'yyyy-MM-dd',
      extension: '.log',
    },
  }
}

export const logger: Logger = pino({
  level: logLevel,
  base: { service: 'fitness-challenge' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'pin',
      '*.password',
      '*.pin',
      '*.access_token',
      '*.refresh_token',
      'headers.authorization',
      'headers.cookie',
    ],
    remove: true,
  },
  transport: buildTransport(),
})

export const childLogger = (bindings: Record<string, unknown>): Logger =>
  logger.child(bindings)
