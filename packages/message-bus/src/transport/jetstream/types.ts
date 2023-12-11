// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import EventEmitter from 'events'
import { NatsConnection, ConsumerMessages } from 'nats'
import { Subscription } from '../types'

export interface JetstreamConnection extends EventEmitter {
  _natsConnection?: NatsConnection
}

export interface JetstreamSubscription extends Subscription {
  _natsConsumerMessages?: ConsumerMessages
}
