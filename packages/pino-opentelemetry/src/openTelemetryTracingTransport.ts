// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Attributes, trace } from '@opentelemetry/api'
import {  SEMATTRS_EXCEPTION_MESSAGE, SEMATTRS_EXCEPTION_STACKTRACE, SEMATTRS_EXCEPTION_TYPE } from '@opentelemetry/semantic-conventions'
import pino from 'pino'
import split from 'split2'

function setTags(logObj: any) {
  const activeSpan = trace.getActiveSpan()
  if (!activeSpan) return

  const { msg: message, err: exception, time, level, span_id: _1, trace_flags: _2, trace_id: _3, ...rest } = logObj
  const attributes: Attributes = { message, ...rest }

  if (logObj.level >= pino.levels.values['error']) {
    if (exception) {
      if (exception.code) {
        attributes[SEMATTRS_EXCEPTION_TYPE] = exception.code.toString()
      } else if (exception.name) {
        attributes[SEMATTRS_EXCEPTION_TYPE] = exception.name
      }
      if (exception.message) {
        attributes[SEMATTRS_EXCEPTION_MESSAGE] = exception.message
      }
      if (exception.stack) {
        attributes[SEMATTRS_EXCEPTION_STACKTRACE] = exception.stack
      }
    }
  }

  activeSpan.addEvent(pino.levels.labels[level], attributes, time)
}

/**
 * Creates a pino stream that logs the events to the opentracing client
 * @param _options - options for creating the stream
 * @returns - the pino stream
 */
export default function (_options: object = {}) {
  const result = split((data: string) => {
    try {
      const log = JSON.parse(data)
      setTags(log)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  return result
}
