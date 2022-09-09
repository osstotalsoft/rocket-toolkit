// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export interface Logger {
  info: (...args: any[]) => void
  error: (...args: any[]) => void
}

export interface GracefulShutdownOptions {
  onShutdown?: (_: any) => Promise<void>
  timeout?: number
  terminationSignals?: string[]
  unrecoverableEvents?: string[]
  logger?: Logger
}
