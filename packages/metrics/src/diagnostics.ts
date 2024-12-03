import Koa from 'koa'
import { getHeapSnapshot } from 'v8' // sau import v8 from 'node:v8'
import numeral from 'numeral'
import { mapObjIndexed } from 'ramda'
import { Logger } from 'pino'
import { RouteHandler } from './types'
import { Server } from 'http'

const routerCfg: Record<string, RouteHandler> = {
  '/': index,
  '/heap-dump': heapDump,
  '/memory-usage': memoryUsage
}

const app = new Koa()
app.use(async (ctx: Koa.Context, next: () => Promise<void>) => {
  const routeHandler = routerCfg[ctx.request.path.toLowerCase()]
  if (routeHandler) {
    routeHandler(ctx)
  } else {
    await next()
  }
})

function heapDump(ctx: Koa.Context) {
  ctx.body = getHeapSnapshot()
  const fileName = `${Date.now()}.heapsnapshot`
  ctx.attachment(fileName)
}

function memoryUsage(ctx: Koa.Context) {
  const res = mapObjIndexed(num => numeral(num).format('0.0 b'), process.memoryUsage())
  ctx.body = res
}

function index(ctx: Koa.Context) {
  const bodyContent = Object.keys(routerCfg)
    .map(path => `<a href="${path}">${path}</a>`)
    .join('</br>')
  const html = `<html><body>${bodyContent}</body></html>`

  ctx.body = html
}

let server: Server | null = null
const port = process.env.DIAGNOSTICS_PORT || 4001

export function startDiagnostics(logger: Logger): void {
  server = app.listen(port)
  logger.info(`🚀 Diagnostics server ready at http://localhost:${port}/`)
}

export function stopDiagnostics(logger: Logger): void {
  if (server) {
    server.close(() => {
      logger.info('Diagnostics server stopped.')
    })
    server = null
  } else {
    logger.warn('Diagnostics server is not running.')
  }
}