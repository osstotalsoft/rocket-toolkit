// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import humps from 'humps'
import { Envelope, SerDes, SerDesInfo } from './types.js'

const contentType = 'application/json;charset=utf-8'

export function serialize(msg: any): string {
  const data = JSON.stringify(msg)
  return data
}

export function deSerialize(data: string): Envelope<any> {
  const msg = JSON.parse(data)
  const payload = msg.payload || humps.camelizeKeys(msg.Payload)
  const headers = msg.headers || msg.Headers
  const result = {
    payload,
    headers
  }
  return result
}

export function deSerializePayload(payload: string): any {
  const p = humps.camelizeKeys(JSON.parse(payload))
  return p
}

export function getInfo(): SerDesInfo {
  return {
    contentType
  }
}

const serDes: SerDes = {
  serialize,
  deSerialize,
  deSerializePayload,
  getInfo
}

export default serDes
