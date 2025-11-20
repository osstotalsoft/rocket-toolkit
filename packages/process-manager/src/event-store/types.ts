import { Effect } from "../effects.js";

export type StreamData = {
    events: any[];
    version: number;
};

export interface EventStore {
    /**
     * Append an event to the event store
     * @param stream - The stream identifier
     * @param events - The events to append
     * @param expectedVersion - The expected version for optimistic concurrency
     */
    appendEvent<TEvent>(
        stream: string,
        events: TEvent[],
        expectedVersion: number
    ): Effect<void>;

    /**
     * Load events from a stream
     * @param stream - The stream identifier
     * @param fromVersion - Optional version to load from (inclusive)
     */
    loadEvents<TEvent>(
        stream: string,
        fromVersion?: number
    ): Effect<TEvent[]>;

    /**
     * Check if a stream exists
     * @param stream - The stream identifier
     * @returns true if the stream exists, false otherwise
     */
    streamExists: (
        stream: string
    ) => Effect<boolean>;

    /**
     * Delete a stream
     * @param stream - The stream identifier
     * @returns Effect that completes when the stream is deleted
     */
    deleteStream: (
        stream: string
    ) => Effect<void>;
};


export class ConcurrencyError extends Error { }
