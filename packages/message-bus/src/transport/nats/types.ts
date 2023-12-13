// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Subscription } from '../types'
import nats from 'node-nats-streaming'

export interface NatsSubscription extends Subscription {
  _natsSubscription?: nats.Subscription
}
