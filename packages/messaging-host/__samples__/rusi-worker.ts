// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.Messaging__Transport = 'rusi'
process.env.Messaging__Host__ConnectionErrorStrategy = 'retry'
process.env.RUSI_GRPC_PORT = '50003'
process.env.RUSI_PUB_SUB_NAME = 'natsstreaming-pubsub'

import { messagingHost, SubscriptionOptions } from '../src'

const topics = ['rocket.rusi.sample.topic.1']

const msgHost = messagingHost()
msgHost
  .subscribe(topics, SubscriptionOptions.STREAM_PROCESSOR)
  .use(async (ctx, next) => {
    console.log(`received msg from MSG_HOST topic ${ctx.received.topic}`)
    await next()
  })
  .start()
  .catch(err => {
    console.error(err)
    setImmediate(() => {
      throw err
    })
  })
  .then(async () => {
    await msgHost._messageBus.publish(topics[0], { hello: 'world' })
    await new Promise(resolve => {
      setTimeout(resolve, 5000)
    })
  })

process.on('uncaughtException', function (error, origin) {
  msgHost.stopImmediate()
  throw new Error(`Exception occurred while processing the request: ${error}\n` + `Exception origin: ${origin}`)
})

process.on('SIGINT', () => {
  msgHost.stopImmediate()
})
process.on('SIGTERM', () => {
  msgHost.stopImmediate()
})
