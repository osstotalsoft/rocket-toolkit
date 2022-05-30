import { BaseContext } from 'apollo-server-types'

export interface Log {
  uid: string
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
  persistLogs: boolean
  // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
  persistLogsFn: (context: ApolloContextExtension) => void | Promise<void>
}

export enum LoggingLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}
