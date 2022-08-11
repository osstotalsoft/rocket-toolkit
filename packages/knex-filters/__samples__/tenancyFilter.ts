// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { createFilter, registerFilter, mssql, Name } from '../src'
import { Knex } from 'knex'

async function registerTenancyFilter(columnTenantId: string, tenantId: any, knex: Knex<any, any>) {
  const tableHasColumnTenantId = await mssql(columnTenantId, knex)

  const addWhereTenantIdClause = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder): void => {
    queryBuilder.andWhere(`[${alias ?? table}].[${columnTenantId}]`, '=', tenantId)
  }

  const addOnTenantIdClause = (table: Name, alias: Name, _queryBuilder: Knex.QueryBuilder, joinClause: Knex.JoinClause) => {
    joinClause.andOnVal(`[${alias ?? table}].[${columnTenantId}]`, '=', tenantId)
  }

  const filter = createFilter(tableHasColumnTenantId, {
    onSelect: {
      from: addWhereTenantIdClause,
      innerJoin: addWhereTenantIdClause,
      leftJoin: addOnTenantIdClause,
      rightJoin: addOnTenantIdClause,
      fullOuterJoin: addOnTenantIdClause,
      crossJoin: addOnTenantIdClause
    },
    onUpdate: addWhereTenantIdClause,
    onDelete: addWhereTenantIdClause,
    onInsert: (_table, _alias, _queryBuilder, inserted) => {
      inserted[columnTenantId] = tenantId
    }
  })

  registerFilter(filter, knex)
}

export default registerTenancyFilter
