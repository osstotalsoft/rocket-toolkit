// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BaseContext } from 'apollo-server-types'

export interface Log {
  uid: string
  requestId: string
  code: string
  message: string
  timeStamp: Date
  loggingLevel: LoggingLevel
  error?: any
}

export interface ApolloContextExtension extends BaseContext {
  requestId: string
  logs: Log[]
}

export interface ApolloLoggingOptions {
  // If 'true', errors thrown inside Apollo Server are wrapped in a 'user friendly message'. Default is 'true'.
  securedMessages?: boolean
  // If tue, all logs created inside the plugin will be persisted.
  persistLogs: boolean
  // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
  persistLogsFn: (context: ApolloContextExtension) => void | Promise<void>
}

export interface Logger {
  logInfo: (message: string, code: string, persistLogs?: boolean) => Promise<void>
  logDebug: (message: string, code: string, persistLogs?: boolean) => Promise<void>
  logError: (message: string, code?: string, error?: any) => Promise<any>
}

export enum LoggingLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}
