// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { tenantContextAccessor } from '@totalsoft/multitenancy-core'

function tenantIdMixin() {
  return { tenantId: tenantContextAccessor.getTenantContext()?.tenant?.id }
}

export default tenantIdMixin
