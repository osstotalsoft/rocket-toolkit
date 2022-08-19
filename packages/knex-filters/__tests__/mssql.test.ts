// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.
import knex from 'knex'
import mockDb from 'mock-knex'
import { mssql } from '../src'

const dbInstance = knex({ client: 'mssql' })
const tracker = mockDb.getTracker()

describe('MS SQL database info', () => {
  beforeAll(() => {
    mockDb.mock(dbInstance)
  })
  afterAll(() => {
    mockDb.unmock(dbInstance)
  })

  beforeEach(() => {
    tracker.install()
  })
  afterEach(() => {
    tracker.uninstall()
  })

  test('standard queries are fired', async () => {
    // arrange
    const mockCallback = jest
      .fn()
      .mockImplementationOnce(q => q.response([{ schema: 'schema', db: 'database' }]))
      .mockImplementationOnce(q => q.response([]))
    tracker.on('query', mockCallback)

    // act
    await mssql('colName', dbInstance)

    // assert
    expect(mockCallback.mock.calls[0][0].method).toBe('raw')
    expect(mockCallback.mock.calls[0][0].sql).toBe('select SCHEMA_NAME() as [schema], DB_NAME() as [db]')
    expect(mockCallback.mock.calls[1][0].method).toBe('select')
    expect(mockCallback.mock.calls[1][0].sql).toBe(
      'select distinct [TABLE_NAME] as [table], [TABLE_SCHEMA] as [schema] from [INFORMATION_SCHEMA].[COLUMNS] where [COLUMN_NAME] = @p0'
    )
  })

  test('no table name, will returns false', async () => {
    // arrange
    const mockCallback = jest
      .fn()
      .mockImplementationOnce(q => q.response([{ schema: 'schema', db: 'database' }]))
      .mockImplementationOnce(q => q.response([]))
    tracker.on('query', mockCallback)

    // act
    const testSubject = await mssql('colName', dbInstance)
    const response = testSubject(null)

    // assert
    expect(response).toBeFalsy()
  })

  test('different database than initiation, will returns false', async () => {
    // arrange
    const mockCallback = jest
      .fn()
      .mockImplementationOnce(q => q.response([{ schema: 'schema', db: 'database' }]))
      .mockImplementationOnce(q => q.response([{ table: 'table', schema: 'schema' }]))
    tracker.on('query', mockCallback)

    // act
    const testSubject = await mssql('colName', dbInstance)
    const response = testSubject('notDatabase.schema.table')

    // assert
    expect(response).toBeFalsy()
  })

  test('not naming a schema will imply default', async () => {
    // arrange
    const mockCallback = jest
      .fn()
      .mockImplementationOnce(q => q.response([{ schema: 'schema', db: 'database' }]))
      .mockImplementationOnce(q =>
        q.response([
          { table: 'differentTable', schema: 'schema' },
          { table: 'table', schema: 'differentSchema' }
        ])
      )
    tracker.on('query', mockCallback)

    // act
    const testSubject = await mssql('colName', dbInstance)
    const falsyResponse = testSubject('table')
    const truthyResponse = testSubject('differentTable')
    const specifySchemaResponse = testSubject('differentSchema.table')

    // assert
    expect(falsyResponse).toBeFalsy()
    expect(truthyResponse).toBeTruthy()
    expect(specifySchemaResponse).toBeTruthy()
  })
})
