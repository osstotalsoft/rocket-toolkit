import { shouldSkipLogging, logEvent, logDbError, initializeLogger } from '../src/utils'
import { ApolloError } from 'apollo-server'
import { ApolloContextExtension, Log, LoggingLevel } from '../src/types'

describe('logging plugin tests:', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('initializedDbLogging returns 3 functions', () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }

    //act
    const result = initializeLogger(context, 'operationName')

    //assert
    expect(result?.logDebug).toBeDefined()
    expect(result?.logError).toBeDefined()
    expect(result?.logInfo).toBeDefined()
  })

  it('logDebug with no persist shows message at the console', () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    global.console = { ...global.console, log: jest.fn() }

    //act
    const { logDebug } = initializeLogger(context, 'operationName')
    logDebug('Test message', 'code', false)

    //assert
    expect(global.console.log).toBeCalledTimes(1)
    expect(context.logs.length).toStrictEqual(1)
  })

  it('logInfo with no persist shows message at the console', () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    global.console = { ...global.console, log: jest.fn() }

    //act
    const { logInfo } = initializeLogger(context, 'operationName')
    logInfo('Test message', 'code', false)

    //assert
    expect(global.console.log).toBeCalledTimes(1)
    expect(context.logs.length).toStrictEqual(1)
  })

  it('logError shows message at the console and return wrapped error message', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    global.console = { ...global.console, error: jest.fn() }

    //act
    const { logError } = initializeLogger(context, 'operationName', true)
    const result = await logError('Test message', 'code', new Error('Error message'))

    //assert
    expect(global.console.error).toBeCalledTimes(1)
    expect(context.logs.length).toStrictEqual(0)
    expect(result).toBeInstanceOf(ApolloError)
    expect(result.message.includes('Error message')).toBeFalsy()
  })

  it('logError shows message at the console and return raw error message', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    global.console = { ...global.console, error: jest.fn() }

    //act
    const { logError } = initializeLogger(context, 'operationName', false)
    const result = await logError('Test message', 'code', new Error('Error message'))

    //assert
    expect(global.console.error).toBeCalledTimes(1)
    expect(context.logs.length).toStrictEqual(0)
    expect(result).toBeInstanceOf(ApolloError)
    expect(result.message).toContain('Error message')
  })

  it('should skip logging for introspection:', () => {
    const res = shouldSkipLogging('IntrospectionQuery', LoggingLevel.DEBUG)

    expect(res).toBe(true)
  })

  it('should skip logError for introspection:', () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }

    //act
    const { logError } = initializeLogger(context, 'IntrospectionQuery')
    const error = new Error('Error message')
    const result = logError('Test message', 'code', error)

    //assert
    expect(result).resolves.toStrictEqual(error)
  })

  it('should not skip logging for info logging level:', () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'INFO' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.INFO)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for info when logging level is set to DEBUG:', () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'DEBUG' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.INFO)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for debug logging level:', () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'DEBUG' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.DEBUG)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for ERROR logging level:', () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'ERROR' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.ERROR)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for ERROR when logging level is set to DEBUG:', () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'DEBUG' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.ERROR)

    ///Assert
    expect(res).toBe(false)
  })

  it('logEvent should append the new log to the context:', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    const message = 'Log message'
    const code = 'Message_Code'

    global.console = { ...global.console, log: jest.fn() }

    //act
    await logEvent(context, message, code, LoggingLevel.INFO)
    await logEvent(context, message, code, LoggingLevel.DEBUG)

    //assert
    expect(context.logs[0].message).toBe(message)
    expect(context.logs[0].code).toBe(code)
    expect(context.logs[0].loggingLevel).toBe(LoggingLevel.INFO)
    expect(context.logs[1].message).toBe(message)
    expect(context.logs[1].code).toBe(code)
    expect(context.logs[1].loggingLevel).toBe(LoggingLevel.DEBUG)
  })

  it('logEvent throws an error if persistLogsFn was not sent:', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    const message = 'Log message'
    const code = 'Message_Code'

    global.console = { ...global.console, log: jest.fn() }
    const persistLogsFn = jest.fn((_ctx: ApolloContextExtension) => {})

    //act
    await logEvent(context, message, code, LoggingLevel.INFO, true, persistLogsFn)

    //assert
    expect(persistLogsFn).toBeCalledTimes(1)
    expect(context.logs).toStrictEqual([])
  })

  it('persistLogsFn gets called and logs are cleared:', async () => {
    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }
    const message = 'Log message'
    const code = 'Message_Code'

    global.console = { ...global.console, log: jest.fn() }

    const testLogEvent = async () => await logEvent(context, message, code, LoggingLevel.INFO, true)
    expect(testLogEvent).rejects.toThrowError(
      '"persistLogs" variable was set to `True`, to persist the logs, it is mandatory to also provide the "persistLogsFn"!'
    )
  })

  it('logDbError should clear logs from context, call insert logs and return new ApolloError:', async () => {
    //arrange
    const message = 'Error log message'
    const code = 'Error_Message_Code'
    const errorMessage = 'ErrorMessage'

    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }

    global.console = { ...global.console, error: jest.fn(), log: jest.fn() }

    //act
    const res = await logDbError(context, message, code, LoggingLevel.ERROR, new Error(errorMessage), false, jest.fn())

    //assert
    expect(context.logs).toStrictEqual([] as Log[])
    expect(console.error).toBeCalled()
    expect(res).toBeInstanceOf(ApolloError)
  })

  it('logError should return new ApolloError with wrapped error message:', async () => {
    //arrange
    const message = 'Error log message'
    const code = 'Error_Message_Code'
    const errorMessage = 'ErrorMessage'

    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }

    global.console = { ...global.console, error: jest.fn(), log: jest.fn() }
    const persistFn = jest.fn()
    //act
    const { logError } = initializeLogger(context, 'operationName', true, persistFn)
    const res = await logError(message, code, new Error(errorMessage))

    //assert
    expect(console.error).toBeCalled()
    expect(persistFn).toBeCalled()
    expect(res).toBeInstanceOf(ApolloError)
    expect(res.message).toContain('For more details check Log Id:')
    expect(res.message.includes('Error message')).toBeFalsy()
  })
})
