// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { v4 } from 'uuid'

const asyncLocalStorage = new AsyncLocalStorage<string>()

const getCorrelationId = () => {
  return asyncLocalStorage.getStore()
}

async function useCorrelationId(correlationId: string | null, next: () => Promise<void>) {
  const correlationIdToUse = correlationId || v4()
  return asyncLocalStorage.run(correlationIdToUse, async () => {
    return await next()
  })
}

export default { useCorrelationId, getCorrelationId }
