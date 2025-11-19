import { Effect } from "./effects.js";

interface ICommand {
    getType(): string;
}

export class Mediator {
    private static handlers = new Map<string, (input: any) => Effect<any>>();

    static registerHandler<TInput extends ICommand, TOutput>(
        messageType: string, handler: (input: TInput) => Effect<TOutput>
    ): void {
        this.handlers.set(messageType, handler);
    }

    static send<TInput extends ICommand, TOutput>(cmd: TInput): Effect<TOutput> {
        const handler = this.handlers.get(cmd.getType());
        if (!handler) {
            return Effect.unit() as Effect<TOutput>;
        }
        return handler(cmd);
    }
}

export namespace Commands {
    export class enqueueEvent<TInstanceId extends { processName: string }, TEvent> implements ICommand {
        constructor(public instanceId: TInstanceId, public event: TEvent) { }
        static name = "enqueueEvent";
        static getType(processName: string): string {
            return `${processName}.${enqueueEvent.name}`;
        }
        getType(): string {
            return enqueueEvent.getType(this.instanceId.processName);
        }
    }
}