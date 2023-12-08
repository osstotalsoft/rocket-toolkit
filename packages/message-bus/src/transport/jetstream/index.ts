// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { AckPolicy, Consumer, ConsumerConfig, DeliverPolicy, JetStreamClient, NatsConnection, StringCodec, connect as natsConnect, ConsumerMessages } from 'nats'
import { Mutex } from 'async-mutex'
// import uuid from 'uuid'
import { Subscription, SubscriptionHandler, Transport } from '../types'
import { EventEmitter } from 'stream'
import { JetstreamConnection, JetstreamSubscription } from './types'
import { Envelope, SerDes, SubscriptionOptions } from '../../types'

const {
  // JETSTREAM_CLUSTER = '',
  JETSTREAM_URL,
  JETSTREAM_COMMANDS_STREAM,
  JETSTREAM_EVENTS_STREAM,
  JETSTREAM_CLIENT_ID,
  JETSTREAM_STREAM_PROCESSOR_MaxConcurrentMessages = '1',
  JETSTREAM_STREAM_PROCESSOR_AckWaitTime = '5000',
  JETSTREAM_PUB_SUB_MaxConcurrentMessages = '100',
  JETSTREAM_PUB_SUB_AckWaitTime = '5000',
  JETSTREAM_RPC_MaxConcurrentMessages = '1',
  JETSTREAM_RPC_AckWaitTime = '5000'
  // NATS_Q_GROUP = '',
  // NATS_DURABLE_NAME = '',
  // NATS_STREAM_PROCESSOR_MaxInflight = '',
  // NATS_STREAM_PROCESSOR_AckWait,
  // NATS_PUB_SUB_MaxInflight = '',
  // NATS_PUB_SUB_AckWait,
  // NATS_RPC_MaxInflight = '',
  // NATS_RPC_AckWait
} = process.env

//const clientID = `${JETSTREAM_CLIENT_ID}-${uuid.v4()}`
const natsConnectionMutex = new Mutex()
let natsConnection: NatsConnection | null = null

async function _connect() {
  if (natsConnection) {
    return natsConnection
  }

  const release = await natsConnectionMutex.acquire()

  try {
    if (natsConnection) {
      return natsConnection
    }

    try {
      natsConnection = await natsConnect({ servers: JETSTREAM_URL })
      natsConnection.closed().then(err => console.info(`🛰️  Jetstream connection closed. ${err}`))
    } catch (err: any) {
      console.error(`Jetstream connection error: ${err}`)
      throw err
    }
    return natsConnection

    // cn.on('error', err => console.error(`Nats connection error: ${err}`))
    // cn.on('permission_error', err => console.error(`Nats connection permission error: ${err}`))
    // cn.on('close', () => console.info('🛰️  Nats connection closed.'))
    // cn.on('disconnect', () => console.info('🛰️  Nats connection disconnected.'))
    // cn.on('reconnect', () => console.info('🛰️  Nats connection reconnected.'))
    // cn.on('reconnecting', () => console.info('🛰️  Nats connection reconnecting.'))
  } finally {
    release()
  }
}



async function connect() {
  const nc = await _connect()
  const jc = jetstreamConnection(nc)
  return jc
}

async function disconnect() {
  if (!natsConnection) {
    return
  }
  const release = await natsConnectionMutex.acquire()
  try {
    if (!natsConnection) {
      return
    }
    await natsConnection.close()
    natsConnection = null
  } finally {
    release()
  }
}

async function publish(subject: string, envelope: Envelope<any>, serDes: SerDes) {
  const nc = await _connect()
  const jsClient = nc.jetstream()
  const msg = serDes.serialize(envelope)
  const sc = StringCodec()
  const result = await jsClient.publish(subject, sc.encode(msg))
  return result
}

async function subscribe(
  subject: string,
  handler: SubscriptionHandler,
  opts: SubscriptionOptions,
  serDes: SerDes
): Promise<Subscription> {
  const nc = await _connect()
  const jsClient = nc.jetstream()
  const stream = getStream(subject)
  const [consumer, manualAck] = await getConsumer(jsClient, subject, stream, opts)
  const sc = StringCodec()
  // const messages: nats.ConsumerMessages = await consumer.consume()
  // const fireAndForget = (async (sub: nats.ConsumerMessages) => {
  //   for await (const m of sub) {
  //     const envelope = serDes.deSerialize(sc.decode(m.data))
  //     const r = handler(envelope)
  //     if (manualAck) {
  //       r.then(() => m.ack())
  //     }
  //   }
  // })

  // fireAndForget(messages)


  const messages = await consumer.consume({
    callback: (m) => {
      const envelope = serDes.deSerialize(sc.decode(m.data))
      const r = handler(envelope)
      if (manualAck) {
        r.then(() => m.ack())
      }
    },
  })



  // subscription.on('error', err => {
  //   console.error(`Nats subscription error for subject ${subject}: ${err}`)
  // })
  // subscription.on('timeout', err => {
  //   console.error(`Nats subscription timeout error for subject ${subject}: ${err}`)
  // })

  // subscription.on('unsubscribed', () => {
  //   console.info(`Unsubscribed from subject ${subject}.`)
  // })

  // subscription.on('closed', () => {
  //   console.info(`Subscription closed for subject ${subject}.`)
  // })

  // const result: Subscription = await new Promise((resolve, reject) => {
  //   subscription.on('ready', () => {
  //     resolve(wrapSubscription(subscription))
  //   })
  //   subscription.on('error', err => {
  //     reject(err)
  //   })
  // })

  return jetstreamSubscription(messages)
}

function getStream(subject: string): string {
  const stream = subject.toLowerCase().includes('commands') ? JETSTREAM_COMMANDS_STREAM : JETSTREAM_EVENTS_STREAM
  if (!stream) {
    throw new Error(`Jetstream stream not found for subject ${subject}.`)
  }
  return stream
}

async function getConsumer(
  jsClient: JetStreamClient,
  subject: string,
  stream: string,
  opts: SubscriptionOptions
): Promise<[Consumer, boolean]> {
  const jsm = await jsClient.jetstreamManager()
  const consumerCfg: Partial<ConsumerConfig> = {
    filter_subject: subject
  }
  let manualAck = false

  switch (opts) {
    case SubscriptionOptions.STREAM_PROCESSOR:
      consumerCfg.durable_name = (JETSTREAM_CLIENT_ID + subject).replace('.', '_')
      consumerCfg.deliver_policy = DeliverPolicy.All
      consumerCfg.ack_wait = parseInt(JETSTREAM_STREAM_PROCESSOR_AckWaitTime, 10)
      consumerCfg.max_ack_pending = parseInt(JETSTREAM_STREAM_PROCESSOR_MaxConcurrentMessages, 10)
      consumerCfg.ack_policy = AckPolicy.Explicit
      manualAck = true
      break

    case SubscriptionOptions.PUB_SUB:
      consumerCfg.name = (JETSTREAM_CLIENT_ID + subject).replace('.', '_')
      consumerCfg.deliver_policy = DeliverPolicy.New
      consumerCfg.ack_wait = parseInt(JETSTREAM_PUB_SUB_AckWaitTime, 10)
      consumerCfg.max_ack_pending = parseInt(JETSTREAM_PUB_SUB_MaxConcurrentMessages, 10)
      break

    case SubscriptionOptions.RPC:
      consumerCfg.deliver_policy = DeliverPolicy.New
      consumerCfg.ack_wait = parseInt(JETSTREAM_RPC_AckWaitTime, 10)
      consumerCfg.max_ack_pending = parseInt(JETSTREAM_RPC_MaxConcurrentMessages, 10)
      break

    default:
  }

  const ci = await jsm.consumers.add(stream, consumerCfg)
  const consumer = await jsClient.consumers.get(stream, ci.name)
  return [consumer, manualAck]
}

function jetstreamConnection(nc: NatsConnection): JetstreamConnection {
  const jc: any = new EventEmitter()
  jc._natsConnection = nc
  nc.closed().then(err => jc.emit('close', err))
  return jc
}

function jetstreamSubscription(messages: ConsumerMessages): JetstreamSubscription {
  const js: any = new EventEmitter()
  js._natsConsumerMessages = messages
  js.unsubscribe = async () => {
    await messages.close()
  }
  return js
}

const jetstreamTransport: Transport = {
  connect,
  disconnect,
  publish,
  subscribe
}

export default jetstreamTransport
