const { assign } = Object
const Browserify = require('browserify')
const bundleWatcher = require('watchify')
const bundleWatcherCache = require('first-cache')
const bundleMinifier = require('uglifyify')
const bundleCollapser = require('bundle-collapser/plugin')
const BundleMiddleware = require('watchify-request')
const envify = require('envify')
const LiveReload = require('tiny-lr')
const Accept = require('accepts')
const injectLiveReloadScript = require('inject-lr-script')
const createIndexHtml = require('create-html')
const pump = require('pump')
const BufferList = require('bl')
const typeofIs = require('typeof-is')
const httpCompose = require('http-compose')

module.exports = Server

function Server (options) {
  if (typeofIs.string(options)) {
    options = { entry: options }
  }

  const {
    // required entry opt
    entry,
    // server mode opts
    debug = false,
    watch = debug,
    live = watch,
    livePort,
    optimize = false,
    cache = optimize,
    pushState = true,
    // url opts
    host = 'localhost',
    // html opts
    script = '/bundle.js',
    css,
    title,
    lang,
    head = `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    body,
    favicon,
    // logger opts
    log,
    // bundler opts
    bundler: Bundler = Browserify,
    bundlerArgs = {},
    // default opts
    cwd = process.cwd()
  } = options

  var bundlerOptions = assign(
    {
      entries: [entry],
      debug,
      basedir: cwd,
      // config for bundle watcher (watchify)
      cache: {},
      packageCache: {}
    },
    bundlerArgs
  )
  var bundler = Bundler(bundlerOptions)

  if (watch) {
    // add bundle watcher plugin (watchify)
    bundler
      .plugin(bundleWatcherCache)
      .plugin(bundleWatcher)
    if (log) {
      bundler.on('bytes', bytes => {
        log.info(`updated bundle size: ${bytes} bytes`)
      })
    }
  }

  bundler.transform(envify, { global: true })

  if (optimize) {
    bundler.transform(bundleMinifier, { global: true })
    bundler.plugin(bundleCollapser)
    // TODO exorcist
  }

  var stack = []

  if (live) {
    const liveReloadServer = LiveReload()
    liveReloadServer.listen(livePort)
    if (watch) {
      bundler.on('update', () => {
        LiveReload.changed(script)
      })
    }
    stack.push(toStack(injectLiveReloadScript({
      port: livePort, host
    })))
    // TODO watch files
    // live option can be string or array of strings of files to watch
    // if true, default to all images and css files
    // using `pull-watch` or `watch-lr`
  }

  const bundlerMiddleware = cache
    ? CachedBundleMiddleware(bundler, log)
    : toStack(BundleMiddleware(bundler))

  stack.push((req, res, context, next) => {
    if (req.url === script) {
      return bundlerMiddleware(req, res, context, next)
    }
    next()
  })

  const htmlOptions = { title, script, css, lang, head, body, favicon }

  if (pushState) {
    stack.push((req, res, context, next) => {
      const accept = Accept(req)
      switch (accept.type(['html'])) {
        case 'html':
          return sendHtml(res, next)
      }
      next()
    })
  } else {
    stack.push((req, res, context, next) => {
      if (req.url === '/') return sendHtml(res, next)
      next()
    })
  }

  return httpCompose(stack)

  function sendHtml (res, next) {
    res.setHeader('content-type', 'text/html')
    next(null, createIndexHtml(htmlOptions))
  }
}

// TODO publish as `http-cache-one`
function CachedBundleMiddleware (bundler, log) {
  var bundleReady = false
  var bundleQueue = []
  var error
  const bundleCache = BufferList()

  pump(bundler.bundle(onReady), bundleCache, onError)

  function onReady (err) {
    error = err
    if (log && !error) {
      log.info(`bundle size: ${bundleCache.length} bytes`)
    }
    bundleReady = true
    bundleQueue.forEach(queueItem => queueItem())
    bundleQueue = null
  }

  function onError (err) {
    error = err
  }

  return (req, res, context, next) => {
    if (bundleReady) sendBundle()
    else bundleQueue.push(sendBundle)

    function sendBundle () {
      if (error) return next(error)
      res.setHeader('content-type', 'application/javascript')
      next(null, bundleCache.duplicate())
    }
  }
}

function toStack (handler) {
  return (req, res, context, next) => {
    handler(req, res, next)
  }
}
