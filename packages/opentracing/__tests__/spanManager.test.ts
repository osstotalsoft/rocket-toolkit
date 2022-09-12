import { FORMAT_HTTP_HEADERS, FORMAT_TEXT_MAP, Span, Tracer } from 'opentracing'
import { getExternalSpan, spanManager } from '../src'

describe('correlation tests:', () => {
  it('passes active span async flow', async () => {
    //arrange
    const rootSpan = new Span()
    let activeSpan
    async function inner() {
      activeSpan = spanManager.getActiveSpan()
    }

    //act
    spanManager.useSpanManager(rootSpan, async () => {
      await inner()
    })

    //assert
    expect(activeSpan).toBe(rootSpan)
  })

  it('returns null if active span is not set', async () => {
    //arrange
    let activeSpan
    async function inner() {
      activeSpan = spanManager.getActiveSpan()
    }

    //act
    await inner()

    //assert
    expect(activeSpan).toBe(null)
  })

  it('returns current span in with scope', async () => {
    //arrange
    const rootSpan = new Span()
    const innerSpan = new Span()
    let activeSpan
    async function inner() {
      spanManager.beginScope(innerSpan)
      activeSpan = spanManager.getActiveSpan()
      spanManager.endScope()
    }
    //act


    spanManager.useSpanManager(rootSpan, async () => {
      await inner()
    })

    //assert
    expect(activeSpan).toBe(innerSpan)
  })

  // it('extracts external span from headers', async () => {
  //   //arrange
  //   const headers = {
  //     'trace-context': '1:1:1:1'
  //   }
  //   const tracer = new Tracer('tracer',  new InMemoryReporter(), new ConstSampler(false), {})
  //   const span = tracer.startSpan('1111')
  //   tracer.inject(span, FORMAT_HTTP_HEADERS, headers)

  //   //act
  //   const span2 = getExternalSpan(new Tracer(), {headers})

  //   //assert
  //   expect(span2?.toTraceId()).toBe('1:1:1:1')
  // })
})
