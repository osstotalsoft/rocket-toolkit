// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AsyncLocalStorage } from 'async_hooks'
import { TenantContext } from './types'

const asyncLocalStorage = new AsyncLocalStorage<TenantContext>()

/**
 * Access the current tenant context in scope
 * @returns - the tenant context
 */
const getTenantContext = (): TenantContext => {
  const tenantContext = asyncLocalStorage.getStore()
  return tenantContext ?? <TenantContext>{}
}

/**
 * Open a scope where the tenant context will be available
 * @param tenantContext - the context that contains the current tenant
 * @param next - the wrapped function that will have access to the context
 * @returns the result of the next function
 */
async function useTenantContext(tenantContext: TenantContext, next: () => Promise<void>) {
  return asyncLocalStorage.run(tenantContext, async () => {
    return await next()
  })
}

export { useTenantContext, getTenantContext }
