import { dbTransport } from '../src'
import { pino } from 'pino'
import knex from 'knex'
import { setTimeout } from 'timers/promises'

jest.mock('knex')

describe('correlation tests:', () => {
  const mockedKnex = <any>knex
  beforeAll(() => {
    jest.clearAllMocks()
  })
  it('logs message to database', async () => {
    //arrange
    const queryBuilder = {
      insert: jest.fn()
    }
    const dbInstance = jest.fn().mockReturnValue(queryBuilder)
    mockedKnex.mockReturnValue(dbInstance)

    const tableName = '__Logs'
    const serviceName = 'MyService'
    const dest = await dbTransport({ connectionString: '', serviceName, tableName, flushInterval: 1 })
    const logger = pino({}, dest)

    //act
    logger.info('bau')
    dest.end()

    await setTimeout(20)

    //assert
    expect(dbInstance).toBeCalledWith(tableName)
    expect(queryBuilder.insert).toBeCalledWith([
      expect.objectContaining({ Level: 'info', Message: 'bau', ServiceName: serviceName })
    ])
  })

  it('batches db inserts', async () => {
    //arrange
    const queryBuilder = {
      insert: jest.fn()
    }
    const dbInstance = jest.fn().mockReturnValue(queryBuilder)
    mockedKnex.mockReturnValue(dbInstance)

    const tableName = '__Logs'
    const serviceName = 'MyService'
    const dest = await dbTransport({ connectionString: '', serviceName, tableName, flushInterval: 1 })
    const logger = pino({}, dest)

    //act
    logger.info('bow')
    logger.info('wow')
    dest.end()

    await setTimeout(20)

    //assert
    expect(dbInstance).toBeCalledWith(tableName)
    expect(queryBuilder.insert).toBeCalledWith([
      expect.objectContaining({ Level: 'info', Message: 'bow', ServiceName: serviceName }),
      expect.objectContaining({ Level: 'info', Message: 'wow', ServiceName: serviceName })
    ])
  })

  it('flushes periodically', async () => {
    //arrange
    const queryBuilder = {
      insert: jest.fn()
    }
    const dbInstance = jest.fn().mockReturnValue(queryBuilder)
    mockedKnex.mockReturnValue(dbInstance)

    const tableName = '__Logs'
    const serviceName = 'MyService'
    const dest = await dbTransport({ connectionString: '', serviceName, tableName, flushInterval: 1 })
    const logger = pino({}, dest)

    //act
    logger.info('bow')
    await setTimeout(10)
    logger.info('wow')
    dest.end()

    await setTimeout(20)

    //assert
    expect(dbInstance).toBeCalledWith(tableName)
    expect(queryBuilder.insert).nthCalledWith(1, [
      expect.objectContaining({ Level: 'info', Message: 'bow', ServiceName: serviceName })
    ])
    expect(queryBuilder.insert).nthCalledWith(2, [
      expect.objectContaining({ Level: 'info', Message: 'wow', ServiceName: serviceName })
    ])
  })

  it('exception does not crash service', async () => {
    //arrange
    const queryBuilder = {
      insert: () => {
        throw new Error('insert error')
      }
    }
    const dbInstance = jest.fn().mockReturnValue(queryBuilder)
    mockedKnex.mockReturnValue(dbInstance)

    const tableName = '__Logs'
    const serviceName = 'MyService'
    const dest = await dbTransport({ connectionString: '', serviceName, tableName, flushInterval: 1 })
    const logger = pino({}, dest)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    //act
    logger.info('bau')
    dest.end()

    await setTimeout(20)

    //assert
    expect(consoleError).toBeCalledWith(expect.objectContaining({ message: 'insert error' }))
  })

  it('parses connection string', async () => {
    //arrange
    const tableName = '__Logs'
    const serviceName = 'MyService'
    const connectionString =
      'Server=myServerAddress,1333;Database=myDataBase; TrustServerCertificate=True;User Id=myUsername;Password=myPassword; MultipleActiveResultSets=true;'

    //act
    const dest = await dbTransport({ connectionString, serviceName, tableName, flushInterval: 1 })
    dest.end()

    //assert
    expect(knex).lastCalledWith(
      expect.objectContaining({
        client: 'mssql',
        connection: expect.objectContaining({
          server: 'myServerAddress',
          database: 'myDataBase',
          port: 1333,
          user: 'myUsername',
          password: 'myPassword',
          options: expect.objectContaining({
            encrypt: true,
            trustServerCertificate: true
          })
        })
      })
    )
  })
})
