var PluginError = require('plugin-error')
var chalk = require('chalk')
var load = require('load-resources')
var path = require('path')
var log = require('fancy-log')

function createError (url, message, error) {
  if (error) {
    if (error.name === 'CssSyntaxError') {
      message += error.message
    } else {
      message += error.stack
    }
  }
  var err = new PluginError('integration', {
    showStack: false,
    message: message
  })
  err.url = url
  return err
}

var sites = [
  ['GitHub', 'https://github.com/'],
  ['Twitter', 'https://twitter.com/'],
  ['Bootstrap', 'github:twbs/bootstrap:dist/css/bootstrap.css'],
  ['Habrahabr', 'http://habrahabr.ru/']
]

module.exports = function (done, extra, callback) {
  if (!callback) {
    callback = extra
    extra = undefined
  }

  var lastDomain = false
  var caseIndex = -1

  var cases = sites
  if (extra) cases = cases.concat(extra)

  var urls = cases.map(function (i) {
    return i[1]
  })

  var finish = false
  load(urls, '.css', function (css, url, last) {
    if (finish) return

    var result
    try {
      result = callback(css).css
    } catch (e) {
      finish = true
      done(createError(url, 'Parsing error: ', e))
      return
    }

    if (result !== css) {
      finish = true
      done(createError(url, 'Output is not equal input'))
      return
    }

    var domain = url.match(/https?:\/\/[^/]+/)[0]
    if (domain !== lastDomain) {
      lastDomain = domain
      caseIndex += 1
      log('Test ' + cases[caseIndex][0] + ' styles')
    }
    log('     ' + chalk.green(path.basename(url)))

    if (last) done()
  })
}
