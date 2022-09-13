// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

/* eslint-env browser */
import build from 'pino-abstract-transport'
import knex from 'knex'
import { Knex } from 'knex'
import pino from 'pino'
import { parseConnectionString } from './utils'
import { setTimeout } from 'timers/promises'
import { ConnectionInfo } from './types'

interface MsSqlServerTransportOptions {
  connectionString: string
  tableName: string
  serviceName: string
  flushInterval?: number
}

const generateKnexConfig = ({
  server,
  instanceName,
  port,
  userName,
  password,
  database,
  trustServerCertificate
}: ConnectionInfo): Knex.Config => ({
  client: 'mssql',
  connection: {
    server,
    port: parseInt(port) || <any>null,
    user: userName,
    password,
    database,
    options: {
      enableArithAbort: true,
      trustServerCertificate: JSON.parse(trustServerCertificate?.trim().toLowerCase() || 'false'),
      encrypt: true,
      instanceName: instanceName || undefined
    }
  },
  pool: {
    min: 5,
    max: 25,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    createRetryIntervalMillis: 200,
    idleTimeoutMillis: 5000
  },
  useNullAsDefault: true
})

function batchQueueProcessor(batchHandler: (logs: any[]) => Promise<void>, { interval = 20, batchLimit = 10 } = {}) {
  const queue: any[] = []
  const ac = new AbortController()

  function abort() {
    try {
      ac.abort()
    } catch (err) {
      console.log(err)
    }
  }

  function enqueue(obj: any) {
    queue.push(obj)
  }

  async function flush() {
    const crtQueue = queue
    //queue = []

    for (let batch; (batch = crtQueue.splice(0, batchLimit)), batch.length > 0; ) {
      await batchHandler(batch)
    }
  }

  async function wait() {
    try {
      await setTimeout(interval, undefined, { signal: ac.signal })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false
      }
      throw err
    }

    return true
  }

  async function run() {
    while (await wait()) {
      await flush()
    }
  }

  // Fire and forget
  run()

  return {
    enqueue,
    flush,
    abort
  }
}

export default async function dbTransport(opts: MsSqlServerTransportOptions) {
  const connectionInfo = parseConnectionString(opts.connectionString)
  const dbInstance = knex(generateKnexConfig(connectionInfo))
  const interval = opts.flushInterval || 2000

  const queueProcessor = batchQueueProcessor(insertLogs, { interval })

  async function insertLogs(logsBatch: any[]) {
    try {
      const logs = logsBatch.map(log => ({
        TimeStamp: log.time,
        CorrelationId: log.correlationId,
        ServiceName: opts.serviceName,
        Message: log.msg,
        Level: pino.levels.labels[log.level],
        LogEvent: JSON.stringify(log),
        TenantId: log.tenantId,
        Exception: log.err ? JSON.stringify(log.err) : undefined
      }))
      await dbInstance(opts.tableName).insert(logs)
    } catch (e) {
      console.error(e)
    }
  }

  return build(
    async function (source) {
      for await (const obj of source) {
        queueProcessor.enqueue(obj)
      }
    },
    {
      async close(err, cb) {
        queueProcessor.abort()
        await queueProcessor.flush()
        process.nextTick(cb, err)
      }
    }
  )
}
