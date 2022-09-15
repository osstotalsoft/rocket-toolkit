// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { FORMAT_HTTP_HEADERS, Tracer, Span } from 'opentracing'
const opentracing = require('opentracing')

const mapToObj = (inputMap: Map<string, string>) => {
  const obj: { [_: string]: string } = {}

  inputMap.forEach(function (value, key) {
    obj[key] = value
  })

  return obj
}

function getExternalSpan(tracer: Tracer, request: { headers: Map<string, string> | { [_: string]: string } }) {
  let headers
  const tmpHeaders = request && request.headers
  if (tmpHeaders && typeof tmpHeaders.get === 'function') {
    headers = mapToObj(<Map<string, string>>tmpHeaders)
  } else {
    headers = tmpHeaders
  }

  return headers ? tracer.extract(FORMAT_HTTP_HEADERS, headers) : undefined
}

function _logError(activeSpan: Span, error: Error) {
  activeSpan.log({
    event: 'error',
    message: error.message,
    'error.object': error,
    'error.kind': typeof error,
    stack: error?.stack
  })
}

function _setErrorTags(activeSpan: Span) {
  // Force the span to be collected for http errors
  activeSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1)
  // If error then set the span to error
  activeSpan.setTag(opentracing.Tags.ERROR, true)
}

function traceError(activeSpan: Span, error: Error) {
  if (!error) {
    return
  }

  _setErrorTags(activeSpan)
  _logError(activeSpan, error)
}

function traceErrors(activeSpan: Span, errors: Error[]) {
  if (!errors || !Array.isArray(errors)) {
    return
  }

  _setErrorTags(activeSpan)
  for (const error of errors) {
    _logError(activeSpan, error)
  }
}

export { getExternalSpan, traceError, traceErrors }
