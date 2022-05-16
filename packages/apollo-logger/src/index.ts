import { ApolloServerPlugin, GraphQLRequestListenerParsingDidEnd } from 'apollo-server-plugin-base'
import { ApolloError } from 'apollo-server'

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
import { MyApolloContext } from './types'

const initializeDbLogging = (_context: MyApolloContext, _operationName: any) => ({
  logInfo: (_message: string, _code: string, _autoSave = false) => {}, //shouldSkipLogging(operationName, loggingLevels.INFO) && logEvent(context, message, code, loggingLevels.INFO, null, autoSave),
  logDebug: (_message: string, _code: string, _autoSave = false) => {}, // shouldSkipLogging(operationName, loggingLevels.DEBUG) && logEvent(context, message, code, loggingLevels.DEBUG, null, autoSave),
  logError: (message: string, code: string | undefined = undefined, _error: any = {}) => new ApolloError(message, code) // shouldSkipLogging(operationName, loggingLevels.ERROR) && logDbError(context, message, code, loggingLevels.ERROR, error)
})

export const ApolloLoggerPlugin: ApolloServerPlugin<MyApolloContext> = {
  async requestDidStart(
    requestContext: GraphQLRequestContext<MyApolloContext>
  ): Promise<GraphQLRequestListener<MyApolloContext>> {
    const { logInfo, logDebug, logError } = initializeDbLogging(requestContext?.context, requestContext?.operationName)
    requestContext.context.requestId = requestContext.context.requestId || v4()

    logInfo(`Request for operation name <${requestContext.operationName}> started!`, '[REQUEST_STARTED]')
    return {
      async parsingDidStart({
        operationName
      }: GraphQLRequestContextParsingDidStart<MyApolloContext>): Promise<GraphQLRequestListenerParsingDidEnd> {
        logDebug(`The parsing of operation <${operationName}> started!`, '[GraphQL_Parsing]')
        return async (err: Error | undefined) => {
          if (err) {
            await logError(`[GraphQL_Parsing][Error] ${err}`)
          }
        }
      },
      async validationDidStart({ operationName }: GraphQLRequestContextValidationDidStart<MyApolloContext>): Promise<void> {
        logDebug(`The validation of operation <${operationName}> started!`, '[GraphQL_Validation]')
      },
      async executionDidStart({ operationName }: GraphQLRequestContextExecutionDidStart<MyApolloContext>) {
        logDebug(`The execution of operation <${operationName}> started!`, '[GraphQL_Execution]')
      },
      didEncounterErrors: async ({ operationName, errors }: GraphQLRequestContextDidEncounterErrors<MyApolloContext>) => {
        for (const error of errors) {
          const templateError = await logError(
            `The server encounters errors while parsing, validating, or executing the operation < ${operationName} > \r\n`,
            '[GraphQL_Execution][Error]',
            error
          )
          error.message = templateError.message
        }
      },
      willSendResponse: async ({ operationName }: GraphQLRequestContextWillSendResponse<MyApolloContext>) => {
        logDebug(`A response for the operation <${operationName}> was sent!`, '[GraphQL_Response]')
        // await saveLogs(context)
      }
    }
  }
}
