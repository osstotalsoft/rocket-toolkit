// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export async function timeout<TArgs extends any[]>(prom: Promise<unknown>, time?: number, ...exception: TArgs) {
  let timer
  try {
    return await Promise.race([prom, new Promise((_r, rej) => (timer = setTimeout(rej, time, ...exception)))])
  } finally {
    return clearTimeout(timer)
  }
}
