import type { Process, ProcessState } from "./process-algebra.js";
import { ProcessStateKind } from "./process-algebra.js";
import { Effect } from "./effects.js";
import { ConcurrencyError, type EventStore } from "./event-store/types.js";

// Runtime event types
enum RuntimeEventType {
    ProcessStarted = "ProcessStarted",
    EventReceived = "EventReceived"
}
type RuntimeEvent<TEvent> =
    | { type: RuntimeEventType.ProcessStarted }
    | { type: RuntimeEventType.EventReceived; event: TEvent }

// Helper constructors
const RuntimeEvents = {
    ProcessStarted: (): RuntimeEvent<any> => ({ type: RuntimeEventType.ProcessStarted }),
    EventReceived: <TEvent>(event: TEvent): RuntimeEvent<TEvent> => ({
        type: RuntimeEventType.EventReceived,
        event
    })
};

/** 
 * Apply the event history to the process instance
 * @param instanceId - The instance identifier
 * @param initialState - The initial state of the process
 * @param proc - The process definition
 * @param history - The event history
 * @returns The final process state
 */

function applyHistory<TInstanceId, TState, TEvent>(
    instanceId: TInstanceId,
    initialState: TState,
    proc: Process<TInstanceId, TState, TEvent, void>,
    history: RuntimeEvent<TEvent>[]
): ProcessState<TState, TEvent, void> {

    // History must start with ProcessStarted
    if (history.length === 0 || !history[0] || history[0].type !== RuntimeEventType.ProcessStarted) {
        throw new Error("Invalid history: must start with ProcessStarted");
    }

    // Initialize the process
    let [_, procState] = proc(instanceId, initialState);

    // Fold events through the state
    const finalState = history.reduce(
        (state, event, index) => {
            // Skip first element (ProcessStarted)
            if (index === 0) return state;

            if (state.kind !== ProcessStateKind.InProgress) {
                return state;
            }

            // Extract event
            if (event.type !== RuntimeEventType.EventReceived) {
                throw new Error(`Unexpected event type: ${event.type}`);
            }

            const result = state.next(event.event);
            if (result !== null) {
                const [_, nextState] = result;
                return nextState;
            }
            return state;
        }, procState);

    return finalState;
}


export function createRuntime(eventStore: EventStore) {

    /**
     * Handle an event for a process instance
     * @param instanceId - The instance identifier
     * @param ev - The event to handle
     * @param stream - The stream identifier
     * @param proc - The process definition
     */
    function handleEvent<TInstanceId, TState, TEvent>(
        instanceId: TInstanceId,
        ev: TEvent,
        stream: string,
        proc: Process<TInstanceId, TState, TEvent, void>
    ): Effect<void> {

        const initialState = {} as TState;

        return Effect.catchError(
            Effect.pipe(
                streamExists(stream),
                (streamExistsResult) => streamExistsResult ? Effect.unit() : startProcess(instanceId, stream, proc),
                () => applyNewEvent(instanceId, initialState, ev, stream, proc)
            ),
            error => {
                if (error instanceof ConcurrencyError) {
                    console.log(`[ProcessRuntime] Concurrency conflict detected error: ${error.message}, retrying...`);
                    return handleEvent(instanceId, ev, stream, proc)
                } else {
                    throw error;
                }
            });
    }

    /**
     * Check if a stream exists
     * @param stream - The stream identifier
     * @returns true if the stream exists
     */
    function streamExists(stream: string): Effect<boolean> {
        return eventStore.streamExists(stream);
    }

    /**
     * Start a new process by executing the initial effect
     * @param instanceId - The instance identifier
     * @param stream - The stream identifier 
     * @param proc - The process definition
     */
    function startProcess<TInstanceId, TState, TEvent>(
        instanceId: TInstanceId,
        stream: string,
        proc: Process<TInstanceId, TState, TEvent, void>,
    ): Effect<void> {
        // Initialize the process
        const [effect, _] = proc(instanceId, {} as TState);

        return Effect.pipe(
            eventStore.appendEvent<RuntimeEvent<TEvent>>(stream, [RuntimeEvents.ProcessStarted()], 0),
            _ => effect
        );
    }


    /**
     * Apply a new event to the process
     * @param instanceId - The instance identifier
     * @param initialState - The initial state of the process
     * @param ev - The event to apply
     * @param stream - The stream identifier
     * @param proc - The process definition
     */
    function applyNewEvent<TInstanceId, TState, TEvent>(
        instanceId: TInstanceId,
        initialState: TState,
        ev: TEvent,
        stream: string,
        proc: Process<TInstanceId, TState, TEvent, void>,
    ): Effect<void> {

        return Effect.pipe(
            eventStore.loadEvents<RuntimeEvent<TEvent>>(stream),
            history => {
                const state = applyHistory(instanceId, initialState, proc, history);

                // Apply event if state is InProgress
                switch (state.kind) {
                    case ProcessStateKind.InProgress:
                        const result = state.next(ev);

                        //check if event was not ignored
                        if (result !== null) {
                            const [eff, _] = result;
                            // console.log(`[ProcessRuntime] Next state: ${nextState.kind}`);

                            // First save new event to stream then run effects
                            return Effect.pipe(
                                eventStore.appendEvent<RuntimeEvent<TEvent>>(stream, [RuntimeEvents.EventReceived(ev)], history.length),
                                () => eff
                            );
                        }
                        break;
                    case ProcessStateKind.Succeeded:
                    case ProcessStateKind.Failed:
                        // No further processing
                        break;
                }
                return Effect.unit();
            }
        );
    }


    /**
     * Get the current process state
     * InProgress, Succeeded, or Failed along with state
     * @param instanceId - The instance identifier
     * @param stream - The stream identifier
     * @param proc - The process definition
     */
    function getProcessState<TInstanceId, TState, TEvent>(
        instanceId: TInstanceId,
        stream: string,
        proc: Process<TInstanceId, TState, TEvent, void>,
    ): Effect<ProcessState<TState, TEvent, void>> {

        const initialState = {} as TState;
        return Effect.pipe(
            eventStore.loadEvents<RuntimeEvent<TEvent>>(stream),
            history => {
                if (history.length === 0) {
                    return Effect.pure(proc(instanceId, initialState)[1]);
                }
                return Effect.pure(applyHistory(instanceId, initialState, proc, history));
            }
        );
    }

    function clearProcessState(stream: string,): Effect<void> {
        return eventStore.deleteStream(stream);
    }

    return { handleEvent, startProcess, getProcessState, clearProcessState };
}
