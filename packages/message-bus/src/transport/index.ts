// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { BuiltInTransports, Transport } from './types'

import { default as nats } from './nats'
import { default as rusi } from './rusi'
import { default as jetstream } from './jetstream'

const transport: BuiltInTransports & { [key: string]: Transport } = {
  nats,
  rusi,
  jetstream
}

export default transport
