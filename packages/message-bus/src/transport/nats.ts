// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import nats from 'node-nats-streaming'
import { v4 } from 'uuid'
import Promise from 'bluebird'
import { SerDes, SubscriptionOptions } from '../types'
import { Mutex } from 'async-mutex'
import EventEmitter from 'events'
import { timeout } from '../timeout'
import { Connection, MessageHandler, Subscription, SubscriptionHandler, Transport } from './types'

const {
  NATS_CLIENT_ID,
  NATS_CLUSTER = '',
  NATS_URL,
  NATS_Q_GROUP = '',
  NATS_DURABLE_NAME = '',
  NATS_STREAM_PROCESSOR_MaxInflight = '',
  NATS_STREAM_PROCESSOR_AckWait,
  NATS_PUB_SUB_MaxInflight = '',
  NATS_PUB_SUB_AckWait,
  NATS_RPC_MaxInflight = '',
  NATS_RPC_AckWait
} = process.env

const clientID = `${NATS_CLIENT_ID}-${v4()}`
const connectionMutex = new Mutex()
let connection: Connection = null

export async function connect() {
  if (connection) {
    return connection
  }

  const release = await connectionMutex.acquire()
  try {
    if (connection) {
      return connection
    }
    const cn = nats.connect(NATS_CLUSTER, clientID, { url: NATS_URL })
    cn.on('error', err => console.error(`Nats connection error: ${err}`))
    cn.on('permission_error', err => console.error(`Nats connection permission error: ${err}`))
    cn.on('close', () => console.info('🛰️  Nats connection closed.'))
    cn.on('disconnect', () => console.info('🛰️  Nats connection disconnected.'))
    cn.on('reconnect', () => console.info('🛰️  Nats connection reconnected.'))
    cn.on('reconnecting', () => console.info('🛰️  Nats connection reconnecting.'))
    await new Promise((resolve, reject) => {
      cn.on('connect', () => {
        resolve()
      })
      cn.on('error', err => {
        reject(err)
      })
    })
    connection = cn
    return connection
  } finally {
    release()
  }
}

export async function disconnect() {
  if (!connection) {
    return
  }
  const release = await connectionMutex.acquire()
  try {
    if (!connection) {
      return
    }
    connection.close()
    connection = null
  } finally {
    release()
  }
}

export async function publish(subject: string, envelope: any, serDes: SerDes) {
  const client = await connect()
  const _publish = Promise.promisify(client.publish, {
    context: client
  })
  const msg = serDes.serialize(envelope)
  const result = await _publish(subject, msg)
  return result
}

export async function subscribe(
  subject: string,
  handler: SubscriptionHandler,
  opts: SubscriptionOptions,
  serDes: SerDes
): globalThis.Promise<Promise<Subscription>> {
  const client = await connect()
  const natsOpts = client.subscriptionOptions()
  let useQGroup = false
  switch (opts) {
    case SubscriptionOptions.STREAM_PROCESSOR:
      useQGroup = true
      natsOpts.setDurableName(NATS_DURABLE_NAME)
      natsOpts.setDeliverAllAvailable()
      natsOpts.setMaxInFlight(parseInt(NATS_STREAM_PROCESSOR_MaxInflight, 10) || 1)
      if (NATS_STREAM_PROCESSOR_AckWait) {
        natsOpts.setAckWait(parseInt(NATS_STREAM_PROCESSOR_AckWait, 10))
      }
      natsOpts.setManualAckMode(true)
      break
    case SubscriptionOptions.PUB_SUB:
      useQGroup = true
      natsOpts.setStartAt(nats.StartPosition.NEW_ONLY)
      natsOpts.setMaxInFlight(parseInt(NATS_PUB_SUB_MaxInflight, 10) || 100)
      if (NATS_PUB_SUB_AckWait) {
        natsOpts.setAckWait(parseInt(NATS_PUB_SUB_AckWait, 10))
      }
      break
    case SubscriptionOptions.RPC:
      useQGroup = false
      natsOpts.setStartAt(nats.StartPosition.NEW_ONLY)
      natsOpts.setMaxInFlight(parseInt(NATS_RPC_MaxInflight, 10) || 1)
      if (NATS_RPC_AckWait) {
        natsOpts.setAckWait(parseInt(NATS_RPC_AckWait, 10))
      }
      break
    default:
  }

  const stanMsgHandler: MessageHandler = async msg => {
    const envelope = serDes.deSerialize(msg.getData())
    await handler(envelope)
    if (natsOpts.manualAcks) {
      msg.ack()
    }
  }

  const subscription = useQGroup ? client.subscribe(subject, NATS_Q_GROUP, natsOpts) : client.subscribe(subject, natsOpts)

  subscription.on('message', stanMsgHandler)
  subscription.on('error', err => {
    console.error(`Nats subscription error for subject ${subject}: ${err}`)
  })
  subscription.on('timeout', err => {
    console.error(`Nats subscription timeout error for subject ${subject}: ${err}`)
  })

  subscription.on('unsubscribed', () => {
    console.info(`Unsubscribed from subject ${subject}.`)
  })

  subscription.on('closed', () => {
    console.info(`Subscription closed for subject ${subject}.`)
  })

  const result: Subscription = await new Promise((resolve, reject) => {
    subscription.on('ready', () => {
      resolve(wrapSubscription(subscription))
    })
    subscription.on('error', err => {
      reject(err)
    })
  })

  return result
}

function wrapSubscription(natsSubscription: nats.Subscription) {
  const sub: Subscription = new EventEmitter()
  sub.on('removeListener', (event, listener) => {
    natsSubscription.removeListener(event, listener)
  })
  sub.on('newListener', (event, listener) => {
    natsSubscription.on(event, listener)
  })
  sub.unsubscribe = function unsubscribe() {
    return timeout(
      new Promise((resolve, reject) => {
        natsSubscription.on('closed', () => {
          resolve()
        })
        natsSubscription.on('error', err => {
          reject(err)
        })
        natsSubscription.close()
      }),
      5000,
      new Error('Nats subscription unsubscribe timed out')
    )
  }
  sub._natsSubscription = natsSubscription
  return sub
}

const natsTransport: Transport = {
  connect,
  disconnect,
  publish,
  subscribe
}

export default natsTransport
