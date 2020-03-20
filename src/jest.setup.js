const puppeteer = require('puppeteer-core')
const debug = require('debug')

const { CHROME_DEFAULT_PATH } = require('./constants')
const { logHelper } = require('./utils')
debug.log = logHelper

jest.setTimeout(60000)

beforeAll(async () => {
    global.browser = await puppeteer.launch({
        headless: false,
        args: ['--start-fullscreen'],
        executablePath: process.env.CHROME_BINARY_PATH || CHROME_DEFAULT_PATH
    }).catch((err) => {
        console.error(`Couldn't start Puppeteer: ${err.message}`)
    })
})
