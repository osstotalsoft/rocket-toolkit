// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export interface ConnectionInfo {
  server: string
  instanceName: string
  port: string
  userName: string
  password: string
  database: string
  trustServerCertificate: string
}

/**
 * Options for instantiating the Sql Server transport
 */
export interface MsSqlServerTransportOptions {
  /**
   * A connection string in the Microsoft Sql Server format
   */
  connectionString: string

  /**
   * The logs table name
   */
  tableName: string

  /**
   * A name for the current service / application to partition the log table
   */
  serviceName: string

  /**
   * The maximum number of log events in a batch that is written to the database (default 20)
   */
  batchLimit?: number

  /**
   * Time interval in milliseconds at which log batches are written to the database (default 2000)
   */
  flushInterval?: number
}
