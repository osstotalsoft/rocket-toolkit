// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as tenantConfiguration from './tenantConfiguration'
import { ConnectionInfo } from './types'

export function getConnectionInfo(tenantId: string, connectionStringName: string): ConnectionInfo {
  return tenantConfiguration.getValue(tenantId, `connectionStrings.${connectionStringName}`)
}
