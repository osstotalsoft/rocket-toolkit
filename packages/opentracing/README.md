# correlation

This package provides core opentracing functionality.

## Installation

```javascript
npm i @totalsoft/opentracing
```

or

```javascript
yarn add @totalsoft/opentracing
```

## Span Manager
Allows propagating an opentracing span across async/await calls.

```javascript
async function inner() {
  // Access the active span in scope
  const activeSpan = spanManager.getActiveSpan()
}

// Create a scope where the span will be available
spanManager.useSpanManager(rootSpan, async () => {
  await inner()
})
```
