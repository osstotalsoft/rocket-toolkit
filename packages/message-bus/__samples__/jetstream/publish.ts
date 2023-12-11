// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_URL = 'localhost:4222'
import { ensureStreamsExist } from './util'
import { messageBus, useTransport, transport } from '../../src'

async function main() {
  await ensureStreamsExist()

  useTransport(transport.jetstream)
  const msgBus = messageBus()
  await msgBus.publish('events.my-event1', { asa: 'asa' })
  await msgBus.transport.disconnect()
}

main()
