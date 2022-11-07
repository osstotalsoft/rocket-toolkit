import sut from '../src/serDes'

describe('serialize and deserialize', () => {
  test('deSerialize . serialize = identity', () => {
    //arrange
    const msg = {
      payload: {
        somethingId: 'some-id',
        somethingValue: 'some-value'
      },
      headers: {
        'nbb-correlationId': 'some-correlation-id',
        'nbb-source': 'some-source'
      }
    }

    //act
    const result = sut.deSerialize(sut.serialize(msg))

    //assert
    expect(result).toEqual(msg)
  })

  test('deSerialize should camelize `Payload` only', () => {
    //arrange
    const msg = JSON.stringify({
      Payload: {
        SomethingId: 'some-id',
        SomethingValue: 'some-value'
      },
      Headers: {
        'nbb-correlationId': 'some-correlation-id',
        'nbb-source': 'some-source'
      }
    })

    //act
    const deserialized = sut.deSerialize(msg)

    //assert
    expect(deserialized).toEqual({
      payload: {
        somethingId: 'some-id',
        somethingValue: 'some-value'
      },
      headers: {
        'nbb-correlationId': 'some-correlation-id',
        'nbb-source': 'some-source'
      }
    })
  })

  test('deSerialize will not camelize `payload`', () => {
    //arrange
    const msg = JSON.stringify({
      payload: {
        SomethingId: 'some-id',
        SomethingValue: 'some-value'
      },
      Headers: {
        'nbb-correlationId': 'some-correlation-id',
        'nbb-source': 'some-source'
      }
    })

    //act
    const deserialized = sut.deSerialize(msg)

    //assert
    expect(deserialized).toEqual({
      payload: {
        SomethingId: 'some-id',
        SomethingValue: 'some-value'
      },
      headers: {
        'nbb-correlationId': 'some-correlation-id',
        'nbb-source': 'some-source'
      }
    })
  })

  test('deSerialize expects Envelope data', () => {
    // arrange
    const test = { test: 'test', deepTest: { test: 'test' } }
    const data = JSON.stringify(test)

    // act
    const result = sut.deSerialize(data)

    // assert
    expect(result).toMatchObject({})
  })

  test('getInfo returns standard application/json info header', () => {
    // arrange
    const expected = { contentType: 'application/json;charset=utf-8' }

    // act
    const result = sut.getInfo()

    // assert
    expect(result).toMatchObject(expected)
  })

  test('deSerializePayload camelizes props', () => {
    // arrange
    const test = { Test: 'test', DeepTest: { Test: 'test' } }
    const data = JSON.stringify(test)
    const expected = { test: 'test', deepTest: { test: 'test' } }

    // act
    const result = sut.deSerializePayload(data)

    // assert
    expect(result).toMatchObject(expected)
  })
})
