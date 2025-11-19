# Process Algebra Library

A TypeScript library for building stateful, event-driven processes using monadic composition patterns.

## Overview

This library provides a functional approach to building complex event-driven workflows with:
- **Stateful computations** that evolve over time
- **Event handling** with pattern matching
- **Monadic composition** for sequential and parallel workflows
- **Type-safe** process definitions

## Core Concepts

- **Process**: A function that takes an instance ID and initial state, returns effects and a process state
- **ProcessState**: Can be `Succeeded`, `InProgress`, or `Failed`
- **Events**: External triggers that advance process execution
- **Effects**: Side effects to be executed by the runtime

## Simple Example

```typescript
import { Process, Result } from './process-algebra';
import { ProcessRuntime } from './process-runtime';

// Define your event types
type MyEvent = 
  | { type: 'UserLoggedIn', userId: string }
  | { type: 'DataReceived', data: number };

// Define your state
type MyState = {
  userId?: string;
  total: number;
};

// Create a simple process that waits for two events
const myProcess = Process.Do<string, MyState, MyEvent, string>(function* () {
  // Wait for user login
  const loginEvent = yield Process.waitForEvent<MyEvent, string>(event => {
    if (event.type === 'UserLoggedIn') {
      return Result.Ok(event.userId);
    }
    return null;
  });

  // Update state with user ID
  yield Process.setState<MyState>(state => ({
    ...state,
    userId: loginEvent
  }));

  // Wait for data
  const dataEvent = yield Process.waitForEvent<MyEvent, number>(event => {
    if (event.type === 'DataReceived') {
      return Result.Ok(event.data);
    }
    return null;
  });

  // Update state with total
  yield Process.setState<MyState>(state => ({
    ...state,
    total: state.total + dataEvent
  }));

  // Return final result
  return `User ${loginEvent} processed ${dataEvent} items`;
});

// Create a runtime to manage process execution
const runtime = new ProcessRuntime<string, MyState, MyEvent>();

// Start the process
const instanceId = 'process-1';
const initialState: MyState = { total: 0 };

runtime.startProcess(instanceId, myProcess, initialState);

// Send events to progress the process
runtime.sendEvent(instanceId, { type: 'UserLoggedIn', userId: 'user123' });
runtime.sendEvent(instanceId, { type: 'DataReceived', data: 42 });

// Check final state
const finalState = runtime.getProcessState(instanceId);
if (finalState?.kind === 'Succeeded') {
  console.log(finalState.value); // "User user123 processed 42 items"
  console.log(finalState.state); // { userId: 'user123', total: 42 }
}
```

## Process Composition

### Sequential Composition with `bind`

Chain processes sequentially - the second process starts after the first completes:

```typescript
const sequentialProcess = Process.bind(
  Process.waitForEvent<MyEvent, string>(e => 
    e.type === 'UserLoggedIn' ? Result.Ok(e.userId) : null
  ),
  (userId) => Process.bind(
    Process.waitForEvent<MyEvent, number>(e => 
      e.type === 'DataReceived' ? Result.Ok(e.data) : null
    ),
    (data) => Process.pure(`${userId}: ${data}`)
  )
);
```

### Parallel Composition with `both`

Run two processes in parallel, waiting for both to complete:

```typescript
const parallelProcess = Process.both(
  Process.waitForEvent<MyEvent, string>(e => 
    e.type === 'UserLoggedIn' ? Result.Ok(e.userId) : null
  ),
  Process.waitForEvent<MyEvent, number>(e => 
    e.type === 'DataReceived' ? Result.Ok(e.data) : null
  ),
  // State merger function
  (leftState, rightState) => ({
    userId: leftState.userId,
    total: rightState.total
  })
);

// Both processes execute concurrently
// Events can arrive in any order
// Result is a tuple: [userId, data]
```

### Transform Results with `map`

Transform the result value without changing process logic:

```typescript
const mappedProcess = Process.map(
  (value: number) => value * 2,
  Process.waitForEvent<MyEvent, number>(e => 
    e.type === 'DataReceived' ? Result.Ok(e.data) : null
  )
);

// If event arrives with data: 21
// Process succeeds with result: 42
```

## Key Operations

| Operation | Purpose | Example |
|-----------|---------|---------|
| `Process.Do` | Generator-based sequential composition | `Process.Do(function* () { ... })` |
| `Process.bind` | Chain processes sequentially | `bind(p1, (result) => p2)` |
| `Process.both` | Run processes in parallel | `both(p1, p2, merger)` |
| `Process.map` | Transform result values | `map(x => x * 2, process)` |
| `Process.waitForEvent` | Wait for specific event | `waitForEvent(e => e.type === 'X' ? Ok(e) : null)` |
| `Process.setState` | Update process state | `setState(s => ({ ...s, count: s.count + 1 }))` |
| `Process.pure` | Create completed process | `pure(42)` |

## Visualization

The library includes visual documentation:

- **[process-monad-explained.html](./process-monad-explained.html)** - Complete guide to the Process monad, map, bind, apply operations

Open these files in your browser to explore interactive diagrams with code links.

## Type Safety

All processes are fully typed:

```typescript
Process<TInstanceId, TState, TEvent, TResult>
```

- `TInstanceId`: Type of process instance identifier
- `TState`: Type of process state
- `TEvent`: Type of events the process handles
- `TResult`: Type of final result value
