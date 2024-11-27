import { recordRequestStarted, recordRequestFailed, recordRequestDuration } from './metrics'
import { MetricsContext } from './types'

function createMetricsPlugin() {
  return {
    requestDidStart(requestContext: MetricsContext) {
      const requestStartDate = Date.now()
      recordRequestStarted(requestContext)

      return {
        didEncounterErrors: async (context: MetricsContext) => {
          recordRequestFailed(context)
        },
        willSendResponse: async (context: MetricsContext) => {
          const requestEndDate = Date.now()
          recordRequestDuration(requestEndDate - requestStartDate, context)
        }
      }
    }
  }
}
export { createMetricsPlugin }
