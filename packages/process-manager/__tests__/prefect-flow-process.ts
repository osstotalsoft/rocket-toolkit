import { Process } from "../src/process-algebra.js";
import { Result } from "../src/result.js";
import { CustomEffects } from "../src/custom-effects.js";
import { createRuntime } from "../src/process-runtime.js";
import { Commands, Mediator } from "../src/mediator.js";
import eventStore from "../src/event-store/inmemory.js";
import defaultConnectionManager from '../src/infra/db-connection.js';

type InstanceId = { sessionId: string, processName: string };
enum EventTypes {
    FlowStarted = "FlowStarted",
    FlowCompleted = "FlowCompleted",
    FlowFailed = "FlowFailed",
    TaskStarted = "TaskStarted",
    TaskCompleted = "TaskCompleted",
    TaskFailed = "TaskFailed",

    SaveTaskStateFailed = "SaveTaskStateFailed",
    SaveTaskStateSucceeded = "SaveTaskStateSucceeded",

    SaveSessionFailed = "SaveSessionFailed",
    SaveSessionSucceeded = "SaveSessionSucceeded"
}
type Event =
    | { type: EventTypes.FlowStarted; flowName: string; flowRunId: string }
    | { type: EventTypes.FlowCompleted; flowName: string; flowRunId: string }
    | { type: EventTypes.FlowFailed; flowName: string; error: string }
    | { type: EventTypes.TaskStarted; taskName: string; flowRunId: string; }
    | { type: EventTypes.TaskCompleted; taskName: string; flowRunId: string; }
    | { type: EventTypes.TaskFailed; taskName: string; flowRunId: string; error: string; }

    | { type: EventTypes.SaveTaskStateFailed; taskName: string; error: string }
    | { type: EventTypes.SaveTaskStateSucceeded; taskName: string; }

    | { type: EventTypes.SaveSessionFailed; error: string }
    | { type: EventTypes.SaveSessionSucceeded; };

const FlowStarted = (flowName: string, flowRunId: string): Event => ({ type: EventTypes.FlowStarted, flowName, flowRunId });
const FlowCompleted = (flowName: string, flowRunId: string): Event => ({ type: EventTypes.FlowCompleted, flowName, flowRunId });
const FlowFailed = (flowName: string, error: string): Event => ({ type: EventTypes.FlowFailed, flowName, error });
const TaskStarted = (taskName: string, flowRunId: string): Event => ({ type: EventTypes.TaskStarted, taskName, flowRunId });
const TaskCompleted = (taskName: string, flowRunId: string): Event => ({ type: EventTypes.TaskCompleted, taskName, flowRunId });
const TaskFailed = (taskName: string, flowRunId: string, error: string): Event => ({ type: EventTypes.TaskFailed, taskName, flowRunId, error });

const SaveTaskStateFailed = (taskName: string, error: string): Event => ({ type: EventTypes.SaveTaskStateFailed, taskName, error });
const SaveTaskStateSucceeded = (taskName: string): Event => ({ type: EventTypes.SaveTaskStateSucceeded, taskName });
const SaveSessionFailed = (error: string): Event => ({ type: EventTypes.SaveSessionFailed, error });
const SaveSessionSucceeded = (): Event => ({ type: EventTypes.SaveSessionSucceeded });

const getStream = (instanceId: InstanceId) => `${instanceId.processName}-session-${instanceId.sessionId}`;

const waitForTasks: Process<InstanceId, void, Event, void> = Process.Do<InstanceId, void, Event, void>(function* (instanceId) {

    // Wait for event
    const event = yield Process.waitForEvent<Event, Event>(ev => {
        switch (ev.type) {
            case EventTypes.TaskStarted:
            case EventTypes.TaskCompleted:
            case EventTypes.TaskFailed:
            case EventTypes.FlowCompleted:
            case EventTypes.FlowFailed:
                console.log('[Listener] Received event:', ev.type);
                return Result.Ok(ev);
            default:
                return null;
        }
    });

    // Check if flow is complete
    const isFlowComplete = event.type === EventTypes.FlowCompleted || event.type === EventTypes.FlowFailed;

    // Save state in parallel with conditional continuation
    yield Process.both(
        // Left: Save the state
        Process.fromEffect(
            async () => {
                switch (event.type) {
                    case EventTypes.TaskStarted:
                    case EventTypes.TaskCompleted:
                    case EventTypes.TaskFailed:
                        console.log('[Listener] Saving task state:', event.taskName);
                        return [SaveTaskStateSucceeded(event.taskName)];
                    case EventTypes.FlowCompleted:
                    case EventTypes.FlowFailed:
                        console.log('[Listener] Saving flow state:', event.flowName);
                        return [SaveSessionSucceeded()];
                    default:
                        throw new Error(`Unexpected event: ${event.type}`);
                }
            },
            ev => {
                switch (ev.type) {
                    case EventTypes.SaveSessionSucceeded:
                    case EventTypes.SaveTaskStateSucceeded:
                        return Result.Ok(undefined);
                    case EventTypes.SaveTaskStateFailed:
                        return Result.Err(ev.error);
                    default:
                        return null;
                }
            }
        ),
        // Right: Continue listening OR stop
        Process.ifThenElse(
            () => isFlowComplete,
            Process.ignore(),
            waitForTasks  // Recursion creates the loop!
        )
    );
});

const proc = Process.Do<InstanceId, void, Event, void>(function* () {

    // Step 1: Start prefect flow
    const flowRunId = yield CustomEffects.httpGet<Event, string>('https://jsonplaceholder.typicode.com/todos/1',
        (response) => Result.match(response, {
            Ok: (content) => FlowStarted('eAnfp_import', JSON.parse(content).flow_run_id),
            Err: (error) => FlowFailed('eAnfp_import', error)
        }),
        ev => {
            switch (ev.type) {
                case EventTypes.FlowStarted:
                    return Result.Ok(ev.flowRunId);
                case EventTypes.FlowFailed:
                    return Result.Err(ev.error);
                default:
                    return null; // Ignore other events
            }
        });

    // Step 2: Wait for tasks event
    yield waitForTasks;

});

const processName = "PrefectFlowProcess";
const processRuntime = createRuntime(eventStore);

Mediator.registerHandler(Commands.enqueueEvent.getType(processName), (cmd: Commands.enqueueEvent<InstanceId, Event>) => {
    const stream = getStream(cmd.instanceId);
    return processRuntime.handleEvent(cmd.instanceId,
        cmd.event,
        stream,
        proc
    );
});

const id = { sessionId: '1111', processName };
await processRuntime.startProcess(id, getStream(id), proc).execute();
await processRuntime.handleEvent(id, TaskStarted('Task1', 'flowRun123'), getStream(id), proc).execute();
await processRuntime.handleEvent(id, TaskStarted('Task2', 'flowRun123'), getStream(id), proc).execute();
const p1 = processRuntime.handleEvent(id, TaskCompleted('Task1', 'flowRun123'), getStream(id), proc).execute();
const p2 = processRuntime.handleEvent(id, TaskStarted('Task3', 'flowRun123'), getStream(id), proc).execute();
await Promise.all([p1, p2]);
await processRuntime.handleEvent(id, FlowCompleted('Flow1', 'flowRun123'), getStream(id), proc).execute();


console.log('Dump store events');
let events = await eventStore.loadEvents<Event>(getStream(id)).execute();
console.log('Got events 1:', events);

await defaultConnectionManager.close();