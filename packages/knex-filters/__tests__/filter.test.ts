// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Knex, knex } from 'knex'
import mockDb from 'mock-knex'
import { AdvancedSelectHooks, createFilter, Filter, FromClause, Hooks, Name, registerFilter } from '../src'
import * as MSSQLMockKnex from '../__mocks__/MSSQLMockKnex'

describe('filter tests', () => {
  test('select from single table', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => {
      return hooks
    })
    registerFilter(filter, knexInstance)

    const advancedHooks: { onSelect: AdvancedSelectHooks } = {
      onSelect: {
        from: jest.fn(),
        innerJoin: jest.fn(),
        leftJoin: jest.fn(),
        rightJoin: jest.fn(),
        fullOuterJoin: jest.fn(),
        crossJoin: jest.fn()
      }
    }
    const advancedFilter: Filter = jest.fn(() => {
      return advancedHooks
    })
    registerFilter(advancedFilter, knexInstance)

    //act
    await knexInstance.select('column1').from('table1 as tbl1')
    await knexInstance.select('column2').from('table2')
    await knexInstance.select('column3').from('[table3] as tbl3')
    await knexInstance.select('column4').from('[dbo].[table4]')
    await knexInstance.select('column5').from('dbo.table5 as tbl5')

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(advancedFilter).toHaveBeenCalledWith('table1')

    expect(filter).toHaveBeenCalledWith('table2')
    expect(advancedFilter).toHaveBeenCalledWith('table2')

    expect(filter).toHaveBeenCalledWith('table3')
    expect(advancedFilter).toHaveBeenCalledWith('table3')

    expect(filter).toHaveBeenCalledWith('dbo.table4')
    expect(advancedFilter).toHaveBeenCalledWith('dbo.table4')

    expect(filter).toHaveBeenCalledWith('dbo.table5')
    expect(advancedFilter).toHaveBeenCalledWith('dbo.table5')

    expect(hooks.onSelect).toHaveBeenCalledWith('table1', 'tbl1', expect.anything(), expect.anything())
    expect(advancedHooks?.onSelect?.from).toHaveBeenCalledWith('table1', 'tbl1', expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('table2', undefined, expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.from).toHaveBeenCalledWith('table2', undefined, expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('table3', 'tbl3', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.from).toHaveBeenCalledWith('table3', 'tbl3', expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table4', undefined, expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.from).toHaveBeenCalledWith('dbo.table4', undefined, expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table5', 'tbl5', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.from).toHaveBeenCalledWith('dbo.table5', 'tbl5', expect.anything(), expect.anything())
  })

  test('select with join', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    const advancedHooks = {
      onSelect: {
        from: jest.fn(),
        innerJoin: jest.fn(),
        leftJoin: jest.fn(),
        rightJoin: jest.fn(),
        fullOuterJoin: jest.fn(),
        crossJoin: jest.fn()
      }
    }
    const advancedFilter = jest.fn(() => {
      return advancedHooks
    })
    registerFilter(advancedFilter, knexInstance)

    //act
    await knexInstance
      .select('tbl1.column1', 'tbl2.column2')
      .from('table1 as tbl1')
      .innerJoin('table2 as tbl2', 'tbl1.column1', 'tbl2.column2')
      .leftOuterJoin('dbo.table3', 'tbl1.column1', 'dbo.table3.column3')
      .rightJoin('[dbo].[table4]', 'tbl1.column1', '[dbo].[table4].[column4]')
      .fullOuterJoin('[dbo].[table5] as tbl5', 'tbl1.column1', 'tbl5.column5')
      .crossJoin('[dbo].[table6] as tbl6', 'tbl1.column1', 'tbl6.column6')

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(advancedFilter).toHaveBeenCalledWith('table1')

    expect(filter).toHaveBeenCalledWith('table2')
    expect(advancedFilter).toHaveBeenCalledWith('table2')

    expect(filter).toHaveBeenCalledWith('dbo.table3')
    expect(advancedFilter).toHaveBeenCalledWith('dbo.table3')

    expect(filter).toHaveBeenCalledWith('dbo.table4')
    expect(advancedFilter).toHaveBeenCalledWith('dbo.table4')

    expect(filter).toHaveBeenCalledWith('dbo.table5')
    expect(advancedFilter).toHaveBeenCalledWith('dbo.table5')

    expect(hooks.onSelect).toHaveBeenCalledWith('table1', 'tbl1', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.from).toHaveBeenCalledWith('table1', 'tbl1', expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('table2', 'tbl2', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.innerJoin).toHaveBeenCalledWith('table2', 'tbl2', expect.anything(), expect.anything())

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table3', undefined, expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.leftJoin).toHaveBeenCalledWith(
      'dbo.table3',
      undefined,
      expect.anything(),
      expect.anything()
    )

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table4', undefined, expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.rightJoin).toHaveBeenCalledWith(
      'dbo.table4',
      undefined,
      expect.anything(),
      expect.anything()
    )

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table5', 'tbl5', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.fullOuterJoin).toHaveBeenCalledWith(
      'dbo.table5',
      'tbl5',
      expect.anything(),
      expect.anything()
    )

    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table6', 'tbl6', expect.anything(), expect.anything())
    expect(advancedHooks.onSelect.crossJoin).toHaveBeenCalledWith('dbo.table6', 'tbl6', expect.anything(), expect.anything())
  })

  test('insert', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onInsert: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    const table1row = { column1: 'column1' }
    await knexInstance('table1').insert(table1row)
    const table2rows = [{ column2: 'value1' }, { column2: 'value2' }]
    await knexInstance('table2').insert(table2rows)

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(filter).toHaveBeenCalledWith('table2')

    expect(hooks.onInsert).toHaveBeenCalledWith('table1', undefined, expect.anything(), table1row)
    expect(hooks.onInsert).toHaveBeenCalledWith('table2', undefined, expect.anything(), table2rows[0])
    expect(hooks.onInsert).toHaveBeenCalledWith('table2', undefined, expect.anything(), table2rows[1])
  })

  test('update', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onUpdate: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    const table1Updates = { column1: 'value1' }
    await knexInstance('table1').update(table1Updates)

    const table2Updates = { column2: 'value2' }
    await knexInstance('dbo.table2 as tbl2').update(table2Updates)

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(filter).toHaveBeenCalledWith('dbo.table2')

    expect(hooks.onUpdate).toHaveBeenCalledWith('table1', undefined, expect.anything(), table1Updates)
    expect(hooks.onUpdate).toHaveBeenCalledWith('dbo.table2', 'tbl2', expect.anything(), table2Updates)
  })

  test('delete', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onDelete: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance('table1').del()
    await knexInstance('dbo.table2 as tbl2').del()

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(filter).toHaveBeenCalledWith('dbo.table2')

    expect(hooks.onDelete).toHaveBeenCalledWith('table1', undefined, expect.anything())
    expect(hooks.onDelete).toHaveBeenCalledWith('dbo.table2', 'tbl2', expect.anything())
  })

  test('transaction', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    MSSQLMockKnex.client.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn(),
      onInsert: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn()
    }

    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    const insertedRow = { column1: 'value1' }
    const updates = { column1: 'value2' }

    //act
    await knexInstance.transaction(async trx => {
      await trx.select('column1').from('table1 as tbl1')

      await trx('table2').insert(insertedRow)

      await trx('dbo.table3').update(updates)

      await trx('dbo.table4 as tbl4').del()
    })

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(hooks.onSelect).toHaveBeenCalledWith('table1', 'tbl1', expect.anything(), expect.anything())

    expect(filter).toHaveBeenCalledWith('table2')
    expect(hooks.onInsert).toHaveBeenCalledWith('table2', undefined, expect.anything(), insertedRow)

    expect(filter).toHaveBeenCalledWith('dbo.table3')
    expect(hooks.onUpdate).toHaveBeenCalledWith('dbo.table3', undefined, expect.anything(), updates)

    expect(filter).toHaveBeenCalledWith('dbo.table4')
    expect(hooks.onDelete).toHaveBeenCalledWith('dbo.table4', 'tbl4', expect.anything())
  })

  test('count', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance('table1').count('column1', { as: 'c1' })
    await knexInstance('dbo.table2').count('column2')
    await knexInstance('table3 as tbl3').join('table4 as tbl4', 'tbl3.column3', 'tbl4.column4').count()

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(filter).toHaveBeenCalledWith('dbo.table2')
    expect(filter).toHaveBeenCalledWith('table3')
    expect(filter).toHaveBeenCalledWith('table4')

    expect(hooks.onSelect).toHaveBeenCalledWith('table1', undefined, expect.anything(), expect.anything())
    expect(hooks.onSelect).toHaveBeenCalledWith('dbo.table2', undefined, expect.anything(), expect.anything())
    expect(hooks.onSelect).toHaveBeenCalledWith('table3', 'tbl3', expect.anything(), expect.anything())
    expect(hooks.onSelect).toHaveBeenCalledWith('table4', 'tbl4', expect.anything(), expect.anything())
  })

  test('count modify first', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance
      .count('column1', { as: 'c1' })
      .modify(queryBuilder => {
        queryBuilder.from('table1')
      })
      .first()

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(hooks.onSelect).toHaveBeenCalledWith('table1', undefined, expect.anything(), expect.anything())
  })

  test('first', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance.table('table1').first('id', 'name')

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(hooks.onSelect).toHaveBeenCalledWith('table1', undefined, expect.anything(), expect.anything())
  })

  test('min', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance('table1').min('id')

    //assert
    expect(filter).toHaveBeenCalledWith('table1')
    expect(hooks.onSelect).toHaveBeenCalledWith('table1', undefined, expect.anything(), expect.anything())
  })

  test('raw does not break the filter', async () => {
    //arrange
    const knexInstance = knex({
      client: 'mssql'
    })
    mockDb.mock(knexInstance)

    const hooks = {
      onSelect: jest.fn()
    }
    const filter = jest.fn(() => hooks)
    registerFilter(filter, knexInstance)

    //act
    await knexInstance.raw('select \'test\'')

    //assert
    expect(filter).not.toHaveBeenCalled()
    expect(hooks.onSelect).not.toHaveBeenCalled()
  })
})

describe('create filter tests', () => {
  test('calls table predicate', () => {
    // arrange
    const tablePredicate: (tableName: Name) => boolean = jest.fn(() => true)
    const hooks: Hooks = {}

    // act
    createFilter(tablePredicate, hooks)(null)

    // assert
    expect(tablePredicate).toBeCalledTimes(1)
    expect(tablePredicate).toBeCalledWith(null)
  })

  test('returns given hook if table predicate results in true', () => {
    // arrange
    const tablePredicate: (tableName: Name) => boolean = jest.fn(() => true)
    const hooks: Hooks = {
      onSelect: (_table: Name, _alias: Name, _queryBuilder: Knex.QueryBuilder, _clause: FromClause & Knex.JoinClause) => {}
    }

    // act
    const res = createFilter(tablePredicate, hooks)(null)

    // assert
    expect(res).toBe(hooks)
    expect(res).not.toEqual({})
  })

  test('returns empty hook if table predicate results in false', () => {
    // arrange
    const tablePredicate: (tableName: Name) => boolean = jest.fn(() => false)
    const hooks: Hooks = {
      onSelect: (_table: Name, _alias: Name, _queryBuilder: Knex.QueryBuilder, _clause: FromClause & Knex.JoinClause) => {}
    }

    // act
    const res = createFilter(tablePredicate, hooks)(null)

    // assert
    expect(res).not.toBe(hooks)
    expect(res).toEqual({})
  })
})
