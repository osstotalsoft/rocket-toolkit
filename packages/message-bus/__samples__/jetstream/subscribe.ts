// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { ensureStreamsExist } from './util'
import { messageBus, useTransport, transport } from '../../src'

async function main() {
  await ensureStreamsExist()

  useTransport(transport.jetstream)
  const msgBus = messageBus()

  const sub = await msgBus.subscribe('events.my-event1', _msg=> Promise.resolve())
  await new Promise(r => setTimeout(r, 20000))
  await sub.unsubscribe()
  await msgBus.transport.disconnect()
}

main()
