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
  userName: string
  password: string
  otherParams?: string
}
