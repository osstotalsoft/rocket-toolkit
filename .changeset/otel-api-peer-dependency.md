---
"@totalsoft/metrics": major
"@totalsoft/pino-opentelemetry": major
"@totalsoft/opentelemetry-instrumentation-ws": major
---

`@opentelemetry/api` is now a peer dependency (`^1.9.0`) instead of a regular dependency.

`@opentelemetry/api` keeps its state (tracer provider, meter provider, context) in a single process-wide global, and registration fails when two copies of a different version are installed ("Registration of version vX for trace does not match previously registered API vY"), which silently disables tracing. Declaring it as a dependency let package managers install a private nested copy whenever the application's version was outside the library's range. Applications must now install `@opentelemetry/api` themselves (they already do when they use the OpenTelemetry SDK).

`@totalsoft/opentelemetry-instrumentation-ws` also declares `@opentelemetry/instrumentation` (`>=0.200.0 <1`) and `@opentelemetry/core` (`>=2.0.0 <4`) as peer dependencies: both are imported at runtime but were previously only dev dependencies.
