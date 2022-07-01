// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export interface Options {
  configPath?: string
}

export interface ConfigWatcher{
  close: () => Promise<void>
}