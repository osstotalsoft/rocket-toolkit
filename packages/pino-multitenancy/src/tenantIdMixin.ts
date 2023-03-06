// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { tenantContextAccessor } from '@totalsoft/multitenancy-core'

/**
 * Creates a pino mixin object containing the current tenant id
 * @returns - the pino mixin object
 */
function tenantIdMixin() {
  const tenant = tenantContextAccessor.getTenantContext()?.tenant
  return { tenantId: tenant?.id }
}

export default tenantIdMixin
