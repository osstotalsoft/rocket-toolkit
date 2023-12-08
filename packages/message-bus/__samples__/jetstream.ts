// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_URL = 'localhost:4222'
process.env.Messaging__Env = ''
process.env.Messaging__TopicPrefix = ''

import { messageBus, useTransport, transport } from '../src'
import { JetstreamConnection } from '../src/transport/jetstream/types'

async function main() {
  await ensureEventsStream()

  useTransport(transport.jetstream)
  const msgBus = messageBus()
  await msgBus.publish('ch.events.sdsd', { asa: 'asa' })
  await msgBus.transport.disconnect()
}

async function ensureEventsStream() {
  const jc = <JetstreamConnection>await transport.jetstream.connect()
  const nc = jc._natsConnection
  if (!nc) {
    throw new Error('Nats connection not set')
  }
  const jsm = await nc.jetstreamManager()
  await jsm.streams.add({ name: 'events', subjects: ['events.>', 'ch.events.>'] })
}

main()
