import { ApolloServerPlugin, GraphQLRequestListenerParsingDidEnd } from 'apollo-server-plugin-base'
import {
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
import { initializeDbLogging } from './utils'

export class ApolloLoggerPlugin implements ApolloServerPlugin<ApolloContextExtension> {
  private persistLogsFn: (context: ApolloContextExtension) => void | Promise<void>

  constructor(options: ApolloLoggingOptions) {
    this.persistLogsFn = options.persistLogsFn
  }

  async requestDidStart(
    requestContext: GraphQLRequestContext<ApolloContextExtension>
  ): Promise<GraphQLRequestListener<ApolloContextExtension>> {
    const { logInfo, logDebug, logError } = initializeDbLogging(
      requestContext?.context,
      requestContext?.operationName || 'unidentifiedOperation'
    )
    requestContext.context.requestId = requestContext.context.requestId || v4()

    logInfo(`Request for operation name <${requestContext.operationName}> started!`, '[REQUEST_STARTED]')
    return {
      async parsingDidStart({
        operationName
      }: GraphQLRequestContextParsingDidStart<ApolloContextExtension>): Promise<GraphQLRequestListenerParsingDidEnd> {
        logDebug(`The parsing of operation <${operationName}> started!`, '[GraphQL_Parsing]')
        return async (err: Error | undefined) => {
          if (err) {
            await logError(`[GraphQL_Parsing][Error] ${err}`)
          }
        }
      },
      async validationDidStart({
        operationName
      }: GraphQLRequestContextValidationDidStart<ApolloContextExtension>): Promise<void> {
        logDebug(`The validation of operation <${operationName}> started!`, '[GraphQL_Validation]')
      },
      async executionDidStart({ operationName }: GraphQLRequestContextExecutionDidStart<ApolloContextExtension>) {
        logDebug(`The execution of operation <${operationName}> started!`, '[GraphQL_Execution]')
      },
      didEncounterErrors: async ({
        operationName,
        errors
      }: GraphQLRequestContextDidEncounterErrors<ApolloContextExtension>) => {
        for (const error of errors) {
          const templateError = await logError(
            `The server encounters errors while parsing, validating, or executing the operation < ${operationName} > \r\n`,
            '[GraphQL_Execution][Error]',
            error
          )
          error.message = templateError?.message
        }
      },
      willSendResponse: async ({
        operationName,
        context
      }: GraphQLRequestContextWillSendResponse<ApolloContextExtension>) => {
        logDebug(`A response for the operation <${operationName}> was sent!`, '[GraphQL_Response]')
        await this.persistLogsFn(context)
        context.logs = []
      }
    }
  }
}
