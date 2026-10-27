// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { envelope, messageBus } from '@totalsoft/message-bus'
import type { MessagingHostContext, MessagingHostMiddleware } from '../types'

const deadLetterQueue = () => {
  const push = async (ctx: MessagingHostContext, error: any) => {
    const msgBus = messageBus()

    const payload = {
      exceptionType: typeof error,
      errorMessage: error.message,
      stackTrace: error.stack,
      source: '',
      data: ctx.received.msg,
      originalTopic: ctx.received.topic,
      originalSystem: envelope.getSource(ctx.received.msg),
      correlationId: envelope.getCorrelationId(ctx.received.msg),
      messageType: '',
      publishTime: new Date(),
      messageId: ''
    }

    await msgBus.publish('_error', payload, ctx)
  }

  return {
    push
  }
}

/**
 * Exception handling middleware
 * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/messaging-host#built-in-exception-handling-middleware
 */
export const exceptionHandling = (): MessagingHostMiddleware => async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error(`Error occured when message received from topic ${ctx.received.topic}: ${error}`)

    const dlq = deadLetterQueue()
    dlq.push(ctx, error).catch(err => console.error(`Error publishing to dead letter queue: ${err}`))
  }
}
