// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { TenantContext } from './types'

const asyncLocalStorage = new AsyncLocalStorage<Map<string, TenantContext>>()
const store = new Map<string, TenantContext>()

/**
 * Access the current tenant context in scope
 * @returns - the tenant context
 */
const getTenantContext = (): TenantContext => {
  const tenantStore = asyncLocalStorage.getStore()
  return tenantStore?.get('tenantContext') ?? <TenantContext>{}
}

/**
 * Open a scope where the tenant context will be available
 * @param tenantContext - the context that contains the current tenant
 * @param next - the wrapped function that will have access to the context
 * @returns the result of the next function
 */
async function useTenantContext(tenantContext: TenantContext, next: () => Promise<void>) {
  return asyncLocalStorage.run(store, async () => {
    store.set('tenantContext', tenantContext)
    return await next()
  })
}

export { useTenantContext, getTenantContext }
