// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { TenantContext } from './types'

const asyncLocalStorage = new AsyncLocalStorage<Map<string, TenantContext>>()
const store = new Map<string, TenantContext>()

const getTenantContext = (): TenantContext => {
  const tenantStore = asyncLocalStorage.getStore()
  return tenantStore?.get('tenantContext') ?? <TenantContext>{}
}

async function useTenantContext(tenantContext: TenantContext, next: () => Promise<void>) {
  return asyncLocalStorage.run(store, async () => {
    store.set('tenantContext', tenantContext)
    return await next()
  })
}

export { useTenantContext, getTenantContext }
