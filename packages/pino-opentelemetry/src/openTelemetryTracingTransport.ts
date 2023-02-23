// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { trace } from '@opentelemetry/api'
import pino from 'pino'
import split from 'split2'

function setTags(logObj: any) {
  const activeSpan = trace.getActiveSpan()
  if (!activeSpan) return

  const openTracingLog: { [key: string]: any } = {
    event: pino.levels.labels[logObj.level],
    timestamp: logObj.time,
    message: logObj.msg
  }

  if (logObj.level >= pino.levels.values['error']) {
    activeSpan.recordException(logObj.err || logObj.msg, logObj.time)
  } else {
    activeSpan.addEvent(pino.levels.labels[logObj.level], openTracingLog, logObj.time)
  }
}

/**
 * Creates a pino stream that logs the events to the opentracing client
 * @param _options - options for creating the stream
 * @returns - the pino stream
 */
export default function (_options: {} = {}) {
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
