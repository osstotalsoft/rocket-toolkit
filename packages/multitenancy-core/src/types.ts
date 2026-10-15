// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export interface Tenant {
  id: string
  code: string
  name?: string
  enabled: boolean
}

export interface ConnectionInfo {
  server: string
  database: string
  userName?: string
  password?: string
  otherParams?: string
  authentication?: string
  identityClientId?: string
}

export interface TediousDefaultAuthentication {
  type: 'default'
  options: {
    userName?: string
    password?: string
  }
}

export interface TediousAzureActiveDirectoryDefaultAuthentication {
  type: 'azure-active-directory-default'
  options: {
    clientId: string
  }
}

export type TediousAuthentication = TediousDefaultAuthentication | TediousAzureActiveDirectoryDefaultAuthentication

export interface TenantMapById {
  [tid: string]: TenantSection
}

export interface TenantMapByCode {
  [code: string]: TenantSection
}

export interface TenantSection {
  tenantId: string
  code: string
  [key: string]: any
}

export interface TenantContext {
  tenant?: Tenant
}
