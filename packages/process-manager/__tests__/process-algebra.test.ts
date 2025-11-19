import { Process, ProcessState, ProcessStateKind } from "../src/process-algebra.js";
import { Effect } from "../src/effects.js";
import { Result } from "../src/result.js";
import { strict as assert } from "assert";

// Test Events
enum TestEventType {
    Event1 = "Event1",
    Event2 = "Event2",
    Event3 = "Event3",
    Timeout = "Timeout"
}

type TestEvent =
    | { type: TestEventType.Event1; value: number }
    | { type: TestEventType.Event2; value: string }
    | { type: TestEventType.Event3 }
    | { type: TestEventType.Timeout };

const Event1 = (value: number): TestEvent => ({ type: TestEventType.Event1, value });
const Event2 = (value: string): TestEvent => ({ type: TestEventType.Event2, value });
const Event3 = (): TestEvent => ({ type: TestEventType.Event3 });
const Timeout = (): TestEvent => ({ type: TestEventType.Timeout });

type TestInstanceId = { id: string };

const initialState = {};
const instanceId: TestInstanceId = { id: "test" };

await describe("ProcessState", async () => {
    await describe("pure", async () => {
        await it("should create a succeeded state", () => {
            const state = ProcessState.pure(undefined, 42);
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, 42);
        });
    });

    await describe("failed", async () => {
        await it("should create a failed state", () => {
            const state = ProcessState.failed(undefined, "error");
            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "error");
        });
    });

    await describe("InProgress", async () => {
        await it("should create an in-progress state", () => {
            const state = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, event.value)];
                }
                return null;
            });
            assert.equal(state.kind, ProcessStateKind.InProgress);
        });

        await it("should transition when receiving matching event", () => {
            const state = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, event.value)];
                }
                return null;
            });

            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.equal(nextState.value, 42);
        });

        await it("should return null for non-matching event", () => {
            const state = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, event.value)];
                }
                return null;
            });

            const result = state.next(Event2("test"));
            assert.equal(result, null);
        });
    });

    await describe("map", async () => {
        await it("should map succeeded state", () => {
            const state = ProcessState.pure(undefined, 42);
            const mapped = ProcessState.map((n: number) => n * 2, state);
            assert.equal(mapped.kind, ProcessStateKind.Succeeded);
            assert.equal(mapped.value, 84);
        });

        await it("should preserve failed state", () => {
            const state = ProcessState.failed(undefined, "error");
            const mapped = ProcessState.map((n: number) => n * 2, state);
            assert.equal(mapped.kind, ProcessStateKind.Failed);
            assert.equal(mapped.error, "error");
        });

        await it("should map in-progress state", () => {
            const state = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, event.value)];
                }
                return null;
            });

            const mapped = ProcessState.map((n: number) => n * 2, state);
            assert.equal(mapped.kind, ProcessStateKind.InProgress);

            const result = mapped.next(Event1(21));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.equal(nextState.value, 42);
        });
    });

    await describe("apply", async () => {
        await it("should apply function when f is succeeded", () => {
            const f = ProcessState.pure(undefined, (n: number) => n * 2);
            const state = ProcessState.pure(undefined, 21);
            const result = ProcessState.apply(f, state);
            assert.equal(result.kind, ProcessStateKind.Succeeded);
            assert.equal(result.value, 42);
        });

        await it("should return failed state when f is failed", () => {
            const f = ProcessState.failed(undefined, "f error");
            const state = ProcessState.pure(undefined, 21);
            const result = ProcessState.apply(f, state);
            assert.equal(result.kind, ProcessStateKind.Failed);
            assert.equal(result.error, "f error");
        });

        await it("should return state's failure when both are failed", () => {
            const f = ProcessState.failed(undefined, "f error");
            const state = ProcessState.failed(undefined, "state error");
            const result = ProcessState.apply(f, state);
            assert.equal(result.kind, ProcessStateKind.Failed);
            assert.equal(result.error, "state error");
        });

        await it("should apply function when f is in-progress and state is succeeded", () => {
            const f = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, (n: number) => n * event.value)];
                }
                return null;
            });
            const state = ProcessState.pure(undefined, 2);

            const result = ProcessState.apply(f, state);
            assert.equal(result.kind, ProcessStateKind.InProgress);

            const next = result.next(Event1(21));
            assert.notEqual(next, null);
            const [_, nextState] = next!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.equal(nextState.value, 42);
        });

        await it("should handle both processes in progress", () => {
            const f = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event1) {
                    return [Effect.unit(), ProcessState.pure(undefined, (n: number) => n * event.value)];
                }
                return null;
            });
            const state = ProcessState.InProgress(undefined, (event: TestEvent) => {
                if (event.type === TestEventType.Event2) {
                    return [Effect.unit(), ProcessState.pure(undefined, parseInt(event.value))];
                }
                return null;
            });

            const result = ProcessState.apply(f, state);
            assert.equal(result.kind, ProcessStateKind.InProgress);

            // Both ignore Event3
            const ignored = result.next(Event3());
            assert.equal(ignored, null);

            // Only f accepts Event1
            const fAccepts = result.next(Event1(10));
            assert.notEqual(fAccepts, null);
            const [_, nextAfterF] = fAccepts!;
            assert.equal(nextAfterF.kind, ProcessStateKind.InProgress);

            // Only state accepts Event2
            const stateAccepts = result.next(Event2("5"));
            assert.notEqual(stateAccepts, null);
            const [__, nextAfterState] = stateAccepts!;
            assert.equal(nextAfterState.kind, ProcessStateKind.InProgress);
        });
    });
});

await describe("Process", async () => {
    await describe("pure", async () => {
        await it("should create a process that immediately succeeds", async () => {
            const proc = Process.pure<number>(42);
            const [_, state] = proc(instanceId, initialState);
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, 42);
        });
    });

    await describe("failed", async () => {
        await it("should create a process that immediately fails", async () => {
            const proc = Process.failed("error");
            const [_, state] = proc(instanceId, initialState);
            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "error");
        });
    });

    await describe("waitForEvent", async () => {
        await it("should wait for a matching event", async () => {
            const proc = Process.waitForEvent<TestEvent, number>((event) => {
                if (event.type === TestEventType.Event1) {
                    return Result.Ok(event.value);
                }
                return null;
            });

            const [effect, state] = proc({ id: "test" }, initialState);
            assert.equal(state.kind, ProcessStateKind.InProgress);

            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.equal(nextState.value, 42);
        });

        await it("should fail when event handler returns error", async () => {
            const proc = Process.waitForEvent<TestEvent, number>((event) => {
                if (event.type === TestEventType.Event1) {
                    return Result.Err("validation error");
                }
                return null;
            });

            const [effect, state] = proc(instanceId, initialState);

            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Failed);
            assert.equal(nextState.error, "validation error");
        });
    });

    await describe("bind", async () => {
        await it("should chain processes", async () => {
            const proc = Process.bind(
                Process.pure<number>(21),
                (n) => Process.pure(n * 2)
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, 42);
        });

        await it("should propagate failure", async () => {
            const proc = Process.bind(
                Process.failed("error"),
                (_) => Process.pure(20)
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "error");
        });
    });

    await describe("pipe", async () => {
        await it("should compose multiple operations", async () => {
            const proc = Process.pipe(
                Process.pure<number>(10),
                (n) => Process.pure(n + 1),
                (n) => Process.pure(n * 2)
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, 22);
        });
    });

    await describe("both", async () => {
        await it("should run both processes and combine results", async () => {
            const proc = Process.both(
                Process.pure<number>(21),
                Process.pure<number>(2), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(state.value, [21, 2]);
        });

        await it("should fail if first process fails", async () => {
            const proc = Process.both(
                Process.failed("error1"),
                Process.pure(2), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "error1");
        });

        await it("should fail if second process fails", async () => {
            const proc = Process.both(
                Process.pure(21),
                Process.failed("error2"), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "error2");
        });

        await it("should handle both processes waiting for events", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }),
                Process.waitForEvent<TestEvent, string>((event) => {
                    if (event.type === TestEventType.Event2) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Send Event1 - only first process accepts it
            const result1 = state.next(Event1(42));
            assert.notEqual(result1, null);
            const [effect1, state1] = result1!;
            await effect1.execute();
            assert.equal(state1.kind, ProcessStateKind.InProgress);

            // Send Event2 - only second process accepts it
            const result2 = state1.next(Event2("hello"));
            assert.notEqual(result2, null);
            const [effect2, state2] = result2!;
            await effect2.execute();
            assert.equal(state2.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(state2.value, [42, "hello"]);
        });

        await it("should handle first process in-progress, second succeeded", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }),
                Process.pure<string>("immediate"), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(nextState.value, [42, "immediate"]);
        });

        await it("should handle first succeeded, second process in-progress", async () => {
            const proc = Process.both(
                Process.pure<number>(42),
                Process.waitForEvent<TestEvent, string>((event) => {
                    if (event.type === TestEventType.Event2) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            const result = state.next(Event2("world"));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(nextState.value, [42, "world"]);
        });

        await it("should ignore events that neither process handles", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }),
                Process.waitForEvent<TestEvent, string>((event) => {
                    if (event.type === TestEventType.Event2) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Send Event3 - neither process handles it
            const result = state.next(Event3());
            assert.equal(result, null);
        });

        await it("should handle both processes accepting the same event", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value * 2);
                    }
                    return null;
                }),
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value * 3);
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Both accept Event1
            const result = state.next(Event1(10));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(nextState.value, [20, 30]);
        });

        await it("should handle nested both operations", async () => {
            const proc = Process.both(
                Process.both(
                    Process.pure<number>(10),
                    Process.pure<number>(20), () => null
                ),
                Process.pure<number>(30), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(state.value, [[10, 20], 30]);
        });

        await it("should handle first process failing after both are in progress", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Err("first failed");
                    }
                    return null;
                }),
                Process.waitForEvent<TestEvent, string>((event) => {
                    if (event.type === TestEventType.Event2) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Failed);
            assert.equal(nextState.error, "first failed");
        });

        await it("should handle second process failing after both are in progress", async () => {
            const proc = Process.both(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }),
                Process.waitForEvent<TestEvent, string>((event) => {
                    if (event.type === TestEventType.Event2) {
                        return Result.Err("second failed");
                    }
                    return null;
                }), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // First succeeds
            const result1 = state.next(Event1(42));
            assert.notEqual(result1, null);
            const [effect1, state1] = result1!;
            await effect1.execute();
            assert.equal(state1.kind, ProcessStateKind.InProgress);

            // Second fails
            const result2 = state1.next(Event2("test"));
            assert.notEqual(result2, null);
            const [effect2, state2] = result2!;
            await effect2.execute();
            assert.equal(state2.kind, ProcessStateKind.Failed);
            assert.equal(state2.error, "second failed");
        });

        await it("should combine effects from both processes", async () => {
            let sideEffect1 = 0;
            let sideEffect2 = 0;

            const proc = Process.both(
                Process.fromEffect(
                    async () => {
                        sideEffect1 = 100;
                        return [Event1(100)];
                    },
                    (event: TestEvent) => {
                        if (event.type === TestEventType.Event1) {
                            return Result.Ok(event.value);
                        }
                        return null;
                    }
                ),
                Process.fromEffect(
                    async () => {
                        sideEffect2 = 200;
                        return [Event2("200")];
                    },
                    (event: TestEvent) => {
                        if (event.type === TestEventType.Event2) {
                            return Result.Ok(event.value);
                        }
                        return null;
                    }
                ), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            // Side effects should have been executed
            assert.equal(sideEffect1, 100);
            assert.equal(sideEffect2, 200);

            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Process the events that were emitted
            const result1 = state.next(Event1(100));
            assert.notEqual(result1, null);
            const [effect1, state1] = result1!;
            await effect1.execute();
            assert.equal(state1.kind, ProcessStateKind.InProgress);

            const result2 = state1.next(Event2("200"));
            assert.notEqual(result2, null);
            const [effect2, state2] = result2!;
            await effect2.execute();
            assert.equal(state2.kind, ProcessStateKind.Succeeded);
            assert.deepEqual(state2.value, [100, "200"]);
        });

        await it("should handle three processes with both", async () => {
            const proc = Process.both(
                Process.both(
                    Process.pure<number>(1),
                    Process.pure<number>(2), () => null
                ),
                Process.pure<number>(3), () => null
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            const proc2 = Process.map(
                ([[a, b], c]: [[number, number], number]) => a + b + c,
                proc
            );

            const [effect2, state2] = proc2(instanceId, initialState);
            await effect2.execute();
            assert.equal(state2.kind, ProcessStateKind.Succeeded);
            assert.equal(state2.value, 6);
        });
    });

    await describe("fromEffect", async () => {
        await it("should execute side effects and emit events", async () => {
            let executed = false;

            const proc = Process.fromEffect(
                async () => {
                    executed = true;
                    return [Event1(42)];
                },
                (event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }
            );

            const [effect, state] = proc(instanceId, initialState);

            // Side effect hasn't run yet
            assert.equal(executed, false);

            // Execute the effect
            await effect.execute();

            // Now the side effect has run
            assert.equal(executed, true);
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Process the emitted event
            const result = state.next(Event1(42));
            assert.notEqual(result, null);
            const [_, nextState] = result!;
            assert.equal(nextState.kind, ProcessStateKind.Succeeded);
            assert.equal(nextState.value, 42);
        });

        await it("should handle async side effects", async () => {
            const log: string[] = [];

            const proc = Process.fromEffect(
                async () => {
                    log.push("start");
                    await new Promise(resolve => setTimeout(resolve, 10));
                    log.push("end");
                    return [Event1(42)];
                },
                (event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }
            );

            const [effect, state] = proc(instanceId, initialState);
            assert.deepEqual(log, []);

            await effect.execute();
            assert.deepEqual(log, ["start", "end"]);
        });

        await it("should chain effects properly", async () => {
            const executionOrder: number[] = [];

            const proc = Process.Do(function* () {
                const result = yield Process.fromEffect(
                    async () => {
                        executionOrder.push(1);
                        return [Event1(10)];
                    },
                    (event) => {
                        if (event.type === TestEventType.Event1) {
                            return Result.Ok(event.value);
                        }
                        return null;
                    }
                )
                const result2 = yield Process.fromEffect(
                    async () => {
                        executionOrder.push(2);
                        return [Event1(result * 2)];
                    },
                    (event) => {
                        if (event.type === TestEventType.Event1) {
                            return Result.Ok(event.value);
                        }
                        return null;
                    }
                )
                return result2;
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            // Only first effect has run
            assert.deepEqual(executionOrder, [1]);

            const result1 = state.next(Event1(10));
            assert.notEqual(result1, null);
            const [effect1, state1] = result1!;
            await effect1.execute();

            // Now second effect has run
            assert.deepEqual(executionOrder, [1, 2]);

            const result2 = state1.next(Event1(20));
            assert.notEqual(result2, null);
            const [_, state2] = result2!;
            assert.equal(state2.kind, ProcessStateKind.Succeeded);
            assert.equal(state2.value, 20);
        });

        await it("should handle effect failures", async () => {
            const proc = Process.fromEffect(
                async () => {
                    throw new Error("Effect failed!");
                },
                (event: TestEvent) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }
            );

            const [effect, state] = proc(instanceId, initialState);

            try {
                await effect.execute();
                assert.fail("Should have thrown");
            } catch (error) {
                assert.equal((error as Error).message, "Effect failed!");
            }
        });

        await it("should emit multiple events from effect", async () => {
            const proc = Process.fromEffect(
                async () => {
                    return [Event1(10), Event1(20), Event1(30)];
                },
                (event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                }
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Process first event
            const result1 = state.next(Event1(10));
            assert.notEqual(result1, null);
            const [_, state1] = result1!;
            assert.equal(state1.kind, ProcessStateKind.Succeeded);
            assert.equal(state1.value, 10);
        });
    });

    await describe("ifThenElse", async () => {
        await it("should execute then branch when condition is true", async () => {
            const proc = Process.ifThenElse(
                () => true,
                Process.pure("then"),
                Process.pure("else")
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, "then");
        });

        await it("should execute else branch when condition is false", async () => {
            const proc = Process.ifThenElse(
                () => false,
                Process.pure("then"),
                Process.pure("else")
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, "else");
        });
    });

    await describe("ignore", async () => {
        await it("should create a process that returns undefined", async () => {
            const proc = Process.ignore();
            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, undefined);
        });
    });

    await describe("setState", async () => {
        await it("should modify state and continue processing", async () => {
            type CounterState = { counter: number };
            const initialCounterState: CounterState = { counter: 0 };

            const proc = Process.Do<TestInstanceId, CounterState, TestEvent, number>(function* () {
                yield Process.setState<CounterState>((state) => ({ counter: state.counter + 5 }));
                yield Process.setState<CounterState>((state) => ({ counter: state.counter * 2 }));
                const result = yield Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        return Result.Ok(event.value);
                    }
                    return null;
                });
                yield Process.setState<CounterState>((state) => ({ counter: state.counter + result }));
                return result;
            });

            const [effect, state] = proc(instanceId, initialCounterState);
            await effect.execute();

            // State should have been modified: (0 + 5) * 2 = 10
            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                assert.equal(state.state.counter, 10);

                // Process an event
                const result = state.next(Event1(42));
                assert.notEqual(result, null);
                const [effect2, nextState] = result!;
                await effect2.execute();
                assert.equal(nextState.kind, ProcessStateKind.Succeeded);
                assert.equal(nextState.value, 42);
                // State should be 10 + 42 = 52 after the setState following the event
                assert.equal(nextState.state.counter, 52);
            }
        });

        await it("should modify state with both processes", async () => {
            type CounterState = { counter: number; total: number; multiplier: number };
            const initialCounterState: CounterState = { counter: 0, total: 0, multiplier: 1 };

            const proc = Process.Do<TestInstanceId, CounterState, TestEvent, [number, string]>(function* () {
                yield Process.setState<CounterState>((state) => ({ ...state, counter: 10 }));

                const [num, str] = yield Process.both(
                    // First branch: modify state BEFORE waiting for event
                    Process.Do<TestInstanceId, CounterState, TestEvent, number>(function* () {
                        yield Process.setState<CounterState>((state) => ({ ...state, total: state.total + 100 }));
                        const value = yield Process.waitForEvent<TestEvent, number>((event) => {
                            if (event.type === TestEventType.Event1) {
                                return Result.Ok(event.value);
                            }
                            return null;
                        });
                        return value;
                    }),
                    // Second branch: wait for event, then modify state AFTER
                    Process.Do<TestInstanceId, CounterState, TestEvent, string>(function* () {
                        const value = yield Process.waitForEvent<TestEvent, string>((event) => {
                            if (event.type === TestEventType.Event2) {
                                return Result.Ok(event.value);
                            }
                            return null;
                        });
                        yield Process.setState<CounterState>((state) => ({ ...state, multiplier: state.multiplier * 5 }));
                        return value;
                    }), (left, right) => ({ counter: left.counter, total: left.total, multiplier: right.multiplier }));

                yield Process.setState<CounterState>((state) => ({
                    ...state,
                    counter: state.counter + num,
                    total: state.total + num + parseInt(str)
                }));

                return [num, str] as [number, string];
            });

            const [effect, state] = proc(instanceId, initialCounterState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                assert.equal(state.state.counter, 10);
                // The setState in the first branch before waitForEvent should have executed
                assert.equal(state.state.total, 100);  // BUG: Actually 0
                assert.equal(state.state.multiplier, 1);

                // Send Event1
                const result1 = state.next(Event1(15));
                assert.notEqual(result1, null);
                const [effect1, state1] = result1!;
                await effect1.execute();
                assert.equal(state1.kind, ProcessStateKind.InProgress);

                if (state1.kind === ProcessStateKind.InProgress) {
                    // After Event1, the first branch completed, total should still be 100
                    assert.equal(state1.state.total, 100);  // BUG: Actually 0

                    // Send Event2
                    const result2 = state1.next(Event2("25"));
                    assert.notEqual(result2, null);
                    const [effect2, state2] = result2!;
                    await effect2.execute();
                    assert.equal(state2.kind, ProcessStateKind.Succeeded);
                    assert.deepEqual(state2.value, [15, "25"]);
                    // Final state should be:
                    // counter = 10 + 15 = 25
                    // total = 100 (from first branch) + 15 + 25 = 140
                    // multiplier = 1 * 5 (from second branch) = 5
                    assert.equal(state2.state.counter, 25);
                    assert.equal(state2.state.total, 140);  // BUG: Actually 40
                    assert.equal(state2.state.multiplier, 5);
                }
            }
        });

        await it("should replace state object entirely", async () => {
            type UserState = { userId: string; name: string };
            const initialUserState: UserState = { userId: "user1", name: "Alice" };

            const proc = Process.Do<TestInstanceId, UserState, TestEvent, string>(function* () {
                yield Process.setState<UserState>(() => ({ userId: "user2", name: "Bob" }));
                return "done";
            });

            const [effect, state] = proc(instanceId, initialUserState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, "done");
            assert.equal(state.state.userId, "user2");
            assert.equal(state.state.name, "Bob");
        });

        await it("should work with event handlers that use state", async () => {
            type CounterState = { counter: number };
            const initialCounterState: CounterState = { counter: 0 };

            const proc = Process.Do<TestInstanceId, CounterState, TestEvent, number>(function* () {
                yield Process.setState<CounterState>((state) => ({ counter: state.counter + 10 }));
                const value = yield Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        // Event handler can access the modified state through the process state
                        return Result.Ok(event.value);
                    }
                    return null;
                });
                yield Process.setState<CounterState>((state) => ({ counter: state.counter + value }));
                return 0; // Return a value we can ignore, we care about final state
            });

            const [effect, state] = proc(instanceId, initialCounterState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                assert.equal(state.state.counter, 10);

                const result1 = state.next(Event1(5));
                assert.notEqual(result1, null);
                const [effect1, state1] = result1!;
                await effect1.execute();

                // After processing event and another setState: 10 + 5 = 15
                assert.equal(state1.kind, ProcessStateKind.Succeeded);
                assert.equal(state1.state.counter, 15);
            }
        });

        await it("should chain multiple state modifications", async () => {
            type State = { a: number; b: number; c: number };
            const initialState: State = { a: 1, b: 2, c: 3 };

            const proc = Process.Do<TestInstanceId, State, TestEvent, string>(function* () {
                yield Process.setState<State>((s) => ({ ...s, a: s.a * 2 }));
                yield Process.setState<State>((s) => ({ ...s, b: s.b * 3 }));
                yield Process.setState<State>((s) => ({ ...s, c: s.c * 4 }));
                return "complete";
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, "complete");
            assert.equal(state.state.a, 2);  // 1 * 2
            assert.equal(state.state.b, 6);  // 2 * 3
            assert.equal(state.state.c, 12); // 3 * 4
        });

        await it("should work with nested Process.both", async () => {
            type State = { x: number; y: number; z: number };
            const initialState: State = { x: 0, y: 0, z: 0 };

            const proc = Process.Do(function* () {
                const [[a, b], c] = yield Process.both(
                    Process.both(
                        Process.Do(function* () {
                            yield Process.setState<State>((s) => ({ ...s, x: 10 }));
                            return 1;
                        }),
                        Process.Do(function* () {
                            yield Process.setState<State>((s) => ({ ...s, y: 20 }));
                            return 2;
                        }), (left, right) => ({ x: left.x, y: right.y, z: left.z })),
                    Process.Do(function* () {
                        yield Process.setState<State>((s) => ({ ...s, z: 30 }));
                        return 3;
                    }), (left, right) => ({ x: left.x, y: left.y, z: right.z })
                );
                return a + b + c;
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.Succeeded);
            assert.equal(state.value, 6); // 1 + 2 + 3
            assert.equal(state.state.x, 10);
            assert.equal(state.state.y, 20);
            assert.equal(state.state.z, 30);
        });

        await it("should work in error/failure scenarios", async () => {
            type State = { counter: number; status: string };
            const initialState: State = { counter: 0, status: "initial" };

            const proc = Process.Do<TestInstanceId, State, TestEvent, string>(function* () {
                yield Process.setState<State>((s) => ({ ...s, counter: 5, status: "before-failure" }));
                const result = yield Process.failed("something went wrong");
                return result;
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.Failed);
            assert.equal(state.error, "something went wrong");
            // State should still be modified even though process failed
            assert.equal(state.state.counter, 5);
            assert.equal(state.state.status, "before-failure");
        });

        await it("should work with event handlers accessing updated state", async () => {
            type State = { multiplier: number; values: number[] };
            const initialState: State = { multiplier: 1, values: [] };

            const proc = Process.Do<TestInstanceId, State, TestEvent, number>(function* () {
                yield Process.setState<State>((s) => ({ ...s, multiplier: 10 }));

                const value = yield Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        // Event handler should see the updated state through closure
                        // But due to the bug, it might not work as expected
                        return Result.Ok(event.value);
                    }
                    return null;
                });

                yield Process.setState<State>((s) => ({
                    ...s,
                    values: [...s.values, value * s.multiplier]
                }));

                return value;
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                assert.equal(state.state.multiplier, 10);

                const result = state.next(Event1(5));
                assert.notEqual(result, null);
                const [effect1, state1] = result!;
                await effect1.execute();

                assert.equal(state1.kind, ProcessStateKind.Succeeded);
                assert.equal(state1.value, 5);
                assert.equal(state1.state.multiplier, 10);
                assert.deepEqual(state1.state.values, [50]); // 5 * 10
            }
        });

        await it("should lose left branch state changes when right branch doesn't modify state", async () => {
            type State = { counter: number; flag: boolean };
            const initialState: State = { counter: 0, flag: false };

            const proc = Process.Do<TestInstanceId, State, TestEvent, [number, string]>(function* () {
                // Set initial state before both
                yield Process.setState<State>((s) => ({ ...s, counter: 10 }));

                const [num, str] = yield Process.both(
                    // Left branch: modify state
                    Process.Do<TestInstanceId, State, TestEvent, number>(function* () {
                        const evt1 = yield Process.waitForEvent<TestEvent, number>(
                            (e) => {
                                if (e.type === TestEventType.Event1) {
                                    return Result.Ok(e.value);
                                }
                                return null;
                            }
                        );
                        yield Process.setState<State>((s) => ({ ...s, counter: s.counter + 5 }));
                        return evt1;
                    }),
                    // Right branch: don't modify state
                    Process.Do<TestInstanceId, State, TestEvent, string>(function* () {
                        const evt2 = yield Process.waitForEvent<TestEvent, string>(
                            (e) => {
                                if (e.type === TestEventType.Event2) {
                                    return Result.Ok(e.value);
                                }
                                return null;
                            }
                        );
                        return evt2;
                    }), (state1, state2) => ({ counter: state1.counter, flag: state1.flag || state2.flag })
                );

                return [num, str] as [number, string];
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);

            if (state.kind === ProcessStateKind.InProgress) {
                const result2 = state.next(Event1(100));
                assert.notEqual(result2, null);
                const [, state2] = result2!;
                assert.equal(state2.kind, ProcessStateKind.InProgress);

                if (state2.kind === ProcessStateKind.InProgress) {
                    const result3 = state2.next(Event2("done"));
                    assert.notEqual(result3, null);
                    const [, state3] = result3!;
                    assert.equal(state3.kind, ProcessStateKind.Succeeded);
                    assert.deepEqual(state3.value, [100, "done"]);
                    // State should be: initial 0 + 10 (before both) + 5 (left branch) = 15
                    // But due to state merging, right side wins and doesn't include left's modification
                    assert.equal(state3.state.counter, 15); // This will fail, actual is 10
                    assert.equal(state3.state.flag, false);
                }
            }
        });

        await it("should preserve state when left branch fails after modifying state", async () => {
            type State = { counter: number; errorLog: string[] };
            const initialState: State = { counter: 0, errorLog: [] };

            const proc = Process.Do<TestInstanceId, State, TestEvent, [number, string]>(function* () {
                yield Process.setState<State>((s) => ({ ...s, counter: 10 }));

                const [num, str] = yield Process.both(
                    // Left branch: modify state then fail
                    Process.Do<TestInstanceId, State, TestEvent, number>(function* () {
                        yield Process.setState<State>((s) => ({
                            ...s,
                            counter: s.counter + 5,
                            errorLog: [...s.errorLog, "before-event"]
                        }));
                        const evt = yield Process.waitForEvent<TestEvent, number>(
                            (e) => {
                                if (e.type === TestEventType.Event1) {
                                    return Result.Err("left-branch-failed");
                                }
                                return null;
                            }
                        );
                        return evt;
                    }),
                    // Right branch: waits for different event
                    Process.Do<TestInstanceId, State, TestEvent, string>(function* () {
                        const evt = yield Process.waitForEvent<TestEvent, string>(
                            (e) => {
                                if (e.type === TestEventType.Event2) {
                                    return Result.Ok(e.value);
                                }
                                return null;
                            }
                        );
                        return evt;
                    }),
                    (left, right) => ({
                        counter: left.counter,
                        errorLog: [...left.errorLog, ...right.errorLog]
                    })
                );

                return [num, str];
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                // Check state after both() but before any events
                assert.equal(state.state.counter, 15, "Counter should be 15 after setState in left branch");
                assert.deepEqual(state.state.errorLog, ["before-event"], "ErrorLog should contain before-event");

                // Send Event1 - left branch will fail
                const result = state.next(Event1(100));
                assert.notEqual(result, null);
                const [effect1, state1] = result!;
                await effect1.execute();

                assert.equal(state1.kind, ProcessStateKind.Failed);
                assert.equal(state1.error, "left-branch-failed");

                // Check if state modifications before failure are preserved
                assert.equal(state1.state.counter, 15, "Counter should still be 15 even after failure");
                assert.deepEqual(state1.state.errorLog, ["before-event"], "ErrorLog should still contain before-event");
            }
        });

        await it("should preserve state from both branches when right branch fails", async () => {
            type State = { counter: number; message: string };
            const initialState: State = { counter: 0, message: "" };

            const proc = Process.Do<TestInstanceId, State, TestEvent, [number, string]>(function* () {
                yield Process.setState<State>((s) => ({ ...s, counter: 10 }));

                const [num, str] = yield Process.both(
                    // Left branch: modify state and succeed
                    Process.Do<TestInstanceId, State, TestEvent, number>(function* () {
                        yield Process.setState<State>((s) => ({ ...s, counter: s.counter + 20 }));
                        const evt = yield Process.waitForEvent<TestEvent, number>(
                            (e) => {
                                if (e.type === TestEventType.Event1) {
                                    return Result.Ok(e.value);
                                }
                                return null;
                            }
                        );
                        yield Process.setState<State>((s) => ({ ...s, counter: s.counter + evt }));
                        return evt;
                    }),
                    // Right branch: modify state then fail
                    Process.Do<TestInstanceId, State, TestEvent, string>(function* () {
                        yield Process.setState<State>((s) => ({ ...s, message: "right-started" }));
                        const evt = yield Process.waitForEvent<TestEvent, string>(
                            (e) => {
                                if (e.type === TestEventType.Event2) {
                                    return Result.Err("right-branch-failed");
                                }
                                return null;
                            }
                        );
                        return evt;
                    }),
                    (left, right) => ({ counter: left.counter, message: right.message })
                );

                return [num, str];
            });

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();

            assert.equal(state.kind, ProcessStateKind.InProgress);
            if (state.kind === ProcessStateKind.InProgress) {
                assert.equal(state.state.counter, 30, "Counter should be 30 (10+20)");
                assert.equal(state.state.message, "right-started");

                // Send Event1 - left branch succeeds
                const result1 = state.next(Event1(5));
                assert.notEqual(result1, null);
                const [effect1, state1] = result1!;
                await effect1.execute();

                assert.equal(state1.kind, ProcessStateKind.InProgress);
                if (state1.kind === ProcessStateKind.InProgress) {
                    assert.equal(state1.state.counter, 35, "Counter should be 35 (30+5)");

                    // Send Event2 - right branch fails
                    const result2 = state1.next(Event2("test"));
                    assert.notEqual(result2, null);
                    const [effect2, state2] = result2!;
                    await effect2.execute();

                    assert.equal(state2.kind, ProcessStateKind.Failed);
                    assert.equal(state2.error, "right-branch-failed");
                    assert.equal(state2.state.counter, 35, "Counter should still be 35 after failure");
                    assert.equal(state2.state.message, "right-started");
                }
            }
        });
    });

    await describe("complex scenario", async () => {
        await it("should handle a realistic workflow", async () => {
            let events: TestEvent[] = [];

            const proc = Process.pipe(
                Process.waitForEvent<TestEvent, number>((event) => {
                    if (event.type === TestEventType.Event1) {
                        events.push(event);
                        return Result.Ok(event.value);
                    }
                    return null;
                }),
                (value1) => Process.pipe(
                    Process.waitForEvent<TestEvent, number>((event) => {
                        if (event.type === TestEventType.Event1) {
                            events.push(event);
                            return Result.Ok(event.value);
                        }
                        return null;
                    }),
                    (value2) => Process.pure(value1 + value2)
                )
            );

            const [effect, state] = proc(instanceId, initialState);
            await effect.execute();
            assert.equal(state.kind, ProcessStateKind.InProgress);

            // Send first event
            const result1 = state.next(Event1(10));
            assert.notEqual(result1, null);
            const [effect1, state1] = result1!;
            await effect1.execute();
            assert.equal(state1.kind, ProcessStateKind.InProgress);

            // Send second event
            const result2 = state1.next(Event1(32));
            assert.notEqual(result2, null);
            const [effect2, state2] = result2!;
            await effect2.execute();
            assert.equal(state2.kind, ProcessStateKind.Succeeded);
            assert.equal(state2.value, 42);
            assert.equal(events.length, 2);
        });
    });
});

// Simple test runner
async function describe(name: string, fn: () => void | Promise<void>) {
    console.log(`\n${name}`);
    await fn();
}

async function it(name: string, fn: () => void | Promise<void>) {
    try {
        await fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}`);
        console.error(`    ${error}`);
        throw error;
    }
}

// Run tests
console.log("Running Process Algebra Tests...\n");