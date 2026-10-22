// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.NATS_URL = 'nats://127.0.0.1:4223'
process.env.NATS_CLUSTER = 'test-cluster'
process.env.NATS_CLIENT_ID = 'rocket_sample'
process.env.NATS_Q_GROUP = 'rocket_sample'

import { messagingHost, SubscriptionOptions } from '../src'

const topics = ['rocket.sample.topic.1', 'rocket.sample.topic.2']

const msgHost = messagingHost()
msgHost
  .subscribe(topics, SubscriptionOptions.PUB_SUB)
  .use(async (ctx, next) => {
    console.log(`received msg from topic ${ctx.received.topic}`)
    await next()
  })
  .start()
  .catch(err => {
    console.error(err)
    setImmediate(() => {
      throw err
    })
  })
  .then(() => {
    setInterval(() => {
      msgHost._messageBus.publish(topics[0], { hello: 'world' }).catch(console.error)
    }, 5000)
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
