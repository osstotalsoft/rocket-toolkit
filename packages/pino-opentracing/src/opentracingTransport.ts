// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Span, Tags } from 'opentracing'
import { spanManager } from '@totalsoft/opentracing'
import { any } from 'ramda'
import pino from 'pino'
import split from 'split2'

function setTags(logObj: any) {
  const activeSpan = spanManager.getActiveSpan()
  if (!activeSpan) return

  let openTracingLog: { [key: string]: any } = {
    event: pino.levels.labels[logObj.level],
    timestamp: logObj.time,
    message: logObj.msg
  }

  if (logObj.level >= pino.levels.values['error']) {
    if (logObj.err) {
      openTracingLog = {
        ...openTracingLog,
        'error.object': logObj.err,
        'error.kind': logObj.err.type,
        stack: logObj.err.stack
      }
    }
    if (!errorTagExists(activeSpan)) {
      activeSpan.setTag(Tags.SAMPLING_PRIORITY, 1)
      activeSpan.setTag(Tags.ERROR, true)
    }
  }
  activeSpan.log(openTracingLog)
}

function errorTagExists(span: Span) {
  const tags: any[] = (<any>span)._tags
  if (!tags) return false
  return any(x => x?.key === Tags.ERROR, tags)
}

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
