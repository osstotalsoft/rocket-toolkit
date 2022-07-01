// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export { Tenant, ConnectionInfo } from './types'
export * as tenantService from './tenantService'
import * as tenantConfiguration from './tenantConfiguration'
import * as tenantConfigurationExtensions from './tenantConfigurationExtensions'
const mergedTenantConfiguration = { ...tenantConfiguration, ...tenantConfigurationExtensions }
export { mergedTenantConfiguration as tenantConfiguration }
