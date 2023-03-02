// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Span, SpanStatusCode } from '@opentelemetry/api'
import isPromise from 'is-promise'

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
