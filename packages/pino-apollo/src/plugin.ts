// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { ApolloServerPlugin, GraphQLRequestListenerParsingDidEnd } from 'apollo-server-plugin-base'
import {
  GraphQLRequest,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextValidationDidStart,
  GraphQLRequestContextWillSendResponse
} from 'apollo-server-types'
import { GraphQLRequestListener } from 'apollo-server-plugin-base/src/index'
import { v4 } from 'uuid'
import { ApolloContextExtension, ApolloLoggingOptions } from './types'
import { Logger } from 'pino'
import {correlationManager} from '@totalsoft/correlation'

export class ApolloLoggerPlugin implements ApolloServerPlugin<ApolloContextExtension> {
  private securedMessages: boolean
  private logger: Logger

  constructor(options: ApolloLoggingOptions) {
    this.securedMessages = options.securedMessages === undefined ? true : options.securedMessages
    this.logger = options.logger
}

  async requestDidStart({
    context,
    request,
    operationName
  }: GraphQLRequestContext<ApolloContextExtension>): Promise<GraphQLRequestListener<ApolloContextExtension>> {
    
    const logger = this.logger.child({
      requestId: context.requestId ?? v4(),
      operationName: getOperationName(request, getOperationName(request, operationName))
    })

    context.logger = logger
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
      didEncounterErrors: async ({
        request,
        operationName,
        errors
      }: GraphQLRequestContextDidEncounterErrors<ApolloContextExtension>) => {
        for (const error of errors) {
          const message = `[GraphQL_Execution][Error] The server encounters errors while parsing, validating, or executing the operation < ${getOperationName(
            request,
            operationName
          )} > \r\n`
          const fullErrorMessage = `${message} ${error?.message} ${error?.stack} ${JSON.stringify(error?.extensions)}`

          if (!shouldSkipLogging(getOperationName(request, operationName))) logger.error(error, message)

          const correlationId = correlationManager.getCorrelationId() || 'Not available'

          let messageWithCorrelationId = `${fullErrorMessage} - Correlation Id: < ${correlationId} >`
          if (this.securedMessages)
            messageWithCorrelationId = `${message} For more details check Correlation Id: < ${correlationId} >`

          error.message = messageWithCorrelationId
        }
      },
      willSendResponse: async ({ operationName }: GraphQLRequestContextWillSendResponse<ApolloContextExtension>) => {
        logger.debug(
          `[GraphQL_Response] A response for the operation <${getOperationName(request, operationName)}> was sent!`
        )
      }
    }
  }
}
function shouldSkipLogging(operationName?: string | null) {
  return operationName === 'IntrospectionQuery'
}

function getOperationName(request: GraphQLRequest, operationName?: string | null) {
  return request?.operationName ?? operationName ?? 'unidentifiedOperation'
}
