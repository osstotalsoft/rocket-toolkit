# pino-mssqlserver

This package provides a [pino transport](https://github.com/pinojs/pino/blob/master/docs/transports.md) for Microsoft Sql Server.

It supports batching multiple log events and writing them periodically to the database.

## Installation

```javascript
npm i @totalsoft/pino-mssqlserver
```

or

```javascript
yarn add @totalsoft/pino-mssqlserver
```

## Usage

```javascript
const pino = require("pino");

const connectionString =
    'Server=myServerAddress,1333;Database=myDataBase; TrustServerCertificate=True;User Id=myUsername;Password=myPassword; MultipleActiveResultSets=true;'


const transport = pino.transport({
  target: "@totalsoft/pino-mssqlserver",
  options: {
    serviceName: "MyService.Gql",
    tableName: "__Logs",
    connectionString
  },
  level: logDatabaseMinLevel
});

const logger = pino(transport);
```

## Options
Options for instantiating the Sql Server transport

```typescript
export interface MsSqlServerTransportOptions {
  // A connection string in the Microsoft Sql Server format
  connectionString: string

  // The logs table name
  tableName: string

  // A name for the current service / application to partition the log table
  serviceName: string

  // The maximum number of log events in a batch that is written to the database (default 20)
  batchLimit?: number

  // Time interval in milliseconds at which log batches are written to the database (default 2000)
  flushInterval?: number
}
```

## Database structure

The log table should have the following format:
```sql
CREATE TABLE [dbo].[__Logs](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Message] [nvarchar](max) NULL,
	[Level] [nvarchar](max) NULL,
	[TimeStamp] [datetime] NULL,
	[Exception] [nvarchar](max) NULL,
	[LogEvent] [nvarchar](max) NULL,
	[ServiceName] [varchar](200) NULL,
	[TenantId] [uniqueidentifier] NULL,
	[CorrelationId] [uniqueidentifier] NULL,
 CONSTRAINT [PK___Logs] PRIMARY KEY CLUSTERED ([Id] ASC)
)
```