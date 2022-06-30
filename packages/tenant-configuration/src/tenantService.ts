// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as tenantConfiguration from './tenantConfiguration'
import { Tenant } from './types'

export async function getTenantFromId(tenantId: string): Promise<Tenant | null> {
  if (!tenantId) {
    return null
  }

  const configTenant = tenantConfiguration.getValue(tenantId)

  const tenant: Tenant = {
    id: tenantId,
    name: configTenant.name,
    code: configTenant.code
  }
  return tenant
}
