// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as R from 'ramda'
import type { buildTableHasColumnPredicate, name } from '../types'
import { Knex } from 'knex'

async function getTablesWithColumn(column: name, knex: Knex<any, any>): Promise<any[]> {
  const data = await knex
    .distinct('TABLE_NAME as [table]', 'TABLE_SCHEMA as [schema]')
    .from('INFORMATION_SCHEMA.COLUMNS')
    .where('COLUMN_NAME', '=', column)
  return data
}

async function getDefaultSchemaAndDbName(knex: Knex<any, any>): Promise<[any, any]> {
  const data = await knex.raw('select SCHEMA_NAME() as [schema], DB_NAME() as [db]')
  return [data[0].schema, data[0].db]
}

function decompose(tableName: name): [name, name, name] {
  if (!tableName) return [null, null, null]
  const components = tableName.split('.').map(x => x.trim().replace('[', '').replace(']', ''))

  if (components.length == 1) {
    return [null, null, components[0]]
  } else if (components.length == 2) {
    return [null, components[0], components[1]]
  } else {
    return [components[0], components[1], components[2]]
  }
}

const mssql: buildTableHasColumnPredicate = async (column: name, knex: Knex<any, any>) => {
  const [defaultSchema, dbName] = await getDefaultSchemaAndDbName(knex)
  const tables = await getTablesWithColumn(column, knex)
  const propSchema: (obj: Record<'schema', any>) => string = R.prop('schema')

  const entries = R.compose(
    R.map(([k, v]): [string, Set<typeof v>] => [k, new Set(R.map(R.prop('table'), v))]),
    R.toPairs,
    R.groupBy(propSchema)
  )(tables)

  const map = new Map(entries)

  return function tableHasColumn(tableName) {
    const [db, _schema, table] = decompose(tableName)
    if (db && db != dbName) {
      return false
    }
    const schema = _schema ?? defaultSchema
    return Boolean(map.has(schema) && map?.get(schema)?.has(table))
  }
}

export default mssql
