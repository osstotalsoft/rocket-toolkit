// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BaseContext } from '@apollo/server'
import { Logger } from 'pino'

export interface ApolloContextExtension extends BaseContext {
  requestId?: string,
  logger?: Logger,
  operationName?: string
}

export interface ApolloLoggingOptions {
  // Pre-configured apollo logger
  logger: Logger
  // If 'true', errors thrown inside Apollo Server are wrapped in a 'user friendly message'. Default is 'true'.
  securedMessages?: boolean
}
