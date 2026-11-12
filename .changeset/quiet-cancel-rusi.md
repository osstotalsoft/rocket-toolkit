---
'@totalsoft/message-bus': patch
---

fix(message-bus): don't crash when a Rusi subscription is unsubscribed. grpc-js emits a `1 CANCELLED` error on the stream after `cancel()`, and because `unsubscribe` removed the `'error'` listener first, it became an uncaught exception (seen after every `sendCommandAndReceiveEvent`).
