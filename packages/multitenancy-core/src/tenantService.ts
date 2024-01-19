// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as tenantConfiguration from './tenantConfiguration'
import { Tenant } from './types'

export async function getTenantFromId(tenantId: string): Promise<Tenant | null> {
  if (!tenantId) {
    return null
  }

  const configTenant = tenantConfiguration.getValue(tenantId)

  if (configTenant.enabled == 'false') {
    throw new Error(`Tenant '${configTenant.code}' is disabled`)
  }

  const tenant: Tenant = {
    id: tenantId,
    name: configTenant.name,
    code: configTenant.code,
    enabled: true
  }
  return tenant
}

/**
 * Retrieves all enabled tenants.
 * @returns A promise that resolves to an array of Tenant objects.
 */
export async function getAll(): Promise<Tenant[]> {
  const configTenants = tenantConfiguration.getAll()
  return configTenants
    .filter(tenant => tenant.enabled !== 'false')
    .map(({ tenantId: id, name, code }) => ({ id, name, code, enabled: true }))
}
