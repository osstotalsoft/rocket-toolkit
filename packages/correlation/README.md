# correlation

This package provides core correlation functionality.
The correlation manager allows opening a correlation scope that is propagated across async/await calls.

## Installation

```javascript
npm i @totalsoft/correlation
```

or

```javascript
yarn add @totalsoft/correlation
```
## Usage
```javascript
import { correlationManager } from '@totalsoft/correlation'

// Open a correlation scope and set a correlation id. Set the correlation id to null to use an auto-generated one.
correlationManager.useCorrelationId('b48f6511-2f45-46c8-b9a5-655856712f32', async () => {
    await inner()
})

// function that uses the correlation id from the context
async function inner() {
    const correlationId = correlationManager.getCorrelationId()
}

```