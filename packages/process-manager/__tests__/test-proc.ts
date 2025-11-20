import { Process } from "../src/process-algebra.js";
import { Result } from "../src/result.js";
import { CustomEffects } from "../src/custom-effects.js";
import { createRuntime } from "../src/process-runtime.js";
import { Commands, Mediator } from "../src/mediator.js";
import eventStore from "../src/event-store/inmemory.js";

type InstanceId = { tenantId: string, tenantName: string, processName: string };
type TestProcState = {
    username?: string;
    completed?: boolean;
};
enum EventTypes {
    GotUserSuccess = "GotUserSuccess",
    GotUserFailed = "GotUserFailed",
    GotTodosSuccess = "GotTodosSuccess",
    GotTodosFailed = "GotTodosFailed",
}
type Event =
    | { type: EventTypes.GotUserSuccess; username: string }
    | { type: EventTypes.GotUserFailed; error: string }
    | { type: EventTypes.GotTodosSuccess; todos: string }
    | { type: EventTypes.GotTodosFailed; error: string }

const GotUserSuccess = (username: string): Event => { return { type: EventTypes.GotUserSuccess, username }; };
const GotUserFailed = (error: string): Event => { return { type: EventTypes.GotUserFailed, error }; };
const GotTodosSuccess = (todos: string): Event => { return { type: EventTypes.GotTodosSuccess, todos }; };
const GotTodosFailed = (error: string): Event => { return { type: EventTypes.GotTodosFailed, error }; };



const httpWikiGet = CustomEffects.httpGet<Event, string>(
    'https://jsonplaceholder.typicode.com/todos/1',
    (r) => {
        return Result.match(r, {
            Ok: (v) => GotUserSuccess(JSON.parse(v).title),
            Err: (e) => GotUserFailed(e)
        });
    },
    (event) => {
        switch (event.type) {
            case EventTypes.GotUserSuccess:
                return Result.Ok(event.username);
            case EventTypes.GotUserFailed:
                return Result.Err(`Error in GotUser event: ${event.error}`);
            default:
                return null;
        }
    }
);

const getStream = (instanceId: InstanceId) => `${instanceId.processName}-tenant-${instanceId.tenantId}-stream`;
const proc = Process.Do<InstanceId, TestProcState, Event, void>(
    function* (_) {
        const username = yield httpWikiGet;
        yield Process.setState(state => ({ ...state, username }));
        yield Process.fromSideEffect(async () => {
            console.log(`Process completed for user: ${username}`);
        })
        yield Process.setState(state => ({ ...state, completed: true }));
    }
);

const processRuntime = createRuntime(eventStore);
const id = { tenantId: '123', tenantName: 'TestTenant', processName: 'proc1' };
const initialState: TestProcState = {};
Mediator.registerHandler(Commands.enqueueEvent.name, (cmd: Commands.enqueueEvent<InstanceId, Event>) => {
    const stream = getStream(cmd.instanceId);
    return processRuntime.handleEvent(cmd.instanceId, cmd.event, stream, proc);
});


await processRuntime.handleEvent(id, GotUserSuccess('testuser'), getStream(id), proc).execute();
let events = await eventStore.loadEvents<Event>(getStream(id)).execute();
console.log('Got events 1:', events);

await processRuntime.handleEvent(id, GotUserSuccess('testuser2'), getStream(id), proc).execute();

events = await eventStore.loadEvents<Event>(getStream(id)).execute();
console.log('Got events 2:', events);
