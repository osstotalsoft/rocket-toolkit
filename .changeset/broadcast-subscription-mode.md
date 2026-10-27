---
"@totalsoft/message-bus": minor
---

New `SubscriptionOptions.BROADCAST` mode: non-durable, at-most-once, without a queue group, so every instance of a service receives every message (for example to refresh an in-memory cache or push to the clients connected to each instance). It is supported by the NATS Streaming, JetStream and Rusi transports and configured with its own environment variables (`NATS_BROADCAST_MaxInflight` / `NATS_BROADCAST_AckWait`, `JETSTREAM_BROADCAST_MaxConcurrentMessages` / `JETSTREAM_BROADCAST_AckWaitTime`, `RUSI_BROADCAST_MaxConcurrentMessages` / `RUSI_BROADCAST_AckWaitTime`), with a default concurrency of 100. It matches `SubscriptionTransportOptions.Broadcast` in NBB. RPC is unchanged.
