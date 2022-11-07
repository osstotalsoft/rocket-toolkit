# message-bus
Provider independent, high-level, opinionated messaging library

## installation
```javascript
npm install @totalsoft/message-bus
```

## philosophy
The message bus is a high level api for messaging communication that abstracts away from its consumers some of the involving complexity like:
 - Messaging transport (Nats, Kafka, etc)
 - Message SerDes
 - Topic Registry
 - Message envelope

## transport
By default the message bus uses the Nats streaming transport. When working with other transports, you need to globally set the transport, before using the message bus api.
```javascript
const { messageBus, useTransport, transport } = require('@totalsoft/message-bus');

useTransport(transport.rusi) //or transport.nats or whatever transport
const msgBus = messageBus() //now every message bus instance points to that transport
await msgBus.publish('some_subject', {});
```

Built-in transport options:
- [Nats streaming](https://github.com/nats-io/nats-streaming-server)
- [rusi](https://github.com/osstotalsoft/rusi)

## serDes
When publishing and receiving messages the message bus needs to serialize / deserialize messages. By default it uses a built-in Json serializer. Should you need to hook in your custom serializer, you can globally set your custom serializer, before using the message bus api.

```javascript
const { messageBus, useSerDes, serDes } = require('@totalsoft/message-bus');

useSerDes(customize(serDes))
const msgBus = messageBus() //now every message bus instance points to that serDes
await msgBus.publish('some_subject', {});
```

## publish
```javascript
const { messageBus } = require('@totalsoft/message-bus');

const userUpdatedEvent = { userId: 5, userName:'rpopovici' }
const correlationId = 'some-correlation-id'
const tenantId = 'some-tenant-id'
const msgBus = messageBus()

await msgBus.publish('USER_UPDATED', userUpdatedEvent, {correlationId, tenantId});
```

## subscribe
```javascript
const { messageBus, SubscriptionOptions } = require('@totalsoft/message-bus');

const handler = console.log
const msgBus = messageBus()

const subscription = await msgBus.subscribe('USER_UPDATED', handler, SubscriptionOptions.STREAM_PROCESSOR)
```
The last optional parameter *subscription options*  is a high level configuration of the subscription type. See below.

## subscription options
When subscribing to a stream you ca opt in one of the following:
 - STREAM_PROCESSOR: typical event driven subscriptions; durable, at-least-once, within a queue group
 - PUB_SUB: lite weight, non-durable, at-most-once, within a queue group
 - RPC: lite weight, non-durable, at-most-once, without queue group, used in send-command-and-wait-for-event scenarios


## request / response over messaging
```javascript
const { messageBus } = require('@totalsoft/message-bus');

const correlationId = 'some-correlation-id'
const tenantId = 'some-tenant-id'

const updateUserCommand = { userId: 5, userName:'rpopovici' }
const msgBus = messageBus()

const [topic, event] = await msgBus.sendCommandAndReceiveEvent(
    'UPDATE_USER', updateUserCommand,
    ['USER_UPDATED', 'UPDATE_USER_FAILED'],
    {correlationId, tenantId}
)
```

## environment variables
Messaging__TopicPrefix="deprecated_please_use_Messaging__Env"
Messaging__Env="messaging_env"
Messaging__Source="your_service_name"
Messaging__Transport="nats_or_rusi"

NATS_URL="your_nats_url"
NATS_CLUSTER="your_nats_cluster"
NATS_CLIENT_ID="your_nats_client_id"
NATS_Q_GROUP="your_q_group"
NATS_DURABLE_NAME="durable"
NATS_STREAM_PROCESSOR_MaxInflight="1"
NATS_STREAM_PROCESSOR_AckWait="5000"
NATS_PUB_SUB_MaxInflight="100"
NATS_PUB_SUB_AckWait="5000"
NATS_RPC_MaxInflight="1"
NATS_RPC_AckWait="5000"

RUSI_GRPC_ENDPOINT="localhost:50003"
RUSI_GRPC_PORT="50003"
RUSI_PUB_SUB_NAME="natsstreaming-pubsub"
RUSI_STREAM_PROCESSOR_MaxConcurrentMessages="1"
RUSI_STREAM_PROCESSOR_AckWaitTime="5000"
RUSI_PUB_SUB_MaxConcurrentMessages="100"
RUSI_PUB_SUB_AckWaitTime="5000"
RUSI_RPC_MaxConcurrentMessages="1"
RUSI_RPC_AckWaitTime="5000"


