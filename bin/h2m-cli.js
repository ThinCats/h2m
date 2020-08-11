#!/usr/bin/env node

var h2m = require('../index')
var program = require('commander')
var request = require('request')
var path = require('path')
var fs = require('fs')
var pkg = require('../package.json')
var clipboardy = require('clipboardy')

class CliBuilder {
  constructor() {
    this.option = {}
    this.input = null
  }

  loadHtmlFromUri(uri) {
    this.input = () =>
      new Promise((resolve, reject) => {
        request(uri, function (error, response, body) {
          if (error) {
            reject(error)
          } else if (response.statusCode == 200) {
            resolve(body)
          } else {
            reject(new Error("can't get html from " + uri))
          }
        })
      })
    return this
  }

  loadHtmlFromFile(file) {
    if (!path.isAbsolute(file)) {
      file = path.join(process.cwd(), file)
    }
    this.input = () =>
      new Promise((resolve, reject) => {
        fs.readFile(
          file,
          {
            encoding: "utf8",
          },
          (err, data) => {
            err && reject(err)
            resolve(data)
          }
        )
      })
    return this
  }

  loadHtmlFromClipboard() {
    this.input = () => clipboardy.read()
    return this
  }

  setOption(option) {
    this.option = option
    return this
  }

  run() {
    this.input().then((html) => {
      console.log(h2m(html, this.option))
    }).catch(err => {
      console.error(err)
    })
  }
}

program
  .version(pkg.version)
  .option('-f, --file <file>', 'HTML file path or an url adress', '')
  .option('-c, --clipboard', 'read HTML from clipboard')
  .option('-m, --mode <mode>', 'specify converter mode: common/extra', 'common')
  .action(function(env) {
    const cli = new CliBuilder()
    if (env.mode) {
      cli.setOption({
        'converter': env.mode === 'extra' ? 'MarkdownExtra' : 'CommonMark'
      })
    }
    if (env.clipboard) {
      cli.loadHtmlFromClipboard()
    }
    if (env.file) {
      cli.loadHtmlFromFile(env.file)
    }
    if (/^(http|https):\/\//.test(env.file)) {
      cli.loadHtmlFromUri(env.file)
    }
    if (!cli.input) {
      console.log('use h2m -h to learn usage')
      return
    }
    cli.run()
  })

program.parse(process.argv)
