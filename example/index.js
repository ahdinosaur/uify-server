const { join } = require('path')
const { createServer } = require('http')
const Pretty = require('pino-colada')
const Log = require('pino')
const Logger = require('pino-http')
const Sender = require('http-sender')

const Uify = require('../')

const pretty = Pretty()
pretty.pipe(process.stdout)
const log = Log({
  name: 'uify-server',
  level: 'info'
}, pretty)
const logger = Logger({ logger: log })
const Send = Sender({ logger })

const uify = Uify({
  entry: join(__dirname, 'browser.js'),
  debug: process.env.NODE_ENV === 'development',
  optimize: process.env.NODE_ENV === 'production',
  log
})

const server = createServer((req, res) => {
  logger(req, res)
  uify(req, res, {}, Send(req, res))
})

const host = 'localhost'
const port = 8080
server.listen({ host, port }, () => {
  const address = 'http://' + host + ':' + port
  log.info('server started for example on ' + address)
})
