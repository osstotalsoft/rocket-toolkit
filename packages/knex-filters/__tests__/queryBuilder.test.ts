// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { applyFilter, Filter } from '../src'
import * as R from 'ramda'

describe('apply filter tests', () => {
  test('circuit break if `_method` is undefined', () => {
    // arrange
    const filter: Filter = jest.fn()
    const queryBuilder = {}

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).not.toHaveBeenCalled()
  })

  test('circuit break if `onInsert` is not returned by filter', () => {
    // arrange
    const filter: Filter = jest.fn(() => ({}))
    const queryBuilder = { _method: 'insert', _single: {} }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledWith(null)
  })

  test('circuit break if `onUpdate` is not returned by filter', () => {
    // arrange
    const filter: Filter = jest.fn(() => ({}))
    const queryBuilder = { _method: 'update', _single: {} }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledWith(null)
  })

  test('circuit break if `onDelete` is not returned by filter', () => {
    // arrange
    const filter: Filter = jest.fn(() => ({}))
    const queryBuilder = { _method: 'del', _single: {} }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledWith(null)
  })

  test('circuit break if `onSelect` is not returned by filter', () => {
    // arrange
    const filter: Filter = jest.fn(() => ({}))
    const queryBuilder = { _method: 'select', _single: {}, _statements: [] }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledWith(null)
  })

  test('filter is called with table name', () => {
    // arrange
    const filter: Filter = jest.fn(() => ({}))
    const queryBuilder = { _method: 'insert', _single: { table: 'name' } }
    const qbBrackets = { _method: 'insert', _single: { table: '[name]' } }
    const qbAlias = { _method: 'insert', _single: { table: 'name as alias' } }

    // act
    applyFilter(filter, queryBuilder)
    applyFilter(filter, qbBrackets)
    applyFilter(filter, qbAlias)

    // assert
    expect(filter).toHaveBeenNthCalledWith(1, 'name')
    expect(filter).toHaveBeenNthCalledWith(2, 'name')
    expect(filter).toHaveBeenNthCalledWith(3, 'name')
  })

  test('on insert is called for each inserted', () => {
    // arrange
    const onInsert = jest.fn()
    const filter: Filter = jest.fn(() => ({ onInsert }))
    const queryBuilder = { _method: 'insert', _single: { insert: R.repeat({}, 5) } }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalled()
    expect(onInsert).toHaveBeenCalledTimes(5)
  })

  test('on update is called once', () => {
    // arrange
    const onUpdate = jest.fn()
    const filter: Filter = jest.fn(() => ({ onUpdate }))
    const queryBuilder = { _method: 'update', _single: { update: R.repeat({}, 5) } }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  test('on delete is called once', () => {
    // arrange
    const onDelete = jest.fn()
    const filter: Filter = jest.fn(() => ({ onDelete }))
    const queryBuilder = { _method: 'del', _single: {} }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  test('on select is called for each clause', () => {
    // arrange
    const onSelect = jest.fn()
    const filter: Filter = jest.fn(() => ({ onSelect }))
    const queryBuilder = { _method: 'any other', _single: {}, _statements: R.repeat({ joinType: 'cross' }, 5) }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledTimes(6)
    expect(onSelect).toHaveBeenCalledTimes(6)
  })

  test('on select is called for each type of clause', () => {
    // arrange
    const onSelect = {
      from: jest.fn(),
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
      rightJoin: jest.fn(),
      fullOuterJoin: jest.fn(),
      crossJoin: jest.fn()
    }
    const filter: Filter = jest.fn(() => ({ onSelect }))
    const queryBuilder = {
      _method: 'any other',
      _single: {},
      _statements: [
        { joinType: 'inner' },
        { joinType: 'left' },
        { joinType: 'left outer' },
        { joinType: 'right' },
        { joinType: 'right outer' },
        { joinType: 'full' },
        { joinType: 'full outer' },
        { joinType: 'cross' }
      ]
    }

    // act
    applyFilter(filter, queryBuilder)

    // assert
    expect(filter).toHaveBeenCalledTimes(9)
    expect(onSelect.from).toHaveBeenCalledTimes(1)
    expect(onSelect.innerJoin).toHaveBeenCalledTimes(1)
    expect(onSelect.leftJoin).toHaveBeenCalledTimes(2)
    expect(onSelect.rightJoin).toHaveBeenCalledTimes(2)
    expect(onSelect.fullOuterJoin).toHaveBeenCalledTimes(2)
    expect(onSelect.crossJoin).toHaveBeenCalledTimes(1)
  })
})
