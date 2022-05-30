import { shouldSkipLogging, logEvent, logDbError } from '../src/utils'
import { ApolloError } from 'apollo-server'
import { ApolloContextExtension, Log, LoggingLevel } from '../src/types'

describe('logging plugin tests:', () => {
  it('should skip logging for introspection:', async () => {
    const res = shouldSkipLogging('IntrospectionQuery', LoggingLevel.DEBUG)

    expect(res).toBe(false)
  })

  it('should not skip logging for info logging level:', async () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'INFO' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.INFO)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for info when logging level is set to DEBUG:', async () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'DEBUG' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.INFO)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for debug logging level:', async () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'DEBUG' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.DEBUG)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for ERROR logging level:', async () => {
    //Arrange
    process.env = { APOLLO_LOGGING_LEVEL: 'ERROR' }

    //Act
    const res = shouldSkipLogging('OperationName', LoggingLevel.ERROR)

    ///Assert
    expect(res).toBe(false)
  })

  it('should not skip logging for ERROR when logging level is set to DEBUG:', async () => {
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

  it('logDbError should clears logs from context, call insert logs and return new ApolloError:', async () => {
    //arrange
    const message = 'Error log message'
    const code = 'Error_Message_Code'
    const errorMessage = 'ErrorMessage'

    const context: ApolloContextExtension = { requestId: 'requestId', logs: [] }

    global.console = { ...global.console, error: jest.fn(), log: jest.fn() }

    //act
    const res = await logDbError(context, message, code, LoggingLevel.ERROR, new Error(errorMessage), jest.fn())

    //assert
    expect(context.logs).toStrictEqual([] as Log[])
    expect(console.error).toBeCalled()
    expect(res).toBeInstanceOf(ApolloError)
  })
})
