// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { tenantContextAccessor } from '@totalsoft/multitenancy-core'

/**
 * Creates a pino mixin object containing the current tenant code
 * @returns - the pino mixin object
 */
 function tenantCodeMixin() {
    const tenant = tenantContextAccessor.getTenantContext()?.tenant
    return { tenantCode: tenant?.code || 'NONE'}
  }
  
  export default tenantCodeMixin
  