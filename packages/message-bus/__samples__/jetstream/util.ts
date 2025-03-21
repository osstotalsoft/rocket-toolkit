// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_URL = 'localhost:4222'
process.env.Messaging__Env = ''
process.env.Messaging__TopicPrefix = ''
process.env.JETSTREAM_CLIENT_ID = 'rocket-samples'

process.env.JETSTREAM_STREAM_PROCESSOR_AckWaitTime = '5000000000000000'

import { transport } from '../../src'
import { JetstreamConnection } from '../../src/transport/jetstream/types'


export async function ensureStreamsExist() {
  const jc = <JetstreamConnection>await transport.jetstream.connect()
  const nc = jc._natsConnection
  if (!nc) {
    throw new Error('Nats connection not set')
  }
  const jsm = await nc.jetstreamManager()
  await jsm.streams.add({ name: 'events', subjects: ['events.>', 'ch.events.>'] })
}