// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export type ManualShutdownFn = (reason: string) => Promise<void>

export interface Logger {
  /**
   * Log using information severity
   * @param args - data to be logged
   */
  info: (...args: any[]) => void

  /**
   *  Log using error severity
   *  @param args - data to be logged
   */
  error: (...args: any[]) => void
}

/**
 * Options for configuring graceful shutdown.
 */
export interface GracefulShutdownOptions {
  /**
   * Set an async handler to be called at shutdown
   * @param {string} reason - The event that triggered the shutdown
   */
  onShutdown?: (reason: any) => Promise<void>

  /**
   * Set a timeout in milliseconds to wait for graceful shutdown.
   */
  timeout?: number

  /**
   * A list of signals that trigger shutdown (eg. SIGINT, SIGTERM).
   */
  terminationSignals?: string[]

  /**
   *  A list of process events that trigger shutdown (eg. `unrecoverableException`)
   */
  unrecoverableEvents?: string[]

  /**
   *  A logger for shutdown events
   */
  logger?: Logger
}
