// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.
import { setTimeout } from "timers/promises"

export function batchQueueProcessor(batchHandler: (logs: any[]) => Promise<void>, { interval = 20, batchLimit = 10 } = {}) {
    const queue: any[] = []
    const ac = new AbortController()

    function abort() {
        try {
            ac.abort()
        } catch (err) {
            console.log(err)
        }
    }

    function enqueue(obj: any) {
        queue.push(obj)
    }

    async function flush() {
        const crtQueue = queue
        //queue = []

        for (let batch; (batch = crtQueue.splice(0, batchLimit)), batch.length > 0;) {
            await batchHandler(batch)
        }
    }

    async function wait() {
        try {
            await setTimeout(interval, undefined, { signal: ac.signal })
        } catch (err: any) {
            if (err.name === 'AbortError') {
                return false
            }
            throw err
        }

        return true
    }

    async function run() {
        while (await wait()) {
            await flush()
        }
    }

    // Fire and forget
    run()

    return {
        enqueue,
        flush,
        abort
    }
}