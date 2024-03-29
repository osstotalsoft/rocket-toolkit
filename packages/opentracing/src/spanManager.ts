// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { Span } from 'opentracing'
const asyncLocalStorage = new AsyncLocalStorage<Span[]>()

/**
 * Gets the active span in scope
 * @returns - the active span
 */
function getActiveSpan() {
  const context = asyncLocalStorage.getStore()
  const activeSpan = context && context.length ? context[context.length - 1] : null
  return activeSpan
}

async function useSpanManager(rootSpan: Span, scopeAction: () => Promise<void>) {
  const context = [rootSpan]

  return asyncLocalStorage.run(context, async () => {
    return await scopeAction()
  })
}

function beginScope(span: Span) {
  const context = asyncLocalStorage.getStore()
  context?.push(span)
}

function endScope() {
  const context = asyncLocalStorage.getStore()
  context?.pop()
}

/**
 * Open a scope for the active span
 * @param span - the active span
 * @param action - the wrapped function that has access to the active span
 */
async function withScope(span: Span, action: () => Promise<void>) {
  try {
    beginScope(span)
    await action()
  } finally {
    endScope()
  }
}

export { useSpanManager, getActiveSpan, beginScope, endScope, withScope }
