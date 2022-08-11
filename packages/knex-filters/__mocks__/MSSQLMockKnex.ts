// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import Promise from 'bluebird'
import * as _ from 'lodash'

import { spec } from 'mock-knex/dist/platforms/knex/0.11'
import { makeClient } from 'mock-knex/dist/platforms/knex/0.8'

const connection = {
  __knexUid: 'mockedConnection',
  timeout: Promise.method(getConnection),
  beginTransaction: (callback: Function, _y: any, _z: any) => {
    callback()
  },
  commitTransaction: (callback: Function) => {
    callback()
  },
  rollbackTransaction: (callback: Function) => {
    callback()
  }
}

function getConnection(): any {
  return { ...connection }
}

export const newSpec = _.defaultsDeep(
  {
    replace: [
      {
        client: {
          acquireConnection() {
            return Promise.resolve(getConnection())
          },
          destroyRawConnection() {}
        }
      }
    ]
  },
  spec
)

export const client = makeClient(newSpec)
