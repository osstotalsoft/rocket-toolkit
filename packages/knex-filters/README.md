# knex-filters

Knex filters

## installation

```javascript
npm install @totalsoft/knex-filters
```

## philosophy

With knex-filters you can register some hooks for some or any of your tables, that will be called when specific DDL statements occur: select, insert, update, delete.

> ⚠ Because of the nature of `knex.raw(...)` no filter will apply on these statements.

## filter

A filter is a function that receives a table and returns the hooks

```javascript
export interface FromClause {
  table: string
  only: boolean
  joinType: keyof Join
}
export type FromHook = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder, clause: FromClause) => void

export type JoinHook = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder, clause: Knex.JoinClause) => void

export interface AdvancedSelectHooks {
  from: FromHook
  innerJoin: JoinHook
  leftJoin: JoinHook
  rightJoin: JoinHook
  fullOuterJoin: JoinHook
  crossJoin: JoinHook
}

export type SimpleSelectHook = (
  table: Name,
  alias: Name,
  queryBuilder: Knex.QueryBuilder,
  clause: FromClause & Knex.JoinClause,
) => void

export type InsertHook = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder, inserted: any) => void

export type UpdateHook = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder, updates: any) => void

export type DeleteHook = (table: Name, alias: Name, queryBuilder: Knex.QueryBuilder) => void

export interface Hooks {
  onSelect?: SimpleSelectHook | AdvancedSelectHooks
  onInsert?: InsertHook
  onUpdate?: UpdateHook
  onDelete?: DeleteHook
}

export type Filter = (table: Name) => Hooks
```

## createfilter

While a filter is just a function, you can also create a filter from a table predicate and some hooks

```javascript
const filter = createFilter(
    (table)=> table == 'Products',
    {
        onSelect: (table, alias, queryBuilder, clause) => {
            queryBuilder.andWhere(`[${alias ?? table}].[isDeleted]`,'=',false)
        },
    },
  })
```

## registerFilter

Registers a filter with a Knex instance

```javascript
registerFilter(() => {
  onInsert: (table, alias, queryBuilder, inserted) => {
    inserted.CreatedBy = getLoggedInUserId()
  }
}, knex)
```

## BuildTableHasColumnPredicate type

Creates a table predicate that can be used within a filter, that passes if the received table has the specified column

```javascript
// Dummy builder predicate! You need to implement this.
const mssql: BuildTableHasColumnPredicate = (column, knex) => Promise.resolve(table => true)
// ----------------------------------------------------
const tableHasColumnIsDeleted = await mssql('IsDeleted', knex)
const filter = createFilter(tableHasColumnIsDeleted, softDeletesHooks)
```

## Example: tenancy filter

```javascript
async function registerTenancyFilter(columnTenantId, tenantId, knex) {
  const tableHasColumnTenantId = await mssql(columnTenantId, knex)

  const addWhereTenantIdClause = (table, alias, queryBuilder) => {
    queryBuilder.andWhere(`[${alias ?? table}].[${columnTenantId}]`, '=', tenantId)
  }

  const addOnTenantIdClause = (table, alias, _queryBuilder, joinClause) => {
    joinClause.andOnVal(`[${alias ?? table}].[${columnTenantId}]`, '=', tenantId)
  }

  const filter = createFilter(tableHasColumnTenantId, {
    onSelect: {
      from: addWhereTenantIdClause,
      innerJoin: addWhereTenantIdClause,
      leftJoin: addOnTenantIdClause
    },
    onUpdate: addWhereTenantIdClause,
    onDelete: addWhereTenantIdClause,
    onInsert: (_table, _alias, _queryBuilder, inserted) => {
      inserted[columnTenantId] = tenantId
    }
  })

  registerFilter(filter, knex)
}
```
