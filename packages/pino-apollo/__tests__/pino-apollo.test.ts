import { ApolloContextExtension} from '../src/types'
import { ApolloLoggerPlugin } from '../src'
import { Logger} from 'pino'

describe('logging plugin tests:', () => {
  function getFakeLogger() : Logger {
    const childFakeLogger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
    const fakeLogger = {
      child: jest.fn(() => childFakeLogger)
    }

    return <any>fakeLogger
  }

  it('log request started', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'MyOperation'}
    const logger = getFakeLogger()

    const plugin = new ApolloLoggerPlugin(<any>{logger})
    //act
    await plugin.requestDidStart(<any>{context, request})

    //assert
    expect(context?.logger?.info).toBeCalledWith(expect.stringContaining('[REQUEST_STARTED]'))
  }) 

  it('skip introspection query', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'IntrospectionQuery'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    await plugin.requestDidStart(<any>{context, request})

    //assert
    expect(context?.logger?.info).toBeCalledTimes(0)
  })

  it('log parse started', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'MyOperation'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    const obj = await plugin.requestDidStart(<any>{context, request})
    await obj.parsingDidStart?.(<any>{})

    //assert
    expect(context?.logger?.debug).toBeCalledWith(expect.stringContaining('[GraphQL_Parsing]'))
  }) 

  it('log validation started', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'MyOperation'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    const obj = await plugin.requestDidStart(<any>{context, request})
    await obj.validationDidStart?.(<any>{})

    //assert
    expect(context?.logger?.debug).toBeCalledWith(expect.stringContaining('[GraphQL_Validation]'))
  })   

  it('log execution started', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'MyOperation'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    const obj = await plugin.requestDidStart(<any>{context, request})
    await obj.executionDidStart?.(<any>{})

    //assert
    expect(context?.logger?.debug).toBeCalledWith(expect.stringContaining('[GraphQL_Execution]'))
  })  

  it('log errors secured', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const errors = [new Error('BAU')]
    const request = {operationName: 'MyOperation'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    const obj = await plugin.requestDidStart(<any>{context, request})
    await obj.didEncounterErrors?.(<any>{request, errors})

    //assert
    expect(context?.logger?.error).toBeCalledWith(errors[0], expect.stringContaining('[GraphQL_Execution][Error]'))
    expect(errors[0].message).not.toContain('BAU')
  }) 

  it('log errors unsecured', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const request = {operationName: 'MyOperation'}
    const errors = [new Error('BAU')]

    const logger = getFakeLogger()

    const plugin = new ApolloLoggerPlugin({logger, securedMessages: false})
    //act
    const obj = await plugin.requestDidStart(<any>{context, request})
    await obj.didEncounterErrors?.(<any>{request, errors})

    //assert
    expect(context?.logger?.error).toBeCalledWith(errors[0], expect.stringContaining('[GraphQL_Execution][Error]'))
    expect(errors[0].message).toContain('BAU')
  }) 

  it('log sending response', async () => {
    //arrange
    const context: ApolloContextExtension = { requestId: 'requestId'}
    const logger = getFakeLogger()
    const plugin = new ApolloLoggerPlugin({logger})

    //act
    const obj = await plugin.requestDidStart(<any>{context, request: {}, operationName: 'MyOperation'})
    await obj.willSendResponse?.(<any>{})

    //assert
    expect(context?.logger?.debug).toBeCalledWith(expect.stringContaining('[GraphQL_Response]'))
  })
})
