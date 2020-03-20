const puppeteer = require('puppeteer-core')
const debug = require('debug')
const shell = require('shelljs')

const { CHROME_DEFAULT_PATH } = require('./constants')
const { log } = require('./utils')
debug.log = log

jest.setTimeout(60000)

beforeAll(async () => {
    console.log('Start video capturing')
    shell.exec('start-video')

    console.log('Start Puppeteer')
    global.browser = await puppeteer.launch({
        headless: false,
        args: ['--start-fullscreen'],
        executablePath: process.env.CHROME_BINARY_PATH || CHROME_DEFAULT_PATH
    })
})
