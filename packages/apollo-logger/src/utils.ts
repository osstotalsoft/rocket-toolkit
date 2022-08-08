// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { ApolloError } from 'apollo-server'
import { v4 } from 'uuid'
import { append } from 'ramda'
import { ApolloContextExtension, LoggingLevel, Logger, LoggingOptions } from './types'
import '@colors/colors'

export const shouldSkipLogging = (logLevel: LoggingLevel, operationName?: string) => {
  if (operationName === 'IntrospectionQuery') return true

  const { APOLLO_LOGGING_LEVEL } = process.env
  switch (logLevel) {
    case LoggingLevel.INFO:
      return APOLLO_LOGGING_LEVEL === LoggingLevel.ERROR
    case LoggingLevel.DEBUG:
      return APOLLO_LOGGING_LEVEL === LoggingLevel.INFO || APOLLO_LOGGING_LEVEL === LoggingLevel.ERROR
    default:
      return false
  }
}

export const initializeLogger = ({ context, operationName, persistLogsFn, securedMessages }: LoggingOptions): Logger => ({
  logInfo: (message: string, code: string): Promise<void> =>
    shouldSkipLogging(LoggingLevel.INFO, operationName)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.INFO, persistLogsFn),
  logDebug: (message: string, code: string): Promise<void> =>
    shouldSkipLogging(LoggingLevel.DEBUG, operationName)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.DEBUG, persistLogsFn),
  logError: (message: string, code?: string, error?: any, secureMessage?: boolean): Promise<any> =>
    shouldSkipLogging(LoggingLevel.ERROR, operationName)
      ? new Promise(() => error)
      : logDbError(
          context,
          message,
          code,
          LoggingLevel.ERROR,
          error,
          secureMessage === undefined ? securedMessages : secureMessage,
          persistLogsFn
        )
})

export const logEvent = async (
  context: ApolloContextExtension,
  message: string,
  code: string,
  level: LoggingLevel,
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
) => {
  const logId = v4()
  context.logs = append(
    {
      uid: logId,
      requestId: context.requestId,
      code,
      message,
      timeStamp: new Date(),
      loggingLevel: level
    },
    context.logs
  )

  switch (level) {
    case LoggingLevel.INFO: {
      console.log(`${code} ${message}`.green)
      break
    }
    case LoggingLevel.DEBUG: {
      console.log(`${code} ${message}`.blue)
      break
    }
  }

  if (persistLogsFn) {
    await persistLogsFn(context)
    context.logs = []
  }
}

export const logDbError = async (
  context: ApolloContextExtension,
  message: string,
  code: string | undefined = '',
  level: LoggingLevel,
  error?: any,
  securedMessage: boolean | undefined = true,
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
) => {
  const fullErrorMessage = `${code} ${message} ${error?.message} ${error?.stack} ${JSON.stringify(error?.extensions)}`
  console.error(fullErrorMessage.red)

  const logId = v4()
  let messageWithLogId = `${fullErrorMessage} - Log Id: < ${logId} > Request Id: < ${context.requestId} >`
  if (securedMessage)
    messageWithLogId = `${message} For more details check Log Id: < ${logId} > Request Id: < ${context.requestId} >`

  context.logs = append(
    {
      uid: logId,
      requestId: context.requestId,
      code,
      message,
      timeStamp: new Date(),
      loggingLevel: level,
      error
    },
    context.logs
  )
  if (persistLogsFn) await persistLogsFn(context)

  context.logs = []

  return new ApolloError(messageWithLogId, code)
}
