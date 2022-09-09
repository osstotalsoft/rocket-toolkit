// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { v4 } from 'uuid'

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>()
const store = new Map<string, string>()
const correlationIdKey = 'correlationId'

const getCorrelationId = () => {
  const correlationIdStore = asyncLocalStorage.getStore()
  return correlationIdStore?.get(correlationIdKey)
}

async function useCorrelationId(correlationId: string, next: () => Promise<void>) {
  return asyncLocalStorage.run(store, async () => {
    store.set(correlationIdKey, correlationId || v4())
    return await next()
  })
}

export default { useCorrelationId, getCorrelationId }
