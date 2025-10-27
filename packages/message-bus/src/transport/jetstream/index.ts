// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import {
  connect as natsConnect, NatsConnection, JetStreamClient, Consumer,
  ConsumerConfig, ConsumerMessages,
  AckPolicy, DeliverPolicy, StringCodec
} from 'nats'
import { Mutex } from 'async-mutex'
// import uuid from 'uuid'
import { SubscriptionHandler, Transport } from '../types'
import { EventEmitter } from 'events'
import { JetstreamConnection, JetstreamSubscription } from './types'
import { Envelope, SerDes, SubscriptionOptions } from '../../types'

const {
  JETSTREAM_URL,
  JETSTREAM_CLIENT_ID,
  JETSTREAM_STREAM_PROCESSOR_MaxConcurrentMessages = '1',
  JETSTREAM_STREAM_PROCESSOR_AckWaitTime = '30000000000', // 30 seconds
  JETSTREAM_PUB_SUB_MaxConcurrentMessages = '100',
  JETSTREAM_PUB_SUB_AckWaitTime = '30000000000', // 30 seconds
  JETSTREAM_RPC_MaxConcurrentMessages = '1',
  JETSTREAM_RPC_AckWaitTime = '30000000000' // 30 seconds
} = process.env

//const clientID = `${JETSTREAM_CLIENT_ID}-${uuid.v4()}`
const natsConnectionMutex = new Mutex()
let natsConnection: NatsConnection | null = null

async function _connect() {
  if (natsConnection && !natsConnection.isClosed()) {
    return natsConnection
  }

  const release = await natsConnectionMutex.acquire()

  try {
    if (natsConnection && !natsConnection.isClosed()) {
      return natsConnection
    }

    try {
      natsConnection = await natsConnect({ servers: JETSTREAM_URL })
      natsConnection
        .closed()
        .then(err =>
          err ? console.error(`🛰️  Jetstream connection closed. ${err}`) : console.info('🛰️  Jetstream connection closed.')
        )
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
): Promise<JetstreamSubscription> {
  const nc = await _connect()
  const jsClient = nc.jetstream()
  const stream = await getStream(jsClient, subject)
  const consumer = await getConsumer(jsClient, subject, stream, opts)
  const ci = await consumer.info(true)
  const manualAck = ci.config.ack_policy == AckPolicy.Explicit || ci.config.ack_policy == AckPolicy.All
  const sc = StringCodec()

  const messagesIterator = await consumer.consume({ max_messages: getMaxMessages(opts) });

  (async () => {
    for await (const m of messagesIterator) {
      const envelope = serDes.deSerialize(sc.decode(m.data))
      await handler(envelope)
      if (manualAck) {
        m.ack()
      }
    }
  })()

  return jetstreamSubscription(messagesIterator)
}

async function getStream(jsClient: JetStreamClient, subject: string): Promise<string> {
  const jsm = await jsClient.jetstreamManager()
  const stream = await jsm.streams.find(subject)

  if (!stream) {
    throw new Error(`Jetstream stream cannot be resolved for subject ${subject}.`)
  }
  return stream
}

function getMaxMessages(opts: SubscriptionOptions): number {

  switch (opts) {
    case SubscriptionOptions.STREAM_PROCESSOR:
      return parseInt(JETSTREAM_STREAM_PROCESSOR_MaxConcurrentMessages, 10)

    case SubscriptionOptions.PUB_SUB:
      return parseInt(JETSTREAM_PUB_SUB_MaxConcurrentMessages, 10)

    case SubscriptionOptions.RPC:
      return parseInt(JETSTREAM_RPC_MaxConcurrentMessages, 10)

    default:
      throw new Error(`Unsupported subscription option: ${opts}`)
  }
}

async function getConsumer(
  jsClient: JetStreamClient,
  subject: string,
  stream: string,
  opts: SubscriptionOptions
): Promise<Consumer> {
  const jsm = await jsClient.jetstreamManager()
  const consumerCfg: Partial<ConsumerConfig> = {
    filter_subject: subject
  }
  switch (opts) {
    case SubscriptionOptions.STREAM_PROCESSOR:
      consumerCfg.durable_name = (JETSTREAM_CLIENT_ID + '__' + subject).replaceAll('.', '_')
      consumerCfg.deliver_policy = DeliverPolicy.All
      consumerCfg.ack_wait = parseInt(JETSTREAM_STREAM_PROCESSOR_AckWaitTime, 10)
      consumerCfg.ack_policy = AckPolicy.Explicit
      break

    case SubscriptionOptions.PUB_SUB:
      // ephemeral consumer
      consumerCfg.deliver_policy = DeliverPolicy.New
      consumerCfg.ack_wait = parseInt(JETSTREAM_PUB_SUB_AckWaitTime, 10)
      break

    case SubscriptionOptions.RPC:
      consumerCfg.deliver_policy = DeliverPolicy.New
      consumerCfg.ack_wait = parseInt(JETSTREAM_RPC_AckWaitTime, 10)
      break

    default:
      throw new Error(`Unsupported subscription option: ${opts}`)
  }

  const ci = await jsm.consumers.add(stream, consumerCfg)
  const consumer = await jsClient.consumers.get(stream, ci.name)
  return consumer
}

function jetstreamConnection(nc: NatsConnection): JetstreamConnection {
  const jc: any = new EventEmitter()
  jc._natsConnection = nc
  nc.closed().then(err => jc.emit('close', err))
  return jc
}

function jetstreamSubscription(messages: ConsumerMessages): JetstreamSubscription {
  const js = <JetstreamSubscription>new EventEmitter()
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
