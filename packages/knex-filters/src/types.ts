// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Knex } from 'knex'

export type Name = string | null

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

export type buildTableHasColumnPredicate = (column: Name, knex: Knex<any, any>) => Promise<(table: Name) => boolean>

export interface FromClause {
  table: Name
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
  clause: FromClause & Knex.JoinClause
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
