/**
 * 將 client logger 注入為 $log，元件內可直接使用：
 *   const { $log } = useNuxtApp()
 *   $log.info({ component: 'Foo' }, 'mounted')
 */
import { clientLogger } from '#shared/utils/logger'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      log: clientLogger,
    },
  }
})
