// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BuiltInTransports, Transport } from './types'

import { default as nats } from './nats/index'
import { default as rusi } from './rusi/index'
import { default as jetstream } from './jetstream/index'

const transport: BuiltInTransports & { [key: string]: Transport } = {
  nats,
  rusi,
  jetstream
}

export default transport
