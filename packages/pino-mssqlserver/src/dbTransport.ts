// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

/* eslint-env browser */
import build from 'pino-abstract-transport'
import knex from 'knex'
import { Knex } from 'knex'
import pino from 'pino'
import { parseConnectionString } from './utils'
import { batchQueueProcessor } from './batchQueueProcessor'
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

function buildDbInstance(connectionString: string) {
  try {
    const connectionInfo = parseConnectionString(connectionString)
    const dbInstance = knex(generateKnexConfig(connectionInfo))
    return dbInstance
  }catch(error) {
    console.error(error)
  }
}

export default async function dbTransport(opts: MsSqlServerTransportOptions) {
  const dbInstance = buildDbInstance(opts.connectionString)
  if (!dbInstance) {
    return build(() => {}) // Don't crash if db connection could not be established
  }

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
      await dbInstance?.(opts.tableName).insert(logs)
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
