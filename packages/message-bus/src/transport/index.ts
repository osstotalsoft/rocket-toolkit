// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BuiltInTransports, Transport } from './types.js'

import { default as nats } from './nats/index.js'
import { default as rusi } from './rusi/index.js'
import { default as jetstream } from './jetstream/index.js'

const transport: BuiltInTransports & { [key: string]: Transport } = {
  nats,
  rusi,
  jetstream
}

export default transport
