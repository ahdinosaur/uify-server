# uify-server

browserify development and production server

```shell
npm install --save uify-server
```

part of [`uify@1`](https://github.com/ahdinosaur/uify)

## example

```js
const { createServer } = require('http')
const Send = require('http-sender')()

const uifyServer = UifyServer({
  entry: join(__dirname, 'browser.js'),
  debug: process.env.NODE_ENV === 'development'
  optimize: process.env.NODE_ENV === 'production'
})

const server = createServer((req, res) => {
  uifyServer(req, res, {}, Send(req, res))
}).listen(8080)
```

see [./example](./example) for a complete example with pretty logs.

to run the example:

```js
# in development (debug, watch, and live enabled)
NODE_ENV=development npm start

# in production (optimize and cache enabled)
NODE_ENV=production npm start
```

## usage

### `UifyServer = require('uify-server')`

### `uifyServer = UifyServer(options)`

`UifyServer` receives an `options` object:

- `entry`: path to the entry source file for browserify bundler (default: "./")

- `debug`: enable source maps (default: true)
- `watch`: enable bundle watcher (watchify) (default: true)
- `live`: enable live reload for development (default: true)
- `livePort`: a custom port to bind LiveReload server
- `optimize`: optimize bundle for production (default: false)
- `cache`: bundle once and cache for production (default: false)
- `pushState`: support `history.pushState` by returning index.html on any requests that accept html (default: true)
- `bundler`: a [`browserify`](https://github.com/substack/node-browserify)-compatible bundler constructor (default: `require('browserify')`)
- `bundlerArgs`: an object of arguments to pass to the bundler

- `script`: the absolute path to serve the JavaScript bundle (default: "/bundle.js")
- `css`: optional Cascading StyleSheet in default index.html
- `title`: optional title for the default index.html
- `lang`: optional language for the default index.html (default: "en")
- `head`: optional string to insert into the default index.html between <head> and </head> (default: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
- `body`: optional string to insert into the default index.html between <body> and </body>
- `favicon`: optional favicon url for default index.html page

- `cwd`: current working directory to base relative paths on
- `log`: a [`pino`](https://github.com/pinojs/pino)-compatible logger instance

`UifyServer` returns a function of shape `(req, res, context, next) => { next(err, value) }`

### `uifyServer(req, res, context, next)`

## license

The Apache License

Copyright &copy; 2017 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
