// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Mutex } from 'async-mutex'
import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import Promise from 'bluebird'
import { SubscriptionOptions } from '../../types'
import EventEmitter from 'events'

const {
  RUSI_GRPC_ENDPOINT,
  RUSI_GRPC_PORT,
  RUSI_STREAM_PROCESSOR_MaxConcurrentMessages,
  RUSI_STREAM_PROCESSOR_AckWaitTime,
  RUSI_PUB_SUB_MaxConcurrentMessages,
  RUSI_PUB_SUB_AckWaitTime,
  RUSI_RPC_MaxConcurrentMessages,
  RUSI_RPC_AckWaitTime,
  RUSI_PUB_SUB_NAME
} = process.env

const PROTO_PATH = __dirname + '/rusi.proto'

const clientMutex = new Mutex()
let client = null

async function _connect() {
  if (client) {
    return client
  }

  const release = await clientMutex.acquire()
  try {
    if (client) {
      return client
    }

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })
    const rusi_proto = grpc.loadPackageDefinition(packageDefinition).rusi.proto.runtime.v1

    const c = new rusi_proto.Rusi(
      RUSI_GRPC_ENDPOINT || 'localhost:' + (RUSI_GRPC_PORT || 50003),
      grpc.credentials.createInsecure()
    )
    await new Promise((resolve, reject) => {
      const timeoutMilliseconds = 1000
      const deadline = Date.now() + timeoutMilliseconds
      c.waitForReady(deadline, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    client = c
    return client
  } finally {
    release()
  }
}

export async function connect() {
  const c = await _connect()
  return wrapClient(c)
}

export async function disconnect() {
  if (!client) {
    return
  }
  const release = await clientMutex.acquire()
  try {
    if (!client) {
      return
    }
    client.close()
    client = null
  } finally {
    release()
  }
}

export async function publish(subject, envelope, serDes) {
  const c = await _connect()
  const { payload, headers } = envelope
  const publishRequest = {
    pubsub_name: RUSI_PUB_SUB_NAME,
    topic: subject,
    data: toUTF8Array(serDes.serialize(payload)),
    data_content_type: serDes.getInfo().contentType,
    metadata: headers
  }
  const _publish = Promise.promisify(c.Publish, { context: c })
  const result = await _publish(publishRequest)
  return result
}

export async function subscribe(subject, handler, opts, serDes) {
  const c = await _connect()
  const rusiSubOptions = {}
  switch (opts) {
    case SubscriptionOptions.STREAM_PROCESSOR:
      rusiSubOptions.qGroup = { value: true }
      rusiSubOptions.durable = { value: true }
      rusiSubOptions.deliverNewMessagesOnly = { value: false }
      rusiSubOptions.maxConcurrentMessages = {
        value: parseInt(RUSI_STREAM_PROCESSOR_MaxConcurrentMessages, 10) || 1
      }
      rusiSubOptions.ackWaitTime = {
        value: parseInt(RUSI_STREAM_PROCESSOR_AckWaitTime, 10) || 5000
      }
      break

    case SubscriptionOptions.PUB_SUB:
      rusiSubOptions.qGroup = { value: true }
      rusiSubOptions.durable = { value: false }
      rusiSubOptions.deliverNewMessagesOnly = { value: true }
      rusiSubOptions.maxConcurrentMessages = {
        value: parseInt(RUSI_PUB_SUB_MaxConcurrentMessages, 10) || 100
      }
      rusiSubOptions.ackWaitTime = {
        value: parseInt(RUSI_PUB_SUB_AckWaitTime, 10) || 5000
      }
      break

    case SubscriptionOptions.RPC:
      rusiSubOptions.qGroup = { value: false }
      rusiSubOptions.durable = { value: false }
      rusiSubOptions.deliverNewMessagesOnly = { value: true }
      rusiSubOptions.maxConcurrentMessages = {
        value: parseInt(RUSI_RPC_MaxConcurrentMessages, 10) || 1
      }
      rusiSubOptions.ackWaitTime = {
        value: parseInt(RUSI_RPC_AckWaitTime, 10) || 5000
      }
      break
  }

  const subscribeRequest = {
    pubsub_name: RUSI_PUB_SUB_NAME,
    topic: subject,
    options: rusiSubOptions
  }

  const call = c.Subscribe()
  call.write({ subscription_request: subscribeRequest })
  call.on('data', async function (msg) {
    const payload = serDes.deSerializePayload(fromUTF8Array(msg.data))
    const headers = msg.metadata
    const envelope = { payload, headers }
    await handler(envelope)
    const ackRequest = { message_id: msg.id /* , error: null*/ }
    call.write({ ack_request: ackRequest })
  })
  call.on('end', function () {
    // The server has finished sending
    console.error(`Rusi subscription ended for subject ${subject}.`)
  })
  call.on('error', function (e) {
    // An error has occurred and the stream has been closed.
    console.error(`Rusi subscription error for subject ${subject}: ${e}`)
  })

  const sub = rusiSubscription(call)
  return sub
}

function toUTF8Array(str) {
  const utf8 = []
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i)
    if (charcode < 0x80) utf8.push(charcode)
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f))
    }
    // surrogate pair
    else {
      i++
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      )
    }
  }
  return utf8
}

function fromUTF8Array(data) {
  // array of bytes
  let str = '',
    i

  for (i = 0; i < data.length; i++) {
    const value = data[i]

    if (value < 0x80) {
      str += String.fromCharCode(value)
    } else if (value > 0xbf && value < 0xe0) {
      str += String.fromCharCode(((value & 0x1f) << 6) | (data[i + 1] & 0x3f))
      i += 1
    } else if (value > 0xdf && value < 0xf0) {
      str += String.fromCharCode(((value & 0x0f) << 12) | ((data[i + 1] & 0x3f) << 6) | (data[i + 2] & 0x3f))
      i += 2
    } else {
      // surrogate pair
      const charCode =
        (((value & 0x07) << 18) | ((data[i + 1] & 0x3f) << 12) | ((data[i + 2] & 0x3f) << 6) | (data[i + 3] & 0x3f)) -
        0x010000

      str += String.fromCharCode((charCode >> 10) | 0xd800, (charCode & 0x03ff) | 0xdc00)
      i += 3
    }
  }

  return str
}

function rusiSubscription(call) {
  const sub = new EventEmitter()
  sub.on('removeListener', (event, listener) => {
    call.removeListener(event, listener)
  })
  sub.on('newListener', (event, listener) => {
    call.on(event, listener)
  })

  sub.unsubscribe = function unsubscribe() {
    call.cancel()
    return Promise.resolve()
  }
  sub._call = call

  return sub
}

function wrapClient(client) {
  const connection = new EventEmitter()
  const channel = client.getChannel()

  try {
    channel.watchConnectivityState(grpc.connectivityState.READY, Infinity, () => {
      let currentState
      try {
        currentState = channel.getConnectivityState(true)
      } catch (e) {
        connection.emit('error', new Error('The channel has been closed'))
        return
      }
      connection.emit('error', new Error(`The channel's connectivity state is ${currentState}`))
    })
  } catch (e) {
    connection.emit('error', new Error('The channel has been closed'))
    return
  }

  connection.on('error', err => {
    console.error(`Rusi connection error: ${err}`)
  })

  connection._rusiClient = client
  return connection
}
