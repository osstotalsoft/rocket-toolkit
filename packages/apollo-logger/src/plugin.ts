// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import {
  ApolloServerPlugin,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextValidationDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener
} from '@apollo/server'
import { v4 } from 'uuid'
import { ApolloContextExtension, ApolloLoggingOptions } from './types'
import { initializeLogger } from './utils'

export class ApolloLoggerPlugin implements ApolloServerPlugin<ApolloContextExtension> {
  private securedMessages: boolean
  private persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>

  constructor(options: ApolloLoggingOptions) {
    this.securedMessages = options.securedMessages === undefined ? true : options.securedMessages
    this.persistLogsFn = options.persistLogsFn
  }

  async requestDidStart({
    contextValue,
    request,
    operationName
  }: GraphQLRequestContext<ApolloContextExtension>): Promise<GraphQLRequestListener<ApolloContextExtension>> {
    const { logInfo, logDebug, logError } = initializeLogger({
      context: contextValue,
      operationName: request.operationName ?? operationName ?? 'unidentifiedOperation',
      securedMessages: this.securedMessages
    })
    contextValue.requestId = contextValue.requestId ?? v4()

    logInfo(`Request for operation name <${request.operationName ?? operationName}> started!`, '[REQUEST_STARTED]')
    return {
      async parsingDidStart({
        request,
        operationName
      }: GraphQLRequestContextParsingDidStart<ApolloContextExtension>): Promise<GraphQLRequestListenerParsingDidEnd> {
        logDebug(`The parsing of operation <${request?.operationName ?? operationName}> started!`, '[GraphQL_Parsing]')
        return async (err: Error | undefined) => {
          if (err) {
            await logError(`[GraphQL_Parsing][Error] ${err}`)
          }
        }
      },
      async validationDidStart({
        request,
        operationName
      }: GraphQLRequestContextValidationDidStart<ApolloContextExtension>): Promise<void> {
        logDebug(`The validation of operation <${request?.operationName ?? operationName}> started!`, '[GraphQL_Validation]')
      },
      async executionDidStart({ request, operationName }: GraphQLRequestContextExecutionDidStart<ApolloContextExtension>) {
        logDebug(`The execution of operation <${request?.operationName ?? operationName}> started!`, '[GraphQL_Execution]')
      },
      didEncounterErrors: async ({
        request,
        operationName,
        errors
      }: GraphQLRequestContextDidEncounterErrors<ApolloContextExtension>) => {
        for (const error of errors) {
          const templateError = await logError(
            `The server encounters errors while parsing, validating, or executing the operation < ${
              request?.operationName ?? operationName
            } > \r\n`,
            '[GraphQL_Execution][Error]',
            error
          )
          error.message = templateError?.message
        }
      },
      willSendResponse: async ({
        operationName,
        contextValue
      }: GraphQLRequestContextWillSendResponse<ApolloContextExtension>) => {
        logDebug(`A response for the operation <${operationName}> was sent!`, '[GraphQL_Response]')
        if (this.persistLogsFn) {
          await this.persistLogsFn(contextValue)
          contextValue.logs = []
        }
      }
    }
  }
}
