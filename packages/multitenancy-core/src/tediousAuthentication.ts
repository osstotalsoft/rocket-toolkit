// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { ConnectionInfo, TediousAuthentication } from './types'

// Authentication modes that use an identity instead of a password (compared ignoring case and spaces)
const passwordlessAuthenticationModes = [
  'Active Directory Workload Identity',
  'Active Directory Managed Identity',
  'Active Directory MSI',
  'Active Directory Default'
]

const normalize = (value: string) => value.replace(/\s/g, '').toLowerCase()
const normalizedPasswordlessModes = new Set(passwordlessAuthenticationModes.map(normalize))

/**
 * Builds the `authentication` block of a tedious / mssql config from a connection info.
 * Without an `authentication` mode it returns SQL authentication with userName / password.
 * For the passwordless modes it returns `azure-active-directory-default` with the identity client id,
 * ignoring userName / password.
 * @param connectionInfo The connection info, usually read with `tenantConfiguration.getConnectionInfo`.
 * @returns The tedious authentication block.
 * @throws When `identityClientId` is missing for a passwordless mode, or the mode is not supported.
 */
export function getTediousAuthentication(connectionInfo: ConnectionInfo): TediousAuthentication {
  const { userName, password, authentication, identityClientId } = connectionInfo

  if (!authentication?.trim()) {
    return { type: 'default', options: { userName, password } }
  }

  if (normalizedPasswordlessModes.has(normalize(authentication))) {
    if (!identityClientId?.trim()) {
      throw new Error(`Connection info part identityClientId is not provided for authentication '${authentication}'!`)
    }

    return { type: 'azure-active-directory-default', options: { clientId: identityClientId } }
  }

  throw new Error(
    `Unsupported authentication '${authentication}'! Supported values: ${passwordlessAuthenticationModes.join(', ')}.`
  )
}
