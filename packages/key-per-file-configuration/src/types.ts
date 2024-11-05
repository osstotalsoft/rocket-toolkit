// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export interface Logger {
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
}

export interface Options {
  configPath?: string
  logger?: Logger
}

export interface ConfigWatcher {
  close: () => Promise<void> | undefined
}
