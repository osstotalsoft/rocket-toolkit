// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Knex } from 'knex'
import type { Filter, FromClause, Join, Name } from './types'

function applyOrMap(fn: (item: any, index?: number, array?: any[]) => unknown, objOrArray: object | Array<any>) {
  return Array.isArray(objOrArray) ? objOrArray.map(fn) : fn(objOrArray)
}

function splitTableAndAlias(table: Name): Array<Name> {
  if (typeof table != 'string') {
    return [null, null]
  }
  return table.split(/ as /i).map(x => x.trim().replace(/[[\]]/g, ''))
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function isFunction(f: any): f is Function {
  return typeof f === 'function'
}

function applyOnInsertFilter(filter: Filter, queryBuilder: any) {
  const [table, alias] = splitTableAndAlias(queryBuilder._single.table)
  const { onInsert } = filter(table)
  if (!onInsert) {
    return
  }
  applyOrMap(inserted => onInsert(table, alias, queryBuilder, inserted), queryBuilder._single.insert)
}

function applyOnSelectFilter(filter: Filter, queryBuilder: any) {
  const fromClause = queryBuilder._single
  const joinClauses = queryBuilder._statements.filter((st: any) => st.joinType !== undefined)
  const clauses: Array<FromClause & Knex.JoinClause> = [fromClause, ...joinClauses]

  const joinType2HookMapping: Join = {
    inner: 'innerJoin',
    left: 'leftJoin',
    'left outer': 'leftJoin',
    right: 'rightJoin',
    'right outer': 'rightJoin',
    full: 'fullOuterJoin',
    'full outer': 'fullOuterJoin',
    cross: 'crossJoin'
  }

  clauses.forEach(clause => {
    const [table, alias] = splitTableAndAlias(clause.table)
    const { onSelect } = filter(table)

    if (!onSelect) {
      return
    }

    const hook = isFunction(onSelect) ? onSelect : onSelect[clause.joinType ? joinType2HookMapping[clause.joinType] : 'from']
    if (hook && isFunction(hook)) {
      hook(table, alias, queryBuilder, clause)
    }
  })
}

function applyOnUpdateFilter(filter: Filter, queryBuilder: any) {
  const [table, alias] = splitTableAndAlias(queryBuilder._single.table)
  const { onUpdate } = filter(table)
  if (!onUpdate) {
    return
  }
  onUpdate(table, alias, queryBuilder, queryBuilder._single.update)
}

function applyOnDeleteFilter(filter: Filter, queryBuilder: any) {
  const [table, alias] = splitTableAndAlias(queryBuilder._single.table)
  const { onDelete } = filter(table)
  if (!onDelete) {
    return
  }
  onDelete(table, alias, queryBuilder)
}

export function applyFilter(filter: Filter, queryBuilder: any) {
  if (!queryBuilder?._method) return // skipping raw queries
  switch (queryBuilder._method) {
    case 'insert':
      applyOnInsertFilter(filter, queryBuilder)
      break
    case 'update':
      applyOnUpdateFilter(filter, queryBuilder)
      break
    case 'del':
      applyOnDeleteFilter(filter, queryBuilder)
      break
    default:
      applyOnSelectFilter(filter, queryBuilder)
  }
}
