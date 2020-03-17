const puppeteer = require('puppeteer-core')
const debug = require('debug')

const  { log } = require('./utils')
debug.log = log

jest.setTimeout(60000)

beforeAll(async () => {
    console.log('Start Puppeteer')
    global.browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // '/usr/bin/google-chrome-stable',
        headless: true
    })
})
