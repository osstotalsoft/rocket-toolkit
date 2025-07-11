// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import {
  ApolloServerPlugin,
  GraphQLRequest,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
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

  private _enrichError(error: Error, message: string, fullErrorMessage: string) {
    const correlationId = correlationManager.getCorrelationId() || 'Not available'

    let messageWithCorrelationId = `${fullErrorMessage} - Correlation Id: < ${correlationId} >`
    if (this.securedMessages) {
      messageWithCorrelationId = `${message} For more details check Correlation Id: < ${correlationId} >`
      error.stack = undefined
    }

    error.message = messageWithCorrelationId
  }

  private _logRequestError(
    error: Error,
    messagePrefix: string,
    { request, operationName, contextValue }: GraphQLRequestContext<ApolloContextExtension>,
    extensions?: GraphQLErrorExtensions,
    logger = this.logger,
    skipEnrichment = false
  ) {
    const opName = contextValue.operationName || getOperationName(request, operationName)
    const message = `${messagePrefix} < ${opName} > \r\n`
    const fullErrorMessage = `${message} ${error?.message} ${error?.stack} ${JSON.stringify(extensions)}`

    if (!shouldSkipLogging(opName)) logger.error(error, message)

    if (skipEnrichment) {
      if (this.securedMessages) error.stack = undefined
      return
    }
    this._enrichError(error, message, fullErrorMessage)
  }

  private _logError(error: Error, messagePrefix: string, logger = this.logger) {
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
      requestId: contextValue.requestId ?? v4()
    })

    contextValue.logger = logger
    contextValue.operationName = getOperationName(request, operationName)

    if (!shouldSkipLogging(contextValue.operationName))
      logger.info(`[REQUEST_STARTED] Request for operation name <${contextValue.operationName}> started!`)

    return {
      async didResolveOperation({ document, contextValue }) {
        // Update operation name from parsed document if available
        if (document?.definitions?.[0]?.kind === 'OperationDefinition') {
          const resolvedName = document.definitions[0].name?.value
          if (resolvedName) {
            contextValue.operationName = resolvedName
          }
        }
        logger.debug(`[GraphQL_Validation] Validation successful for operation <${contextValue.operationName}>!`)
      },
      async executionDidStart({ contextValue }) {
        if (!shouldSkipLogging(contextValue.operationName))
          logger.debug(`[GraphQL_Execution] Execution for operation <${contextValue.operationName}> started!`)
      },
      didEncounterErrors: async (requestContext: GraphQLRequestContextDidEncounterErrors<ApolloContextExtension>) => {
        for (const error of requestContext.errors) {
          const shouldSkipEnrichment = error?.extensions?.code === 'BUSINESS_ERROR'
          const message =
            '[GraphQL_Execution][Error] The server encounters errors while parsing, validating, or executing the operation'
          this._logRequestError(
            error,
            message,
            requestContext,
            error?.extensions,
            logger,
            shouldSkipEnrichment
          )
        }
      },
      willSendResponse: async ({ contextValue }: GraphQLRequestContextWillSendResponse<ApolloContextExtension>) => {
        logger.debug(`[GraphQL_Response] A response for the operation <${contextValue.operationName}> was sent!`)
      }
    }
  }

  private _logServerError(error: Error, message: string) {
    this._logError(error, message)
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
    this._logServerError(error, '[GraphQL_CreateContext][Error] The server encountered errors while creating context \r\n')
  }

  async invalidRequestWasReceived?({ error }: { error: Error }): Promise<void> {
    this._logServerError(error, '[GraphQL_InvalidRequest][Error] The server encountered a malformed request \r\n')
  }

  async startupDidFail?({ error }: { error: Error }): Promise<void> {
    this._logServerError(error, '[GraphQL_Startup][Error] The server encountered errors during startup \r\n')
  }
}

function shouldSkipLogging(operationName?: string | null) {
  return operationName === 'IntrospectionQuery'
}

function getOperationName(request: GraphQLRequest, operationName?: string | null): string {
  // Return the most direct operation name sources first
  if (operationName) return operationName
  if (request?.operationName) return request.operationName

  // Try to extract from query string for anonymous operations
  const query = request?.query
  if (typeof query === 'string') {
    const namedMatch = query.match(/(mutation|query|subscription)\s+([a-zA-Z0-9_]+)/)
    if (namedMatch?.[2]) return namedMatch[2]
    
    const fieldMatch = query.match(/\{\s*([a-zA-Z0-9_]+)/)
    if (fieldMatch?.[1]) return fieldMatch[1]
  }

  return 'unidentifiedOperation'
}
