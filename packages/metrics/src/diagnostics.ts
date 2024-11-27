import  Koa from 'koa'
import v8 from 'v8' // sau import v8 from 'node:v8'
import numeral from 'numeral'
import R from 'ramda'
import {Logger} from 'pino'
import { RouteHandler } from './types'

const routerCfg: Record<string, RouteHandler> = {
  '/': index,
  '/heap-dump': heapDump,
  '/memory-usage': memoryUsage
}

const app = new Koa()
app.use(async (ctx:Koa.Context, next:() => Promise<void>) => {
  const routeHandler = routerCfg[ctx.request.path.toLowerCase()]
  if (routeHandler) {
    routeHandler(ctx)
  } else {
    await next()
  }
})

function heapDump(ctx:Koa.Context) {
  ctx.body = v8.getHeapSnapshot()
  const fileName = `${Date.now()}.heapsnapshot`
  ctx.attachment(fileName)
}

function memoryUsage(ctx:Koa.Context) {
  const res = R.mapObjIndexed(num => numeral(num).format('0.0 b'), process.memoryUsage())
  ctx.body = res
}

function index(ctx:Koa.Context) {
  const bodyContent = Object.keys(routerCfg)
    .map(path => `<a href="${path}">${path}</a>`)
    .join('</br>')
  const html = `<html><body>${bodyContent}</body></html>`

  ctx.body = html
}

const port = process.env.DIAGNOSTICS_PORT || 4001


function startServer(logger: Logger) : void  {
  app.listen(port)
  logger.info(`🚀 Diagnostics server ready at http://localhost:${port}/`)
}

export {startServer}