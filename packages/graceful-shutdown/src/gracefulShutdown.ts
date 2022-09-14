// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { GracefulShutdownOptions, ManualShutdownFn } from './types'

let isShuttingDown = false
const exit = process.exit

/**
 * Register a handler that is called on shutdown. The shutdown is triggered by the monitored signals and events. 
 * 
 * @param {GracefulShutdownOptions} options Options for graceful shutdown 
 * @returns A function used to trigger a manual shutdown. 
 */
function gracefulShutdown({
  onShutdown = (_: string) => Promise.resolve(),
  timeout = 5000,
  terminationSignals = ['SIGINT', 'SIGTERM'],
  unrecoverableEvents = ['uncaughtException', 'unhandledRejection'],
  logger = console
}: GracefulShutdownOptions = {}) : ManualShutdownFn {
  async function shutDown(reason: string) {
    if (isShuttingDown) return
    isShuttingDown = true

    setTimeout(() => {
      logger.error('Timeout waiting for graceful shutdown')
      exit(1)
    }, timeout).unref()

    try {
      logger.info('Shutdown initiated. Reason: ' + reason)
      await onShutdown(reason)
      logger.info('Shutdown complete')
    } catch (e) {
      logger.error(e, 'Error during shutdown: ')
      exit(1)
    }
  }

  terminationSignals.forEach(signal => process.on(signal, shutDown))

  unrecoverableEvents.forEach(event =>
    process.on(event, (reason: string) => {
      logger.error(reason, `Received: ${event}`)
      shutDown(event)
    })
  )

  return shutDown
}

export default gracefulShutdown
