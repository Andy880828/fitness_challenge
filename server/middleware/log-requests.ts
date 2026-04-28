import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const start = Date.now()
  const { method, url } = event.node.req

  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    const status = event.node.res.statusCode
    logger.info(
      { method, url, status, durationMs: duration },
      `${method} ${url} → ${status} (${duration}ms)`,
    )
  })
})
