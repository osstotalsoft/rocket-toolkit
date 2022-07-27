// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as R from 'ramda'
import type { buildTableHasColumnPredicate, name } from '../types'
import { Knex } from 'knex'

const getDefaultSchemaAndDbName = async (knex: Knex<any, any>): Promise<[any, any]> => {
  const data = await knex.raw('select current_schema() as "schema", current_database() as "db"')
  const schema = data?.rows[0]?.schema
  const db = data?.rows[0]?.db
  return [schema, db]
}

const getTablesWithColumn = async (column: name, knex: Knex<any, any>): Promise<any[] | null> => {
  if (!knex || !column) return null

  const data = await knex
    .distinct('table_name as table', 'table_schema as schema')
    .from('information_schema.columns')
    .where('column_name', '=', column.toLowerCase())
  return data
}

const decompose = (tableName: name): [name, name, name] => {
  if (!tableName) return [null, null, null]
  const components = tableName.split('.').map(x => x.trim().replace(/"/g, ''))

  if (components.length == 1) {
    return [null, null, components[0].toLowerCase()]
  } else if (components.length == 2) {
    return [null, components[0].toLowerCase(), components[1].toLowerCase()]
  } else {
    return [components[0].toLowerCase(), components[1].toLowerCase(), components[2].toLowerCase()]
  }
}

const pg: buildTableHasColumnPredicate = async (column: name, knex: Knex<any, any>) => {
  const [defaultSchema, dbName] = await getDefaultSchemaAndDbName(knex)

  const tablesWithColumn = await getTablesWithColumn(column, knex)
  if (!tablesWithColumn) return () => false
  const propSchema: (obj: Record<'schema', any>) => string = R.prop('schema')

  const entries = R.compose(
    R.map(([k, v]): [string, Set<typeof v>] => [k, new Set(R.map(R.prop('table'), v))]),
    R.toPairs,
    R.groupBy(propSchema)
  )(tablesWithColumn)
  const map = new Map(entries)

  return function tableHasColumn(tableName) {
    const [db, _schema, table] = decompose(tableName)
    if (db && db != dbName) {
      return false
    }
    const schema = _schema ?? defaultSchema
    const tableHasColumn = map.has(schema) && map?.get(schema)?.has(table)
    return Boolean(tableHasColumn)
  }
}

export default pg
