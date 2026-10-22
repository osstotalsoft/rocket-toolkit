---
'@totalsoft/messaging-host': minor
---

Moved `@totalsoft/messaging-host` from nodebb to rocket-toolkit and rewrote it in TypeScript. The public API is unchanged; `MessagingHostMiddleware`'s `next` is now typed as `() => Promise<void>`, `MessagingHost` extends `EventEmitter`, and `ramda` has been dropped as a dependency. Compiled output now lives in `dist/`, so deep imports from `src/` no longer resolve.
