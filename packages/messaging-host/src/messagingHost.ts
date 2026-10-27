// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { EventEmitter } from 'events'
import polly from 'polly-js'
import { messageBus, Envelope, MessageBus, SubscriptionOptions } from '@totalsoft/message-bus'
import { empty, concat, run } from './pipeline'
import type { ErrorStrategies, ErrorStrategy, MessagingHost, MessagingHostContext, MessagingHostMiddleware } from './types'

type Subscription = Awaited<ReturnType<MessageBus['subscribe']>>

const {
  Messaging__Host__ConnectionErrorStrategy,
  Messaging__Host__SubscriptionErrorStrategy,
  Messaging__Host__StartRetryCount
} = process.env

export function messagingHost(): MessagingHost {
  let _isStarted = false
  let _isStarting = false
  let _isStopping = false

  const subscriptionOptions: Record<string, SubscriptionOptions | undefined> = {}
  let pipeline: MessagingHostMiddleware = empty
  const msgBus = messageBus()
  let subscriptions: Subscription[] = []
  let connection: EventEmitter | null = null

  let connectionErrorHandler = function connectionErrorHandler(err: Error) {
    const h = errorStrategy[Messaging__Host__ConnectionErrorStrategy as keyof ErrorStrategies] || errorStrategy.retry
    h(err, connection, msgHost)
  }

  let subscriptionErrorHandler = function subscriptionErrorHandler(err: Error) {
    const h = errorStrategy[Messaging__Host__SubscriptionErrorStrategy as keyof ErrorStrategies] || errorStrategy.retry
    h(err, connection, msgHost)
  }

  function use(middleware: MessagingHostMiddleware) {
    pipeline = concat(middleware, pipeline)
    return msgHost
  }

  function subscribe(topics: string[], opts?: SubscriptionOptions) {
    for (const topic of topics) {
      subscriptionOptions[topic] = opts
    }
    return msgHost
  }

  function onConnectionError(handler: ErrorStrategy) {
    connectionErrorHandler = function connectionErrorHandler(err) {
      handler(err, connection, msgHost)
    }
    return msgHost
  }

  function onSubscriptionError(handler: ErrorStrategy) {
    subscriptionErrorHandler = function subscriptionErrorHandler(err) {
      handler(err, connection, msgHost)
    }
    return msgHost
  }

  async function _start({ count }: { count: number }) {
    _isStarting = true
    try {
      const action = count == 0 ? 'starting' : `re-starting(${count})`
      console.info(`Messaging Host is ${action}...`)
      msgHost.emit('starting', { count })

      connection = await msgBus.transport.connect()
      connection.on('error', connectionErrorHandler)
      connection.on('close', connectionErrorHandler)

      const subs = Object.entries(subscriptionOptions).map(([topic, opts]) =>
        msgBus.subscribe(topic, msg => run(pipeline, _contextFactory(topic, msg)), opts)
      )
      subscriptions = await Promise.all(subs)
      subscriptions.forEach(sub => {
        sub.on('error', subscriptionErrorHandler)
      })
      console.info('🚀  Messaging host ready')
      msgHost.emit('started', { count })
      _isStarted = true
    } finally {
      _isStarting = false
    }
  }

  async function start() {
    await polly()
      .logger(console.error)
      .waitAndRetry(parseInt(Messaging__Host__StartRetryCount ?? '', 10) || 10)
      .executeForPromise(_start)
    return msgHost
  }

  async function stop() {
    _isStopping = true
    try {
      console.info('Messaging Host is shutting down...')
      msgHost.emit('stopping')

      if (connection) {
        connection.removeListener('error', connectionErrorHandler)
        connection.removeListener('close', connectionErrorHandler)
      }

      subscriptions.forEach(sub => {
        sub.removeListener('error', subscriptionErrorHandler)
      })
      await Promise.allSettled(subscriptions.map(subscription => subscription.unsubscribe()))
      await msgBus.transport.disconnect()
      msgHost.emit('stopped')
      _isStarted = false
    } finally {
      _isStopping = false
    }
  }

  function stopImmediate() {
    _isStopping = true

    console.info('Messaging Host is shutting down...')
    if (connection) {
      connection.removeListener('error', connectionErrorHandler)
      connection.removeListener('close', connectionErrorHandler)
    }
    try {
      subscriptions.forEach(sub => {
        sub.removeListener('error', subscriptionErrorHandler)
        sub.unsubscribe() // we don't wait for the promise to resolve
      })
      msgBus.transport.disconnect() // we don't wait for the promise to resolve
    } catch {
      //there is nothing we can do
    }
    _isStarted = false
    _isStopping = false
  }

  function isRunning() {
    return _isStarted && !_isStarting && !_isStopping
  }

  function _contextFactory(topic: string, msg: Envelope<any>): MessagingHostContext {
    return { received: { topic, msg } }
  }

  const msgHost: MessagingHost = Object.assign(new EventEmitter(), {
    use,
    subscribe,
    onConnectionError,
    onSubscriptionError,
    start,
    stop,
    stopImmediate,
    isRunning,
    _contextFactory,
    _messageBus: msgBus
  })

  return msgHost
}

export const errorStrategy: ErrorStrategies = {
  none: function noneStrategy(_err, _cn, _msgHost) {
    // do nothing
  },
  throw: function throwStrategy(err, _cn, _msgHost) {
    throw new Error(`Messaging Host failure: ${err?.message ?? err}`)
  },
  retry: function retryStrategy(_err, _cn, msgHost) {
    msgHost
      .stop()
      .catch(console.error)
      .then(msgHost.start)
      .catch(err => {
        console.error(err)
        setImmediate(() => {
          throw new Error(`Messaging Host failure: ${err?.message ?? err}`)
        })
      })
  }
}
