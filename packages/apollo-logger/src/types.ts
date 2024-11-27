// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BaseContext } from '@apollo/server'

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
  // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
}

export interface LoggingOptions {
  context: ApolloContextExtension | any
  // An Apollo related `operationName`,
  // set based on the operation AST, so it is defined even if
  // no `request.operationName` was passed in.  It will be set to `null` for an
  // anonymous operation, or if `requestName.operationName` was passed in but
  // doesn't resolve to an operation in the document.
  // OR
  // Any string value that describes the logged action
  operationName?: string
  // If 'true', errors thrown inside Apollo Server are wrapped in a 'user friendly message'. Default is 'true'.
  securedMessages?: boolean
  // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
}

export interface Logger {
  logInfo: (message: string, code: string) => Promise<void>
  logDebug: (message: string, code: string) => Promise<void>
  logError: (message: string, code?: string, error?: any) => Promise<any>
}

export enum LoggingLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}
