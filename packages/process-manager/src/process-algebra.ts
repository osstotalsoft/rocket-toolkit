import { Effect } from "./effects.js";
import { Commands, Mediator } from "./mediator.js";
import { Result } from "./result.js";

export type Process<TInstanceId, TState, TEvent, TResult> = (instanceId: TInstanceId, initialState: TState) => ProcessResult<TState, TEvent, TResult>;

export type ProcessResult<TState, TEvent, TResult> = [
    Effect<void>,
    ProcessState<TState, TEvent, TResult>
];

export const enum ProcessStateKind {
    Succeeded = 'Succeeded',
    InProgress = 'InProgress',
    Failed = 'Failed',
}

export type ProcessState<TState, TEvent, TResult> =
    | { kind: ProcessStateKind.InProgress, state: TState, next: (event: TEvent) => ProcessResult<TState, TEvent, TResult> | null }
    | { kind: ProcessStateKind.Succeeded, state: TState, value: TResult }
    | { kind: ProcessStateKind.Failed, state: TState, error: string };

export namespace ProcessState {

    export function pure<TState, TResult>(state: TState, a: TResult): ProcessState<TState, any, TResult> {
        return { kind: ProcessStateKind.Succeeded, state, value: a };
    }

    export function failed<TState>(state: TState, error: string): ProcessState<TState, any, any> {
        return { kind: ProcessStateKind.Failed, state, error };
    }

    export function InProgress<TState, TEvent, TResult>(
        state: TState,
        next: (event: TEvent) => ProcessResult<TState, TEvent, TResult> | null
    ): ProcessState<TState, TEvent, TResult> {
        return { kind: ProcessStateKind.InProgress, state, next };
    }

    export function map<TState, TEvent, TResult1, TResult2>(
        f: (a: TResult1) => TResult2,
        state: ProcessState<TState, TEvent, TResult1>
    ): ProcessState<TState, TEvent, TResult2> {
        switch (state.kind) {
            case ProcessStateKind.Succeeded:
                return ProcessState.pure(state.state, f(state.value));
            case ProcessStateKind.Failed:
                return state;
            case ProcessStateKind.InProgress:
                return ProcessState.InProgress(state.state, (event) => {
                    const next = state.next(event);
                    if (next === null)
                        return null;
                    const [eff, nextState] = next;
                    return [eff, map(f, nextState)];
                });
        }
    }


    export function mapState<TState1, TState2>(
        f: (state: TState1) => TState2,
        processState: ProcessState<TState1, any, any>
    ): ProcessState<TState2, any, any> {
        switch (processState.kind) {
            case ProcessStateKind.Succeeded:
                return { kind: ProcessStateKind.Succeeded, state: f(processState.state), value: processState.value };
            case ProcessStateKind.Failed:
                return { kind: ProcessStateKind.Failed, state: f(processState.state), error: processState.error };
            case ProcessStateKind.InProgress:
                return ProcessState.InProgress(f(processState.state), (event) => {
                    const result = processState.next(event);
                    if (result === null) {
                        return null;
                    }
                    const [effect, nextState] = result;
                    return [effect, mapState(f, nextState)];
                });
        }
    }

    export function apply<TState, TEvent, TResult1, TResult2>(
        f: ProcessState<TState, TEvent, (a: TResult1) => TResult2>,
        state: ProcessState<TState, TEvent, TResult1>
    ): ProcessState<[TState, TState], TEvent, TResult2> {
        switch (f.kind) {
            case ProcessStateKind.Succeeded:
                const newState = map(f.value, state);
                return mapState(s => [f.state, s], newState);
            case ProcessStateKind.Failed:
                switch (state.kind) {
                    case ProcessStateKind.Failed:
                        return mapState(s => [f.state, s], state);
                    default:
                        return mapState(s => [s, state.state], f);
                }
            case ProcessStateKind.InProgress:
                switch (state.kind) {
                    case ProcessStateKind.Succeeded:
                        const newF = map(f => f(state.value), f);
                        return mapState(s => [s, state.state], newF);
                    case ProcessStateKind.Failed:
                        return mapState(s => [f.state, s], state);
                    case ProcessStateKind.InProgress:
                        return ProcessState.InProgress([f.state, state.state], (event) => {
                            const fResult = f.next(event);
                            const stateResult = state.next(event);

                            // If both ignore the event, propagate null
                            if (fResult === null && stateResult === null)
                                return null;

                            // If only f accepts the event
                            if (fResult !== null && stateResult === null) {
                                const [effF, nextF] = fResult;
                                return [effF, ProcessState.apply(nextF, state)];
                            }

                            // If only state accepts the event
                            if (fResult === null && stateResult !== null) {
                                const [effState, nextState] = stateResult;
                                return [effState, ProcessState.apply(f, nextState)];
                            }

                            // Both accept the event
                            const [effF, nextF] = fResult!;
                            const [effState, nextState] = stateResult!;
                            const combinedEffect = Effect.bind(effF, () => effState);
                            return [combinedEffect, ProcessState.apply(nextF, nextState)];
                        });
                }
        }
    }
}

export namespace Process {

    /**
     * Creates a Process from a generator function.
     * The generator can yield other Processes, allowing for sequential composition.
     * 
     * @param genFn  The generator function that yields Processes.
     * @returns  A Process that executes the generator function.
     */
    export function Do<TInstanceId, TState, TEvent, TResult>(
        genFn: (instanceId: TInstanceId) => Generator<Process<TInstanceId, TState, TEvent, any>, TResult, any>
    ): Process<TInstanceId, TState, TEvent, TResult> {
        return (instanceId: TInstanceId, initialState: TState) => {

            // Get the generator
            const iterator = genFn(instanceId);

            // Helper function to step through the generator
            function step(prevValue?: any): Process<TInstanceId, TState, TEvent, TResult> {
                const result = iterator.next(prevValue);

                if (result.done) {
                    // Generator completed, return the final value
                    return Process.pure(result.value);
                }

                // Generator yielded a process, bind it to continue
                const yieldedProcess = result.value;

                return Process.bind(
                    yieldedProcess,
                    (value) => step(value)
                );
            }

            // Start the generator and execute the resulting process with instanceId
            const process = step();
            return process(instanceId, initialState);
        };
    }

    export function both<TInstanceId, TState, TEvent, TResult1, TResult2>(
        proc1: Process<TInstanceId, TState, TEvent, TResult1>,
        proc2: Process<TInstanceId, TState, TEvent, TResult2>,
        stateMerger: (leftState: TState, rightState: TState) => TState
    ): Process<TInstanceId, TState, TEvent, [TResult1, TResult2]> {
        return (instanceId, initialState) => {
            const [eff1, state1] = proc1(instanceId, initialState);
            const [eff2, state2] = proc2(instanceId, initialState);

            // Combine effects
            const combinedEffect = Effect.pipe(eff1, () => eff2);
            // Combine states
            const mappedState1 = ProcessState.map(a => (b: TResult2): [TResult1, TResult2] => [a, b], state1);
            const combinedState = ProcessState.mapState(
                ([leftState, rightState]) => stateMerger(leftState, rightState),
                ProcessState.apply(mappedState1, state2)
            );

            return [combinedEffect, combinedState];
        }
    }


    export function pure<TResult>(value: TResult): Process<any, any, any, TResult> {
        return (_, state) => [Effect.unit(), ProcessState.pure(state, value)];
    }

    export function failed(value: string): Process<any, any, any, any> {
        return (_, state) => [Effect.unit(), ProcessState.failed(state, value)];
    }

    export function ignore(): Process<any, any, any, void> {
        return pure(undefined);
    }

    export function liftEffect(effect: Effect<void>): Process<any, any, any, void> {
        return (_, state) => [effect, ProcessState.pure(state, undefined)];
    }

    export function liftEventReturningEffect<TEvent>(effect: Effect<TEvent[]>)
        : Process<any, TEvent, any, void> {
        return (instanceId, initialState) => [
            Effect.pipe(
                effect,
                evList => Effect.traverse(
                    evList, (ev) => Mediator.send(new Commands.enqueueEvent(instanceId, ev))
                ),
                Effect.unit
            ),
            ProcessState.pure(initialState, undefined)];

    }

    export function map<TInstanceId, TState, TEvent, TResult, TNextResult>(
        f: (result: TResult) => TNextResult,
        proc: Process<TInstanceId, TState, TEvent, TResult>
    ): Process<TInstanceId, TState, TEvent, TNextResult> {
        return (instanceId, initialState) => {
            const [effect, state] = proc(instanceId, initialState);
            const mappedState = ProcessState.map(f, state);
            return [effect, mappedState];
        }
    }

    export function bind<TInstanceId, TState, TEvent, TResult, TNextResult>(
        proc: Process<TInstanceId, TState, TEvent, TResult>,
        f: (result: TResult) => Process<TInstanceId, TState, TEvent, TNextResult>
    ): Process<TInstanceId, TState, TEvent, TNextResult> {

        return (instanceId, initialState) => {
            const [effect, state] = proc(instanceId, initialState);
            switch (state.kind) {
                case ProcessStateKind.Succeeded: {
                    const [nextEffect, nextState] = f(state.value)(instanceId, state.state);

                    // Sequence the effects: first effect, then next effect
                    const combinedEffect = Effect.bind(effect, () => nextEffect);
                    return [combinedEffect, nextState];
                }
                case ProcessStateKind.Failed:
                    return [effect, state];
                case ProcessStateKind.InProgress:
                    return [
                        effect,
                        ProcessState.InProgress(
                            state.state,
                            (event) => {
                                const result = state.next(event);
                                // If event was ignored, propagate null
                                if (result === null) {
                                    return null;
                                }
                                const [_, resultState] = result;
                                return bind((_, st) => result, f)(instanceId, resultState.state);
                            })
                    ];
            }

        };
    }

    export function waitForEvent<TEvent, TResult>(eventFn: (event: TEvent) => Result<TResult> | null)
        : Process<any, any, TEvent, TResult> {
        return (_, state) => {
            return [Effect.unit(), ProcessState.InProgress(state, ev => {
                const r = eventFn(ev);
                if (r === null) {
                    // Event doesn't match, stay in progress 
                    return null;
                }

                return Result.match(r, {
                    Ok: (v) => [Effect.unit(), ProcessState.pure(state, v)],
                    Err: (e) => [Effect.unit(), ProcessState.failed(state, e)]
                });
            })];
        };
    }

    export function fromEffect<TEvent, TResult>(effectFn: () => Promise<TEvent[]>,
        eventHandlerFn: (event: TEvent) => Result<TResult> | null)
        : Process<any, any, TEvent, TResult> {
        return Process.bind(
            Process.liftEventReturningEffect(Effect.fromAsync(effectFn)),
            () => Process.waitForEvent(eventHandlerFn)
        );
    }

    export function fromSideEffect(effectFn: () => Promise<void>): Process<any, any, any, void> {
        return Process.liftEffect(Effect.fromAsync(effectFn));
    }

    export function setState<TState>(stateFn: (currentState: TState) => TState): Process<any, TState, any, void> {
        return (_, initialState) => {
            const newState = stateFn(initialState);
            return [Effect.unit(), ProcessState.pure(newState, undefined)];
        };
    }

    export function ifThenElse<TInstanceId, TState, TEvent, TResult>(
        condition: () => boolean,
        thenProc: Process<TInstanceId, TState, TEvent, TResult>,
        elseProc: Process<TInstanceId, TState, TEvent, TResult>
    ): Process<TInstanceId, TState, TEvent, TResult> {
        return (instanceId, state) => {
            if (condition()) {
                return thenProc(instanceId, state);
            }
            return elseProc(instanceId, state);
        };
    }

    // Pipe overloads for type safety

    // 2 processes
    export function pipe<TInstanceId, TState, TEvent, A, B>(
        proc: Process<TInstanceId, TState, TEvent, A>,
        f: (a: A) => Process<TInstanceId, TState, TEvent, B>
    ): Process<TInstanceId, TState, TEvent, B>;

    // 3 processes
    export function pipe<TInstanceId, TState, TEvent, A, B, C>(
        proc: Process<TInstanceId, TState, TEvent, A>,
        f: (a: A) => Process<TInstanceId, TState, TEvent, B>,
        g: (b: B) => Process<TInstanceId, TState, TEvent, C>
    ): Process<TInstanceId, TState, TEvent, C>;

    // 4 processes
    export function pipe<TInstanceId, TState, TEvent, A, B, C, D>(
        proc: Process<TInstanceId, TState, TEvent, A>,
        f: (a: A) => Process<TInstanceId, TState, TEvent, B>,
        g: (b: B) => Process<TInstanceId, TState, TEvent, C>,
        h: (c: C) => Process<TInstanceId, TState, TEvent, D>
    ): Process<TInstanceId, TState, TEvent, D>;

    // 5 processes
    export function pipe<TInstanceId, TState, TEvent, A, B, C, D, E>(
        proc: Process<TInstanceId, TState, TEvent, A>,
        f: (a: A) => Process<TInstanceId, TState, TEvent, B>,
        g: (b: B) => Process<TInstanceId, TState, TEvent, C>,
        h: (c: C) => Process<TInstanceId, TState, TEvent, D>,
        i: (d: D) => Process<TInstanceId, TState, TEvent, E>
    ): Process<TInstanceId, TState, TEvent, E>;

    // 6 processes
    export function pipe<TInstanceId, TState, TEvent, A, B, C, D, E, F>(
        proc: Process<TInstanceId, TState, TEvent, A>,
        f: (a: A) => Process<TInstanceId, TState, TEvent, B>,
        g: (b: B) => Process<TInstanceId, TState, TEvent, C>,
        h: (c: C) => Process<TInstanceId, TState, TEvent, D>,
        i: (d: D) => Process<TInstanceId, TState, TEvent, E>,
        j: (e: E) => Process<TInstanceId, TState, TEvent, F>
    ): Process<TInstanceId, TState, TEvent, F>;

    // Implementation
    export function pipe<TInstanceId, TState, TEvent, TResult>(
        proc: Process<TInstanceId, TState, TEvent, any>,
        ...fns: Array<(x: any) => Process<TInstanceId, TState, TEvent, any>>
    ): Process<TInstanceId, TState, TEvent, TResult> {
        return fns.reduce(
            (acc, fn) => bind(acc, fn),
            proc
        );
    }

}
