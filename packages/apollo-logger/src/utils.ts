import { ApolloError } from 'apollo-server'
import { v4 } from 'uuid'
import { append, map } from 'ramda'
import { ApolloContextExtension, LoggingLevel } from './types'
import '@colors/colors'

const { APOLLO_LOGGING_LEVEL } = process.env

export const shouldSkipLogging = (operationName: string, logLevel: LoggingLevel) => {
  if (operationName === 'IntrospectionQuery') return false

  switch (logLevel) {
    case LoggingLevel.INFO:
      return APOLLO_LOGGING_LEVEL === LoggingLevel.ERROR
    case LoggingLevel.DEBUG:
      return APOLLO_LOGGING_LEVEL === LoggingLevel.INFO || APOLLO_LOGGING_LEVEL === LoggingLevel.ERROR
    default:
      return false
  }
}

export const initializeDbLogging = (
  context: ApolloContextExtension,
  operationName: string,
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
) => ({
  logInfo: (message: string, code: string, persistLogs = false): Promise<void> =>
    shouldSkipLogging(operationName, LoggingLevel.INFO)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.INFO, persistLogs, persistLogsFn),
  logDebug: (message: string, code: string, persistLogs = false): Promise<void> =>
    shouldSkipLogging(operationName, LoggingLevel.DEBUG)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.DEBUG, persistLogs, persistLogsFn),
  logError: (message: string, code?: string, error?: any): Promise<any> =>
    shouldSkipLogging(operationName, LoggingLevel.ERROR)
      ? new Promise(() => error)
      : logDbError(context, message, code || '', LoggingLevel.ERROR, error, persistLogsFn)
})

// export const saveLogs = async (context: ApolloContextExtension) => {
//   const { dbInstance, logs, requestId } = context
//   if (logs && dbInstance) {
//     const insertLogs = map(
//       ({ uid, code, message, timeStamp, loggingLevel, error }) => ({
//         Uid: uid,
//         RequestId: requestId || v4(),
//         Code: code,
//         Message: message,
//         Details: error ? `${error?.message} ${error?.stack} ${JSON.stringify(error?.extensions)}` : '',
//         TimeStamp: timeStamp,
//         LoggingLevel: loggingLevel
//       }),
//       logs
//     )
//     await dbInstance('EventLog').insert(insertLogs)
//   }
//   context.logs = undefined
// }

export const logEvent = async (
  context: ApolloContextExtension,
  message: string,
  code: string,
  level: LoggingLevel,
  persistLogs = false,
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
) => {
  const logId = v4()
  context.logs = append(
    {
      uid: logId,
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

  if (persistLogs) {
    if (!persistLogsFn)
      throw new ApolloError(
        '"persistLogs" variable was set to `True`, to persist the logs, it is mandatory to also provide the "persistLogsFn"!',
        '[GraphQL_Error]'
      )
    await persistLogsFn(context)
  }
  context.logs = []
}

export const logDbError = async (
  context: ApolloContextExtension,
  message: string,
  code: string,
  level: LoggingLevel,
  error?: any,
  persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
) => {
  console.error(`${code} ${message} ${error?.message} ${error?.stack} ${JSON.stringify(error?.extensions)}`.red)

  const logId = v4()
  const messageWithLogId = `${message} For more details check Log Id: < ${logId} > Request Id: < ${context.requestId} >`

  context.logs = append(
    {
      uid: logId,
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
