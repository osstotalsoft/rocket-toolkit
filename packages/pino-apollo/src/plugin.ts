// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import {
  ApolloServerPlugin,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequest,
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
import { Logger } from 'pino'
import { correlationManager } from '@totalsoft/correlation'
import { GraphQLErrorExtensions } from 'graphql'

export class ApolloLoggerPlugin implements ApolloServerPlugin<ApolloContextExtension> {
  private securedMessages: boolean
  private logger: Logger

  constructor(options: ApolloLoggingOptions) {
    this.securedMessages = options.securedMessages === undefined ? true : options.securedMessages
    this.logger = options.logger
  }

  async _enrichError(error: Error, message: string, fullErrorMessage: string) {
    const correlationId = correlationManager.getCorrelationId() || 'Not available'

    let messageWithCorrelationId = `${fullErrorMessage} - Correlation Id: < ${correlationId} >`
    if (this.securedMessages) {
      messageWithCorrelationId = `${message} For more details check Correlation Id: < ${correlationId} >`
      error.stack = undefined
    }

    error.message = messageWithCorrelationId
  }

  async _logRequestError(
    error: Error,
    messagePrefix: string,
    { request, operationName }: GraphQLRequestContext<ApolloContextExtension>,
    extensions?: GraphQLErrorExtensions,
    logger = this.logger
  ) {
    const message = `${messagePrefix} < ${getOperationName(request, operationName)} > \r\n`
    const fullErrorMessage = `${message} ${error?.message} ${error?.stack} ${JSON.stringify(extensions)}`

    if (!shouldSkipLogging(getOperationName(request, operationName))) logger.error(error, message)

    this._enrichError(error, message, fullErrorMessage)
  }

  async _logError(error: Error, messagePrefix: string, logger = this.logger) {
    const message = `${messagePrefix} \r\n`
    const fullErrorMessage = `${message} ${error?.message} ${error?.stack}}`

    logger.error(error, message)

    this._enrichError(error, message, fullErrorMessage)
  }

  async requestDidStart({
    contextValue,
    request,
    operationName
  }: GraphQLRequestContext<ApolloContextExtension>): Promise<GraphQLRequestListener<ApolloContextExtension>> {
    const logger = this.logger.child({
      requestId: contextValue.requestId ?? v4(),
      operationName: getOperationName(request, getOperationName(request, operationName))
    })

    contextValue.logger = logger
    if (!shouldSkipLogging(getOperationName(request, operationName)))
      logger.info(`[REQUEST_STARTED] Request for operation name <${getOperationName(request, operationName)}> started!`)

    return {
      async parsingDidStart({
        request,
        operationName
      }: GraphQLRequestContextParsingDidStart<ApolloContextExtension>): Promise<GraphQLRequestListenerParsingDidEnd> {
        logger.debug(`[GraphQL_Parsing] The parsing of operation <${getOperationName(request, operationName)}> started!`)
        return async (err: Error | undefined) => {
          if (err) {
            logger.error(`[GraphQL_Parsing][Error] ${err}`)
          }
        }
      },
      async validationDidStart({
        request,
        operationName
      }: GraphQLRequestContextValidationDidStart<ApolloContextExtension>): Promise<void> {
        if (!shouldSkipLogging(getOperationName(request, operationName)))
          logger.debug(
            `[GraphQL_Validation] The validation of operation <${getOperationName(request, operationName)}> started!`
          )
      },
      async executionDidStart({ request, operationName }: GraphQLRequestContextExecutionDidStart<ApolloContextExtension>) {
        if (!shouldSkipLogging(getOperationName(request, operationName)))
          logger.debug(
            `[GraphQL_Execution] The execution of operation <${getOperationName(request, operationName)}> started!`
          )
      },
      didEncounterErrors: async (requestContext: GraphQLRequestContextDidEncounterErrors<ApolloContextExtension>) => {
        for (const error of requestContext.errors) {
          const isValidationError = error?.extensions?.code === 'VALIDATION_ERROR'
          if (isValidationError) return
          const message =
            '[GraphQL_Execution][Error] The server encounters errors while parsing, validating, or executing the operation'
          this._logRequestError(error, message, requestContext, error?.extensions, logger)
        }
      },
      willSendResponse: async ({ operationName }: GraphQLRequestContextWillSendResponse<ApolloContextExtension>) => {
        logger.debug(
          `[GraphQL_Response] A response for the operation <${getOperationName(request, operationName)}> was sent!`
        )
      }
    }
  }

  async unexpectedErrorProcessingRequest?({
    requestContext,
    error
  }: {
    requestContext: GraphQLRequestContext<ApolloContextExtension>
    error: Error
  }): Promise<void> {
    const message =
      '[GraphQL_Execution][Error] The server encountered errors while parsing, validating, or executing the operation'
    this._logRequestError(error, message, requestContext)
  }

  async contextCreationDidFail?({ error }: { error: Error }): Promise<void> {
    const message = '[GraphQL_CreateContext][Error] The server encountered errors while creating context \r\n'
    this._logError(error, message)
  }

  async invalidRequestWasReceived?({ error }: { error: Error }): Promise<void> {
    const message = '[GraphQL_InvalidRequest][Error] The server encountered a malformed request \r\n'
    this._logError(error, message)
  }

  async startupDidFail?({ error }: { error: Error }): Promise<void> {
    const message = '[GraphQL_Startup][Error] The server encountered errors during startup \r\n'
    this._logError(error, message)
  }
}
function shouldSkipLogging(operationName?: string | null) {
  return operationName === 'IntrospectionQuery'
}

function getOperationName(request: GraphQLRequest, operationName?: string | null) {
  return request?.operationName ?? operationName ?? 'unidentifiedOperation'
}
