import { Effect } from "../effects.js";
import type { EventStore, StreamData } from "./types.js";
import { ConcurrencyError } from "./types.js";

export class InMemoryEventStore implements EventStore {

    private store = new Map<string, StreamData>();
    private locks = new Map<string, Promise<void>>();

    /**
     * Acquire a lock for a stream
     * @param stream - The stream identifier
     * @returns A function to release the lock
     */
    private async acquireLock(stream: string): Promise<() => void> {
        // Wait for any existing lock on this stream
        while (this.locks.has(stream)) {
            await this.locks.get(stream);
        }

        // Create a new lock for this stream
        let unlock: () => void;
        const lockPromise = new Promise<void>((resolve) => {
            unlock = resolve;
        });

        this.locks.set(stream, lockPromise);

        // Return the unlock function
        return () => {
            this.locks.delete(stream);
            unlock!();
        };
    }

    /**
     * Append an event to a stream
     * @param stream - The stream identifier
     * @param event - The event to append
     * @param expectedVersion - The expected version for optimistic concurrency
     */
    appendEvent<TEvent>(
        stream: string,
        events: TEvent[],
        expectedVersion: number
    ): Effect<void> {
        return Effect.fromAsync(async () => {
            const unlock = await this.acquireLock(stream);

            try {
                const streamData = this.store.get(stream);
                if (!streamData) {
                    // Create new stream
                    this.store.set(stream, {
                        events: events,
                        version: 1
                    });
                    console.log(`[EventStore] Created stream "${stream}" with events:`, events);
                    return;
                }

                // Check version for optimistic concurrency
                if (streamData.version !== expectedVersion) {
                    throw new ConcurrencyError(
                        `Concurrency conflict: Expected version ${expectedVersion}, but stream is at version ${streamData.version}`
                    );
                }

                // Append event
                streamData.events.push(...events);
                streamData.version++;

                console.log(`[EventStore] Appended to stream "${stream}" (v${streamData.version}):`, events);
            } finally {
                unlock();
            }
        });
    }

    /**
     * Load events from a stream
     * @param stream - The stream identifier
     * @param fromVersion - Optional version to load from (inclusive)
     */
    loadEvents<TEvent>(
        stream: string,
        fromVersion?: number
    ): Effect<TEvent[]> {
        return Effect.fromAsync(async () => {
            const streamData = this.store.get(stream);

            if (!streamData) {
                console.log(`[EventStore] Stream "${stream}" not found`);
                return [];
            }

            const events = fromVersion !== undefined
                ? streamData.events.slice(fromVersion)
                : streamData.events;

            console.log(`[EventStore] Loaded ${events.length} events from stream "${stream}"`);
            return events as TEvent[];
        });
    }

    /**
     * Check if a stream exists
     * @param stream - The stream identifier
     * @returns true if the stream exists
     */
    streamExists(stream: string): Effect<boolean> {
        return Effect.fromAsync(async () => {
            return this.store.has(stream);
        });
    }

    /**
     * Delete a stream
     * @param stream - The stream identifier
     * @returns Effect that completes when the stream is deleted
     */
    deleteStream(stream: string): Effect<void> {
        return Effect.fromAsync(async () => {
            this.store.delete(stream);
        });
    }
}

const evStore = new InMemoryEventStore();
export default evStore;