// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as transport from './transport'
import * as topicRegistry from './topicRegistry'
import defaultSerDes from './serDes'
import {
  Context,
  Envelope,
  EnvelopeCustomizer,
  isTransportType,
  MessageBus,
  MessageBusHandler,
  SerDes,
  SubscriptionOptions,
  TransportType
} from './types'
import { envelope } from './envelope'
import { Subscription, Transport } from './transport/types'

const { Messaging__Transport } = process.env
const envTransport: TransportType = isTransportType(Messaging__Transport) ? Messaging__Transport : 'nats'

let currentTransport: Transport = transport[envTransport]

export function useTransport(t: Transport) {
  currentTransport = t
}

let currentSerDes = defaultSerDes

export function useSerDes(s: SerDes) {
  currentSerDes = s
}

function _messageBus(transport: Transport, serDes: SerDes): MessageBus {
  async function publish<T>(
    topic: string,
    msg: T,
    ctx?: Context,
    envelopeCustomizer?: EnvelopeCustomizer
  ): Promise<Envelope<T>> {
    const fullTopicName = topicRegistry.getFullTopicName(topic)

    const envelopedMsg = envelope(msg, ctx, envelopeCustomizer)
    try {
      await transport.publish(fullTopicName, envelopedMsg, serDes)
      console.info(`✉   Message published to topic ${fullTopicName}`)
      return envelopedMsg
    } catch (err) {
      throw new Error(`Message publishing failed! The following error was encountered: ${err}`)
    }
  }

  async function subscribe(
    topic: string,
    handler: MessageBusHandler,
    opts: SubscriptionOptions = SubscriptionOptions.STREAM_PROCESSOR
  ): Promise<Subscription> {
    const fullTopicName = topicRegistry.getFullTopicName(topic)
    function h(e: Envelope<any>) {
      setImmediate(_ => {
        console.info(`✉   Received a message from ${fullTopicName}`)
      })
      return handler(e)
    }

    const subscription = await transport.subscribe(fullTopicName, h, opts, serDes)
    console.info(`📌  Subscribed to ${fullTopicName}`)

    return subscription
  }

  type Resolver = (arg: [topic: string, ev: Envelope<any>]) => void

  async function sendCommandAndReceiveEvent(
    topic: string,
    command: any,
    events: string[],
    ctx?: Context,
    envelopeCustomizer?: EnvelopeCustomizer,
    timeoutMs = 20000
  ): Promise<[string, any]> {
    let resolveEventReceived: Resolver | null = null
    let publishedMsg: Envelope<any> | null = null

    const subscriptions = await Promise.all(
      events.map(eventTopic =>
        subscribe(
          eventTopic,
          ev => {
            if (!publishedMsg) return Promise.reject('Message missing')
            if (!resolveEventReceived) return Promise.reject('Resolver not set')
            if (envelope.getCorrelationId(ev) != envelope.getCorrelationId(publishedMsg)) return Promise.reject()
            resolveEventReceived([eventTopic, ev])
            return Promise.resolve()
          },
          SubscriptionOptions.RPC
        )
      )
    )

    publishedMsg = await publish(topic, command, ctx, envelopeCustomizer)

    try {
      const result: [string, any] = await new Promise((resolve, reject) => {
        resolveEventReceived = resolve
        setTimeout(() => {
          reject(new Error('Message timeout occurred.'))
        }, timeoutMs)
      })
      return result
    } finally {
      for (const subscription of subscriptions) {
        if (!subscription) continue
        subscription.unsubscribe?.call(subscription).catch(err => {
          console.error(`Unsubscribe failed! The following error was encountered: ${err}`)
        })
      }
    }
  }

  return {
    publish,
    subscribe,
    sendCommandAndReceiveEvent,
    transport,
    serDes
  }
}

export function messageBus(): MessageBus {
  return _messageBus(currentTransport, currentSerDes)
}
