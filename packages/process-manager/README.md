# Process Manager Library

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
import { Process, Result, createRuntime } from '@totalsoft/process-manager';
import { createEventStore } from '@totalsoft/process-manager/event-store';

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

// Create event store and runtime
const eventStore = createEventStore({ type: "in-memory" });
const runtime = createRuntime(eventStore);

// Execute the process by handling events
const instanceId = 'process-1';
const stream = `myProcess-${instanceId}`;

// Send events to progress the process
await runtime.handleEvent(instanceId, 
  { type: 'UserLoggedIn', userId: 'user123' }, 
  stream, 
  myProcess
).execute();

await runtime.handleEvent(instanceId, 
  { type: 'DataReceived', data: 42 }, 
  stream, 
  myProcess
).execute();
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

## Process Runtime

The process runtime manages the execution of processes and handles event delivery.

### Creating a Runtime

```typescript
import { createRuntime } from '@totalsoft/process-manager';
import { createEventStore } from '@totalsoft/process-manager/event-store';

// Create event store
const eventStore = createEventStore({ type: "in-memory" });

// Create runtime with event store
const runtime = createRuntime(eventStore);
```

### Handling Events

```typescript
// Handle events with automatic persistence and replay
const stream = `myProcess-${instanceId}`;
await runtime.handleEvent(instanceId, myEvent, stream, myProcess).execute();
```

The runtime automatically:
- Persists events to the event store
- Reconstructs process state from event history
- Handles concurrency conflicts with automatic retry
- Executes side effects

## Event Store

The library provides an event store abstraction for persisting process events with support for event sourcing and optimistic concurrency control.

### Event Store Options

Create an event store using the factory function:

```typescript
import { createEventStore } from '@totalsoft/process-manager/event-store';

// In-memory store (for testing)
const inMemoryStore = createEventStore({ type: "in-memory" });

// SQL Server store (for production)
const sqlStore = createEventStore({ type: "mssql" });

// SQL Server with custom connection
import { ConnectionManager } from '@totalsoft/process-manager';
const connectionManager = new ConnectionManager({
  server: 'localhost',
  database: 'ProcessManager',
  user: 'sa',
  password: 'password'
});
const customSqlStore = createEventStore({ 
  type: "mssql", 
  connectionManager 
});
```

### Event Store Features

- **Event Sourcing**: All events are persisted in append-only streams
- **Optimistic Concurrency**: Prevents lost updates with version-based concurrency control
- **Event Replay**: Reconstruct process state by replaying event history
- **Stream Management**: Create, read, and delete event streams
- **Multiple Backends**: In-memory (testing) and SQL Server (production)

### Event Store Interface

```typescript
interface EventStore {
  // Append events to a stream
  appendEvent<TEvent>(
    stream: string,
    events: TEvent[],
    expectedVersion: number
  ): Effect<void>;

  // Load events from a stream
  loadEvents<TEvent>(
    stream: string,
    fromVersion?: number
  ): Effect<TEvent[]>;

  // Check if stream exists
  streamExists(stream: string): Effect<boolean>;

  // Delete a stream
  deleteStream(stream: string): Effect<void>;
}
```

### Concurrency Control

The event store uses optimistic concurrency control to prevent lost updates:

```typescript
try {
  // Append with expected version
  await eventStore.appendEvent(
    'user-123',
    [newEvent],
    expectedVersion // Current version of the stream
  ).execute();
} catch (error) {
  if (error instanceof ConcurrencyError) {
    // Handle conflict: reload, merge, retry
    console.log('Concurrent modification detected');
  }
}
```

The runtime automatically handles concurrency conflicts by retrying the operation.

## Visualization

The library includes visual documentation:

- **[process-monad-explained.html](./process-monad-explained.html)** - Complete guide to the Process monad, map, bind, apply operations

> **Note:** Download the HTML file and open it in your browser to view the interactive visualizations.

## Type Safety

All processes are fully typed:

```typescript
Process<TInstanceId, TState, TEvent, TResult>
```

- `TInstanceId`: Type of process instance identifier
- `TState`: Type of process state
- `TEvent`: Type of events the process handles
- `TResult`: Type of final result value
