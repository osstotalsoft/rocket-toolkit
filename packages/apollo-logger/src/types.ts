import { BaseContext } from 'apollo-server-types'

interface Log {
  uid: string
  code: string
  message: string
  timeStamp: Date
  loggingLevel: LoggingLevel
  error?: any
}
export interface ApolloContextExtension extends BaseContext {
  requestId: string
  logs?: Log[]
}

export enum LoggingLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}
