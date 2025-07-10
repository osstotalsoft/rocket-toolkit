// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { SubscriptionOptions, Envelope, SerDes } from '../types'
import { EventEmitter } from 'events'

export type SubscriptionHandler = (envelope: Envelope<any>) => Promise<void>

export interface Subscription extends EventEmitter {
  unsubscribe: () => Promise<unknown>
}

export type Transport = {
  connect(): Promise<EventEmitter>
  disconnect(): Promise<void>
  publish(subject: string, envelope: Envelope<any>, serDes: SerDes): Promise<any>
  subscribe(
    subject: string,
    handler: SubscriptionHandler,
    opts: SubscriptionOptions,
    serDes: SerDes
  ): Promise<Subscription>
}

export type BuiltInTransports = {
  nats: Transport
  rusi: Transport
  jetstream: Transport
}
