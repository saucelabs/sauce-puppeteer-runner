const puppeteer = require('puppeteer-core')
const debug = require('debug')

const { CHROME_DEFAULT_PATH, JEST_TIMEOUT } = require('./constants')
const { logHelper } = require('./utils')
debug.log = logHelper

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
    global.browser = await puppeteer.launch({
        headless: !Boolean(process.env.DISPLAY),
        args: ['--start-fullscreen'],
        executablePath: process.env.CHROME_BINARY_PATH || CHROME_DEFAULT_PATH
    }).catch((err) => {
        console.error(`Couldn't start Puppeteer: ${err.message}`)
    })
})

const monkeyPatchedTest = (origFn) => (testName, testFn) => {
    function patchedFn (...args) {
        global.logs.push({
            status: 'info',
            message: testName,
            screenshot: null
        })
        return testFn.call(this, ...args)
    }
    return origFn(testName, patchedFn)
}

global.it = monkeyPatchedTest(global.it)
global.test = monkeyPatchedTest(global.test)
