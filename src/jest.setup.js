const path = require('path')

const puppeteer = require('puppeteer-core')
const debug = require(
    path.join(
        path.dirname(require.resolve('puppeteer-core')),
        'node_modules',
        'debug'
    )
)

const { CHROME_DEFAULT_PATH, DEFAULT_JEST_TIMEOUT, CHROME_ARGS } = require('./constants')
const { logHelper } = require('./utils')
debug.log = logHelper

const testTimeout = (parseInt(process.env.TEST_TIMEOUT) || DEFAULT_JEST_TIMEOUT)
process.stdout.write(`Setting test timeout to ${testTimeout}sec\n\n`);
jest.setTimeout(testTimeout * 1000)

beforeAll(async () => {
    global.browser = await puppeteer.launch({
        headless: !Boolean(process.env.DISPLAY),
        args: CHROME_ARGS,
        executablePath: process.env.CHROME_BINARY_PATH || CHROME_DEFAULT_PATH
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
