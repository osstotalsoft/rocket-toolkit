// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import objectPath from 'object-path'
import humps from 'humps'
import debounce from 'debounce'
import deepmerge from 'deepmerge'
import { TenantMapByCode, TenantMapById, TenantSection } from './types'
const { IS_MULTITENANT } = process.env
const isMultiTenant = JSON.parse(IS_MULTITENANT || 'false')
const debounceTimeoutMs = 5000

const _getTenantsDebounced = debounce(_getTenants, debounceTimeoutMs, true)
const _getDefaultsDebounced = debounce(_getDefaults, debounceTimeoutMs, true)

export function getValue(tenantId: string, key?: string) {
  if (!isMultiTenant) {
    return undefined
  }

  const defaults = _getDefaultsDebounced()
  const tenantSection = _getTenantsDebounced()[tenantId?.toLowerCase()]

  if (!tenantSection) throw new Error(`Configuration not found for tenant '${tenantId}'`)

  const defaultValue = objectPath.get(defaults, key || '')
  const tenantValue = objectPath.get(tenantSection, key || '')

  if (_isObject(defaultValue) && _isObject(tenantValue)) {
    return deepmerge(defaultValue, tenantValue)
  }

  return tenantValue || defaultValue
}

/**
 * Retrieves all tenant configurations.
 * If multi-tenancy is disabled, an empty array is returned.
 * If multi-tenancy is enabled, the function merges the default configuration with each tenant configuration
 * and returns an array of merged configurations.
 * @returns An array of TenantSection objects representing the merged tenant configurations.
 */
export function getAll(): TenantSection[] {
  if (!isMultiTenant) {
    return []
  }

  const defaults = _getDefaultsDebounced()
  const allTenantsMap = _getTenantsDebounced()

  return Object.entries(allTenantsMap).map(([tid, tenantSection]) => {
    return _isObject(defaults) && _isObject(tenantSection)
      ? deepmerge(defaults, tenantSection)
      : tenantSection || defaults
  })
}

function _getDefaults(): TenantMapByCode {
  const defaultsPrefix = 'MultiTenancy__Defaults__'
  const defaults = _loadFromEnv(defaultsPrefix)
  return defaults
}

function _isObject(value: any): boolean {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function _getTenants(): TenantMapById {
  const tenantsPrefix = 'MultiTenancy__Tenants__'
  const tenantMapByCode = _loadFromEnv(tenantsPrefix)

  const tenantMap: TenantMapById = {}
  for (const [tenantCode, tenantSection] of Object.entries(tenantMapByCode)) {
    if (tenantSection?.tenantId) {
      const tid = tenantSection.tenantId.toLowerCase()
      tenantMap[tid] = { ...tenantSection, code: tenantCode }
    }
  }

  return tenantMap
}

function _loadFromEnv(prefix: string): TenantMapByCode {
  const tenantValues = Object.keys(process.env).filter(x => x.startsWith(prefix) && x.length > prefix.length)

  let outputObj = {}
  for (const envKey of tenantValues) {
    const tenantPart = envKey.substring(prefix.length)
    const path = tenantPart.split('__')
    const value = process.env[envKey]

    objectPath.set(outputObj, path, value)
  }
  outputObj = humps.camelizeKeys(outputObj)

  return outputObj
}
