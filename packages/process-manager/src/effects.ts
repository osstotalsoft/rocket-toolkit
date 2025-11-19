export class Effect<T> {
    constructor(private readonly computation: () => Promise<T>) { }

    execute(): Promise<T> {
        return this.computation();
    }
}

export namespace Effect {

    // Monadic bind
    export function bind<A, B>(effect: Effect<A>, f: (a: A) => Effect<B>): Effect<B> {
        return new Effect(async () => {
            const a = await effect.execute();
            const effectB = f(a);
            return await effectB.execute();
        });
    }

    export function catchError<T>(
        effect: Effect<T>,
        handler: (error: any) => Effect<T>
    ): Effect<T> {
        return Effect.fromAsync(async () => {
            try {
                return await effect.execute();
            } catch (error) {
                return await handler(error).execute();
            }
        });
    }

    export function pipe<A, B>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>
    ): Effect<B>;

    export function pipe<A, B, C>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>,
        g: (b: B) => Effect<C>
    ): Effect<C>;

    export function pipe<A, B, C, D>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>,
        g: (b: B) => Effect<C>,
        h: (c: C) => Effect<D>
    ): Effect<D>;

    export function pipe<A, B, C, D, E>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>,
        g: (b: B) => Effect<C>,
        h: (c: C) => Effect<D>,
        i: (d: D) => Effect<E>
    ): Effect<E>;

    export function pipe<A, B, C, D, E, F>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>,
        g: (b: B) => Effect<C>,
        h: (c: C) => Effect<D>,
        i: (d: D) => Effect<E>,
        j: (e: E) => Effect<F>
    ): Effect<F>;

    export function pipe<A, B, C, D, E, F, G>(
        effect: Effect<A>,
        f: (a: A) => Effect<B>,
        g: (b: B) => Effect<C>,
        h: (c: C) => Effect<D>,
        i: (d: D) => Effect<E>,
        j: (e: E) => Effect<F>,
        k: (f: F) => Effect<G>
    ): Effect<G>;

    // Implementation
    export function pipe<T>(
        effect: Effect<T>,
        ...fns: Array<(x: any) => Effect<any>>
    ): Effect<any> {
        return fns.reduce(
            (acc, fn) => bind(acc, fn),
            effect as Effect<any>
        );
    }

    // Pure for void (no value)
    export function unit(): Effect<void> {
        return new Effect(async () => undefined);
    }

    // Pure/return
    export function pure<T>(value?: T): Effect<T> {
        return new Effect(async () => value as T);
    }

    // Sequence multiple effects into one (left-to-right execution)
    export function sequence<A>(effects: Effect<A>[]): Effect<A[]> {
        return new Effect<A[]>(async () => {
            const results: A[] = [];
            for (const effect of effects) {
                const result = await effect.execute();
                results.push(result);
            }
            return results;
        });
    }

    // Traverse: map each element to an effect, then sequence them
    export function traverse<A, B>(list: A[], f: (a: A) => Effect<B>): Effect<B[]> {
        return sequence(list.map(f));
    }

    // Map over the effect value
    export function map<A, B>(effect: Effect<A>, f: (a: A) => B): Effect<B> {
        return bind(effect, (a) => pure(f(a)));
    }

    // Ignore the result
    export function ignore(effect: Effect<any>): Effect<void> {
        return map(effect, () => undefined);
    }

    export function lift2<A, B, C>(
        f: (a: A, b: B) => C,
        effectA: Effect<A>,
        effectB: Effect<B>
    ): Effect<C> {
        return bind(effectA, (a) =>
            bind(effectB, (b) =>
                pure(f(a, b))
            )
        );
    }

    // All - runs multiple effects in parallel and collects results
    export function all<T>(effects: Effect<T>[]): Effect<T[]> {
        return new Effect(async () => {
            return await Promise.all(effects.map(e => e.execute()));
        });
    }

    // Race - returns the first effect to complete
    export function race<T>(effects: Effect<T>[]): Effect<T> {
        return new Effect(async () => {
            return await Promise.race(effects.map(e => e.execute()));
        });
    }


    // From async function
    export function fromAsync<T>(fn: () => Promise<T>): Effect<T> {
        return new Effect(fn);
    }

    // From sync function
    export function fromSync<T>(fn: () => T): Effect<T> {
        return new Effect(async () => fn());
    }
}
