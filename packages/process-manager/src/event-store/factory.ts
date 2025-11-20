import type { EventStore } from "./types.js";
import { MSSQLEventStore } from "./db.js";
import inMemoryEventStore from "./inmemory.js";
import defaultConnectionManager, { type ConnectionManager } from "../infra/db-connection.js";

export type EventStoreOptions =
    | { type: "in-memory" }
    | { type: "mssql"; connectionManager?: ConnectionManager };

export function createEventStore(options: EventStoreOptions): EventStore {
    switch (options.type) {
        case "in-memory":
            return inMemoryEventStore;
        case "mssql":
            return new MSSQLEventStore(options.connectionManager || defaultConnectionManager);
    }
}