import { Knex } from 'knex'
import { applyFilter } from './queryBuilder'
import type { Filter, Hooks, Name } from './types'

export type registerFilter = (filter: Filter, knex: Knex<any, any>) => void

/**
 *
 * Creates a filter that will call the hooks when the tablePredicate passes
 * @see link TBD
 */
export function createFilter(tablePredicate: (table: Name) => boolean, hooks: Hooks): Filter {
  return table => {
    return tablePredicate(table) ? hooks : {}
  }
}

/**
 *
 * Registers a filter with a Knex instance
 * @see link TBD
 */
export function registerFilter(filter: Filter, knex: Knex<any, any>): void {
  function extendKnex(knex: Knex<any, any>) {
    const innerRunner = knex.client.runner
    knex.client.runner = (builder: any) => {
      applyFilter(filter, builder)
      return innerRunner.call(knex.client, builder)
    }
  }

  extendKnex(knex)

  const innerTransaction = knex.client.transaction
  knex.client.transaction = function (container: any, config: any, outerTx: any): Knex.Transaction {
    const wrapper = function (trx: Knex<any, any>) {
      extendKnex(trx)
      return container(trx)
    }
    return innerTransaction.call(knex.client, wrapper, config, outerTx)
  }
}
