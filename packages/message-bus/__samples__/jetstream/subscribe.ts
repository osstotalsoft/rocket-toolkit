// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_STREAM_PROCESSOR_MaxConcurrentMessages = '2'
process.env.JETSTREAM_STREAM_PROCESSOR_AckWaitTime = '3000000000' // 3 seconds

import { ensureStreamsExist } from './util'
import { messageBus, useTransport, transport } from '../../src'

async function main() {
  await ensureStreamsExist()

  useTransport(transport.jetstream)
  const msgBus = messageBus()

  const sub = await msgBus.subscribe('events.my-event1', async _msg=> {
    console.log('Processing message...', _msg)
    await new Promise(r=>setTimeout(r, 50000))
    console.log('Message processed', _msg)
  } )
  await new Promise(r => setTimeout(r, 300000))
  await sub.unsubscribe()
  await msgBus.transport.disconnect()
}

main()
