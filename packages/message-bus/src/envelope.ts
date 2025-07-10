// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { v4 } from 'uuid'
import type { EnvelopeType, Headers } from './types.js'

const correlationId = 'nbb-correlationId'
const source = 'nbb-source'
const tenantId = 'nbb-tenantId'

const headers: Headers = {
  correlationId,
  source,
  tenantId
}

export const envelope: EnvelopeType = (payload, ctx, envelopeCustomizer) => {
  const messagingSource = process.env.Messaging__Source || ''
  const correlationId = (ctx && ctx.correlationId) || v4()
  const tenantId = ctx && ctx.tenantId

  const platformHeaders = {
    [headers.correlationId]: correlationId,
    [headers.tenantId]: tenantId,
    [headers.source]: messagingSource
  }

  const envelope = {
    payload,
    headers: envelopeCustomizer ? envelopeCustomizer(platformHeaders) : platformHeaders
  }

  return envelope
}

envelope.headers = headers

envelope.getCorrelationId = function getCorrelationId(msg) {
  return msg.headers[headers.correlationId]
}

envelope.getTenantId = function getTenantId(msg) {
  return msg.headers[headers.tenantId]
}

envelope.getSource = function getSource(msg) {
  return msg.headers[headers.source]
}
