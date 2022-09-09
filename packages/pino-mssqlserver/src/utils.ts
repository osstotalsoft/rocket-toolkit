// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import humps from 'humps'
import { ConnectionInfo } from './types'

export const parseConnectionString = (connectionString :string) => {
  const parsed = connectionString
    .replace(' ', '')
    .split(';')
    .reduce((a, b) => {
        const prop = b.split('=')
        return (a[prop[0]] = prop[1]), a
    }, <{[_:string]:string}>{})

  return sanitizeConnectionInfo(parsed)
}

export const sanitizeConnectionInfo = (connectionInfo: {[_:string]:string}) : ConnectionInfo => {   
    let sanitizedConnectionInfo = <ConnectionInfo>humps.camelizeKeys(connectionInfo)

    const portSplit = sanitizedConnectionInfo.server?.split(',')
    if (portSplit?.length > 1) {
        sanitizedConnectionInfo.server = portSplit[0]
        sanitizedConnectionInfo.port = portSplit[1]
    }

    const instanceSplit = sanitizedConnectionInfo.server?.split('\\')
    if (instanceSplit?.length > 1) {
        sanitizedConnectionInfo.server = instanceSplit[0]
        sanitizedConnectionInfo.instanceName = instanceSplit[1]
    }

    sanitizedConnectionInfo.userName = sanitizedConnectionInfo.userName || (<any>sanitizedConnectionInfo).userId

    const otherParams = (<any>sanitizedConnectionInfo).otherParams
        ?.split(';')
        .filter((i: string) => i)
        .map((pair: string) => pair.split('='))
    if (otherParams) {
        sanitizedConnectionInfo = { ...sanitizedConnectionInfo, ...humps.camelizeKeys(Object.fromEntries(otherParams)) }
    }

    return sanitizedConnectionInfo
}