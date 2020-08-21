const path = require('path')

const got = require('got')
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

    /**
     * show debug link only in CI
     */
    if (!process.env.CI) {
        const req = got('http://localhost:9223/json')
        const pages = await req.json().catch((err) => err)
        if (pages && pages.length && process.env.SAUCE_DEVTOOLS_PORT) {
            process.stdout.write(`Watch test: https://chrome-devtools-frontend.appspot.com/serve_file/@ec99b9f060de3f065f466ccd2b2bfbf17376b61e/devtools_app.html?ws=localhost:${process.env.SAUCE_DEVTOOLS_PORT}/devtools/page/${pages[0].id}&remoteFrontend=true\n\n`);
        }
    }
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
