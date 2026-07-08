// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Attributes, Span, SpanStatusCode } from '@opentelemetry/api'
import type { IncomingMessage } from 'http'
import isPromise from 'is-promise'

/**
 * Semantic attribute keys used by this instrumentation. Previously imported from
 * `@opentelemetry/semantic-conventions`, these are inlined to keep the emitted span
 * attribute keys stable across semantic-conventions major versions.
 */
export const SemanticAttributes = {
  MESSAGING_SYSTEM: 'messaging.system',
  MESSAGING_DESTINATION_KIND: 'messaging.destination_kind',
  MESSAGING_OPERATION: 'messaging.operation',
  MESSAGING_DESTINATION: 'messaging.destination',
  MESSAGING_PROTOCOL: 'messaging.protocol',
  NET_HOST_IP: 'net.host.ip',
  NET_HOST_PORT: 'net.host.port',
  NET_PEER_IP: 'net.peer.ip',
  NET_PEER_PORT: 'net.peer.port',
  HTTP_STATUS_CODE: 'http.status_code'
} as const

/**
 * Builds span attributes for an incoming HTTP(S) upgrade request. Replaces the
 * `getIncomingRequestAttributes` helper that `@opentelemetry/instrumentation-http`
 * no longer exports as of the 0.2xx line.
 */
export const getIncomingRequestAttributes = (
  request: IncomingMessage,
  options: { component: string; hookAttributes?: Attributes }
): Attributes => {
  const headers = request.headers
  // Per OTel semantic conventions `http.scheme` is the HTTP scheme (`http`/`https`), even for WebSocket
  // upgrade requests. TLS sockets expose `encrypted === true`, which distinguishes `https` from `http`.
  const isEncrypted = (request.socket as { encrypted?: boolean } | undefined)?.encrypted === true
  const attributes: Attributes = {
    'http.method': (request.method || 'GET').toUpperCase(),
    'http.target': request.url || '/',
    'http.host': headers.host || 'localhost',
    'http.scheme': isEncrypted ? 'https' : 'http',
    'http.flavor': request.httpVersion,
    'net.transport': 'ip_tcp',
    component: options.component
  }

  const userAgent = headers['user-agent']
  if (userAgent !== undefined) {
    attributes['http.user_agent'] = userAgent
  }

  return Object.assign(attributes, options.hookAttributes)
}

export const endSpan = (traced: () => any | Promise<any>, span: Span) => {
  try {
    const result = traced()
    if (isPromise(result)) {
      return Promise.resolve(result)
        .catch(err => {
          if (err) {
            if (typeof err === 'string') {
              span.setStatus({ code: SpanStatusCode.ERROR, message: err })
            } else {
              span.recordException(err)
              span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message })
            }
          }
          throw err
        })
        .finally(() => span.end())
    } else {
      span.end()
      return result
    }
  } catch (error: any) {
    span.recordException(error)
    span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message })
    span.end()
    throw error
  }
}

export const limitLength = (str: string, maxLength: number) => {
  if (typeof str === 'string' && typeof maxLength === 'number' && 0 < maxLength && maxLength < str.length) {
    return str.substring(0, maxLength) + '...'
  }
  return str
}
