// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { SubscriptionOptions, Envelope, SerDes } from '../types'
import { EventEmitter } from 'events'
import nats from 'node-nats-streaming'
import BlueBird from 'bluebird'

export type Connection = nats.Stan | null
export type SubscriptionHandler = (envelope: Envelope<any>) => Promise<void>
export type MessageHandler = (message: nats.Message) => Promise<void>

export interface Subscription extends EventEmitter {
  unsubscribe?: () => Promise<unknown>
  _natsSubscription?: nats.Subscription
}

export interface Transport {
  connect(): Promise<Connection>
  disconnect(): Promise<void>
  publish(subject: string, envelope: Envelope<any>, serDes: SerDes): Promise<any>
  subscribe(
    subject: string,
    handler: SubscriptionHandler,
    opts: SubscriptionOptions,
    serDes: SerDes
  ): Promise<BlueBird<Subscription>>
}
