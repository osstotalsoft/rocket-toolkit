// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import EventEmitter from 'events'
import { NatsConnection, ConsumerMessages } from 'nats'

export interface JetstreamConnection extends EventEmitter {
  _natsConnection?: NatsConnection
}

export interface JetstreamSubscription extends EventEmitter {
  _natsConsumerMessages?: ConsumerMessages
}
