// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Knex } from 'knex'

export type name = string | null

export type hookMapping = 'innerJoin' | 'leftJoin' | 'rightJoin' | 'fullOuterJoin' | 'crossJoin'

export interface Join {
  inner: hookMapping
  left: hookMapping
  'left outer': hookMapping
  right: hookMapping
  'right outer': hookMapping
  full: hookMapping
  'full outer': hookMapping
  cross: hookMapping
}

export type buildTableHasColumnPredicate = (column: name, knex: Knex<any, any>) => Promise<(table: name) => boolean>

export interface FromClause {
  table: name
  only: boolean
  joinType: keyof Join
}

export type FromHook = (table: name, alias: name, queryBuilder: Knex.QueryBuilder, clause: FromClause) => void

export type JoinHook = (table: name, alias: name, queryBuilder: Knex.QueryBuilder, clause: Knex.JoinClause) => void

export interface AdvancedSelectHooks {
  from: FromHook
  innerJoin: JoinHook
  leftJoin: JoinHook
  rightJoin: JoinHook
  fullOuterJoin: JoinHook
  crossJoin: JoinHook
}

export type SimpleSelectHook = (
  table: name,
  alias: name,
  queryBuilder: Knex.QueryBuilder,
  clause: FromClause & Knex.JoinClause
) => void

export type InsertHook = (table: name, alias: name, queryBuilder: Knex.QueryBuilder, inserted: any) => void

export type UpdateHook = (table: name, alias: name, queryBuilder: Knex.QueryBuilder, updates: any) => void

export type DeleteHook = (table: name, alias: name, queryBuilder: Knex.QueryBuilder) => void

export interface Hooks {
  onSelect?: SimpleSelectHook | AdvancedSelectHooks
  onInsert?: InsertHook
  onUpdate?: UpdateHook
  onDelete?: DeleteHook
}

export type Filter = (table: name) => Hooks
