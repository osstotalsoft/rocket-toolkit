// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

export const connect = jest.fn().mockResolvedValue({
    close: jest.fn().mockResolvedValue(undefined),
    closed: jest.fn().mockReturnValue(new Promise(() => { })),
    isClosed: jest.fn().mockReturnValue(false)
})