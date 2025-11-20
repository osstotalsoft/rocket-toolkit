/**
 * Represents the result of an operation that can either succeed with a value or fail with an error.
 */
export type Result<T, E = string> =
    | { kind: 'Ok'; value: T }
    | { kind: 'Err'; error: E };

export namespace Result {

    // Constructors
    export function Ok<T, E = string>(value: T): Result<T, E> {
        return { kind: 'Ok', value };
    }

    export function Err<T, E = string>(error: E): Result<T, E> {
        return { kind: 'Err', error };
    }

    // Type guards
    export function isOk<T, E>(result: Result<T, E>): result is { kind: 'Ok'; value: T } {
        return result.kind === 'Ok';
    }

    export function isErr<T, E>(result: Result<T, E>): result is { kind: 'Err'; error: E } {
        return result.kind === 'Err';
    }

    // Transformations
    export function map<T, U, E>(result: Result<T, E>, f: (value: T) => U): Result<U, E> {
        return result.kind === 'Ok'
            ? Ok(f(result.value))
            : result;
    }

    export function mapErr<T, E, F>(result: Result<T, E>, f: (error: E) => F): Result<T, F> {
        return result.kind === 'Err'
            ? Err(f(result.error))
            : result;
    }

    export function bind<T, U, E>(result: Result<T, E>, f: (value: T) => Result<U, E>): Result<U, E> {
        return result.kind === 'Ok' ? f(result.value) : result;
    }

    export function flatMap<T, U, E>(result: Result<T, E>, f: (value: T) => Result<U, E>): Result<U, E> {
        return bind(result, f);
    }

    // Combinators
    export function match<T, E, R>(
        result: Result<T, E>,
        handlers: {
            Ok: (value: T) => R;
            Err: (error: E) => R;
        }
    ): R {
        return result.kind === 'Ok'
            ? handlers.Ok(result.value)
            : handlers.Err(result.error);
    }


    // Conversions
    export function toOption<T, E>(result: Result<T, E>): T | null {
        return result.kind === 'Ok' ? result.value : null;
    }

    export function fromOption<T, E>(option: T | null | undefined, error: E): Result<T, E> {
        return option != null ? Ok(option) : Err(error);
    }

    export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<T, E> {
        return fromOption(value, error);
    }

}

// Re-export for convenience
export const { Ok, Err } = Result;