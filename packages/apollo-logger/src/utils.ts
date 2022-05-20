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

export const initializeDbLogging = (context: ApolloContextExtension, operationName: string) => ({
  logInfo: (message: string, code: string, autoSave = false): Promise<void> =>
    shouldSkipLogging(operationName, LoggingLevel.INFO)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.INFO, autoSave),
  logDebug: (message: string, code: string, autoSave = false): Promise<void> =>
    shouldSkipLogging(operationName, LoggingLevel.DEBUG)
      ? new Promise(() => {})
      : logEvent(context, message, code, LoggingLevel.DEBUG, autoSave),
  logError: (message: string, code?: string, error?: any): Promise<any> =>
    shouldSkipLogging(operationName, LoggingLevel.ERROR)
      ? new Promise(() => error)
      : logDbError(context, message, code || '', LoggingLevel.ERROR, error)
})

export const saveLogs = async (context: ApolloContextExtension) => {
  const { dbInstance, logs, requestId } = context
  if (logs && dbInstance) {
    const insertLogs = map(
      ({ uid, code, message, timeStamp, loggingLevel, error }) => ({
        Uid: uid,
        RequestId: requestId || v4(),
        Code: code,
        Message: message,
        Details: error ? `${error?.message} ${error?.stack} ${JSON.stringify(error?.extensions)}` : '',
        TimeStamp: timeStamp,
        LoggingLevel: loggingLevel
      }),
      logs
    )
    await dbInstance('EventLog').insert(insertLogs)
  }
  context.logs = undefined
}

export const logEvent = async (
  context: ApolloContextExtension,
  message: string,
  code: string,
  level: LoggingLevel,
  autoSave: boolean
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
    context.logs ?? []
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

  if (autoSave) {
    await saveLogs(context)
  }
}

export const logDbError = async (
  context: ApolloContextExtension,
  message: string,
  code: string,
  level: LoggingLevel,
  error?: any
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
    context.logs ?? []
  )
  await saveLogs(context)

  return new ApolloError(messageWithLogId, code)
}
