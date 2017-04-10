const test = require('tape')

const uifyServer = require('../')

test('uify-server', function (t) {
  t.ok(uifyServer, 'module is require-able')
  t.end()
})
