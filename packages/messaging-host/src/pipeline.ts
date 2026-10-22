// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import type { MessagingHostContext, MessagingHostMiddleware } from './types'

export const empty: MessagingHostMiddleware = (_ctx, next) => next()

async function emptyFn() {}

export function concat(middleware: MessagingHostMiddleware, pipeline: MessagingHostMiddleware): MessagingHostMiddleware {
  return (ctx, next) => pipeline(ctx, () => middleware(ctx, next))
}

export function run(pipeline: MessagingHostMiddleware, ctx: MessagingHostContext) {
  return pipeline(ctx, emptyFn)
}
