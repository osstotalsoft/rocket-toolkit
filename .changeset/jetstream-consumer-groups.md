---
"@totalsoft/message-bus": minor
---

JetStream transport: PUB_SUB subscriptions now share one ephemeral consumer per client id and subject (`<clientId>__<subject>`), so instances of a service compete for messages, as they do with the NATS Streaming and Rusi transports. Previously every PUB_SUB subscriber got its own consumer and received every message. RPC subscriptions keep fan-out and now get a named ephemeral consumer (`<clientId>__<subject>__<uuid>`). If you relied on PUB_SUB fanning out on JetStream, use RPC.
