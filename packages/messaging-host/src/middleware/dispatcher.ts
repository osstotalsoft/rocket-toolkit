// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import type { MessagingHostContext, MessagingHostMiddleware } from '../types'

export type MsgHandler = (ctx: MessagingHostContext) => Promise<void>

export interface MsgHandlers {
  [topic: string]: MsgHandler
}

function concat(h1: MsgHandler, h2: MsgHandler): MsgHandler {
  return async ctx => {
    await h1(ctx)
    await h2(ctx)
  }
}

function merge(xHandlers: Partial<MsgHandlers>, yHandlers: Partial<MsgHandlers>): MsgHandlers {
  const getTopicHandler = (topic: string): [string, MsgHandler] => {
    const x = xHandlers[topic]
    const y = yHandlers[topic]
    const handler = x && y ? concat(x, y) : (x || y)!

    return [topic, handler]
  }

  const topics = new Set([...Object.keys(xHandlers), ...Object.keys(yHandlers)])

  return Object.fromEntries([...topics].map(getTopicHandler))
}

function mergeHandlers(msgHandlers: MsgHandlers[]): MsgHandlers {
  return msgHandlers.reduce(merge, {})
}

/**
 * Message dispatcher middleware
 * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/messaging-host#built-in-dispatcher-middleware
 */
export const dispatcher = Object.assign(
  (handlers: MsgHandlers): MessagingHostMiddleware =>
    async (ctx, next) => {
      const { topic } = ctx.received
      const handler = handlers[topic]
      if (handler) {
        await handler(ctx)
      }

      await next()
    },
  { mergeHandlers }
)
