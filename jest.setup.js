const fs = require('fs')
const puppeteer = require('puppeteer-core')
const debug = require('debug')
const ansiRegex = require('ansi-regex')
const SauceLabs = require('saucelabs').default

global.logs = []
global.isDone = false

jest.setTimeout(60000)

global.api = new SauceLabs({
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  region: 'staging',
  tld: 'net'
})

beforeAll(async () => {
  console.log('Create job shell')
  const job = await global.api.createJob({
    name: 'A Puppeteer Test',
    capabilities: {
      browserName: 'Chrome',
      platformName: 'MacOS 10.15',
      browserVersion: '77'
    }
  })
  global.sessionId = job.id
  console.log(`Created job shell with session id ${job.id}`)

  console.log('Start Puppeteer')
  global.browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true
  })
  console.log('Puppeteer started')

  let lastCommand = Date.now()
  debug.log = (...args) => {
    const sendString = 'SEND ► '
    const receiveString = '◀ RECV'

    if (args[0].includes(receiveString)) {
      const line = args[0].slice(args[0].indexOf('{'))

      try {
        const response = JSON.parse(line)
        if (!response.id) {
          return
        }

        const log = global.logs.find(
          (log) => parseInt(log.id, 10) === parseInt(response.id))

        if (log) {
          log.result = response
        }
      } catch (e) {
        console.log(e)
      }

      return
    }

    if (!args[0].includes(sendString)) {
      return
    }

    const line = args[0].slice(args[0].indexOf(sendString) + sendString.length)
    const command = JSON.parse(line)
    const duration = (Date.now() - lastCommand) / 1000
    global.logs.push({
      id: command.id,
      screenshot: 0,
      between_commands: duration,
      start_time: Date.now() / 1000,
      suggestion_values: [],
      request: command.params,
      HTTPStatus: 200,
      result: "",
      suggestion: null,
      duration,
      path: command.method,
      in_video_timeline: 0,
      method: "SOCKET",
      statusCode: 0
    })
    lastCommand = Date.now()
  }
})
