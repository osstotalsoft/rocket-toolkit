// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { v4 } from 'uuid'
import { envelope } from '@totalsoft/message-bus'
import type { MessagingHostMiddleware } from '../types'

/**
 * Correlation middleware
 * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/messaging-host#built-in-correlation-middleware
 */
export const correlation = (): MessagingHostMiddleware => async (ctx, next) => {
  if (!ctx.correlationId) {
    const correlationId = envelope.getCorrelationId(ctx.received.msg) || v4()
    ctx.correlationId = correlationId
  }

  await next()
}
