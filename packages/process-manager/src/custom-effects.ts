import { Process } from "./process-algebra.js";
import { Result } from "./result.js";

export namespace CustomEffects {

    export function httpGet<TEvent, TProcessResult>(
        url: string,
        expect: (response: Result<string>) => TEvent,
        eventHandler: (event: TEvent) => Result<TProcessResult> | null
    ): Process<any, any, TEvent, TProcessResult> {
        const proc = Process.fromEffect<TEvent, TProcessResult>(
            async () => {
                let content: string;
                try {
                    const response = await fetch(url);
                    content = await response.text();
                    if (!response.ok) {
                        return [expect(Result.Err(`HTTP error ${response.status}: ${content}`))];
                    }
                } catch (error) {
                    return [expect(Result.Err(`Network error: ${error}`))];
                }

                return [expect(Result.Ok(content))];
            },
            eventHandler
        );
        return proc;
    };

    export function httpPost<TEvent, TProcessResult>(
        url: string,
        body: any,
        expect: (response: Result<string>) => TEvent,
        eventHandler: (event: TEvent) => Result<TProcessResult> | null
    ): Process<any, any, TEvent, TProcessResult> {
        const proc = Process.fromEffect<TEvent, TProcessResult>(
            async () => {
                let content: string;
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body)
                    });
                    content = await response.text();
                    if (!response.ok) {
                        return [expect(Result.Err(`HTTP error ${response.status}: ${content}`))];
                    }
                } catch (error) {
                    return [expect(Result.Err(`Network error: ${error}`))];
                }

                return [expect(Result.Ok(content))];
            },
            eventHandler
        );
        return proc;
    };

}
