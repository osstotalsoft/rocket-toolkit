import sql from 'mssql';
import { Effect } from "../effects.js";
import type { EventStore, StreamData } from "./types.js";
import { ConcurrencyError } from "./types.js";
import { v4 as uuidv4 } from 'uuid';
import { ConnectionManager } from '../infra/db-connection.js';

export class MSSQLEventStore implements EventStore {

    constructor(private connectionManager: ConnectionManager) { }

    /**
     * Append events to a stream
     * @param stream - The stream identifier
     * @param events - The events to append
     * @param expectedVersion - The expected version for optimistic concurrency
     */
    appendEvent<TEvent>(
        stream: string,
        events: TEvent[],
        expectedVersion: number
    ): Effect<void> {
        return Effect.fromAsync(async () => {
            const connection = await this.connectionManager.getConnection();
            const newVersion = expectedVersion + 1;
            try {
                // Create table-valued parameter
                const table = new sql.Table('NewEventStoreEvents2');
                table.columns.add('EventId', sql.UniqueIdentifier, { nullable: false });
                table.columns.add('EventData', sql.NVarChar(sql.MAX), { nullable: false });
                table.columns.add('EventType', sql.VarChar(300), { nullable: false });
                table.columns.add('CorrelationId', sql.UniqueIdentifier, { nullable: true });

                // Add rows from events
                events.forEach((event: any) => {
                    const eventType = event.event?.type || 'Unknown';
                    const correlationId = null;

                    table.rows.add(
                        uuidv4(),
                        JSON.stringify(event),
                        eventType,
                        correlationId
                    );
                });

                // Insert events - the unique index on (StreamId, Version) will prevent duplicates
                await connection.request()
                    .input('stream', sql.NVarChar, stream)
                    .input('version', sql.Int, newVersion)
                    .input('events', table)
                    .query(`
                    INSERT INTO [dbo].[EventStoreEvents] (EventId, EventData, EventType, CorrelationId, StreamId, StreamVersion)
                    SELECT EventId, EventData, EventType, CorrelationId, @stream, @version
                    FROM @events
                `);

                console.log(`[EventStore] Appended ${events.length} events to stream "${stream}" (v${newVersion})`);
            } catch (error: sql.RequestError | any) {
                // Check if it's a unique index violation (SQL Server error 2601 or 2627)
                if (error as sql.RequestError && (error.number === 2601 || error.number === 2627)) {
                    throw new ConcurrencyError(
                        `Concurrency conflict: Version ${newVersion} already exists for stream "${stream}"`
                    );
                }

                console.error(`[EventStore] Error appending to stream "${stream}":`, error);
                throw error;
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
            const connection = await this.connectionManager.getConnection();
            const filter = fromVersion !== undefined ? ' AND Version >= @fromVersion' : '';

            const query = `SELECT EventData
                   FROM EventStoreEvents
                   WHERE StreamId = @stream ${filter}
                   ORDER BY StreamVersion`;

            const request = connection.request()
                .input('stream', sql.NVarChar, stream);

            if (fromVersion !== undefined) {
                request.input('fromVersion', sql.Int, fromVersion);
            }

            const result = await request.query(query);

            if (result.recordset.length === 0) {
                console.log(`[EventStore] Stream "${stream}" not found or has no events`);
                return [];
            }

            const events = result.recordset.map(row => {
                return JSON.parse(row.EventData) as TEvent;
            });

            console.log(`[EventStore] Loaded ${events.length} events from stream "${stream}"`);
            return events;
        });
    }

    /**
     * Check if a stream exists
     * @param stream - The stream identifier
     * @returns true if the stream exists
     */
    streamExists(stream: string): Effect<boolean> {
        return Effect.fromAsync(async () => {
            const connection = await this.connectionManager.getConnection();
            const result = await connection.request()
                .input('stream', sql.NVarChar, stream)
                .query(`
                    SELECT 1 
                    FROM EventStoreEvents 
                    WHERE StreamId = @stream
                `);

            return result.recordset.length > 0;
        });
    }

    /**
     * Delete a stream
     * @param stream - The stream identifier
     * @returns Effect that completes when the stream is deleted
     */
    deleteStream(stream: string): Effect<void> {
        return Effect.fromAsync(async () => {
            const connection = await this.connectionManager.getConnection();
            await connection.request()
                .input('stream', sql.NVarChar, stream)
                .query(`
                    DELETE FROM EventStoreEvents 
                    WHERE StreamId = @stream
                `);
        });
    }
}