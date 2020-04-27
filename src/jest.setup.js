const got = require('got')
const puppeteer = require('puppeteer-core')
const debug = require('debug')

const { CHROME_DEFAULT_PATH, JEST_TIMEOUT, CHROME_ARGS } = require('./constants')
const { logHelper } = require('./utils')
debug.log = logHelper

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
    global.browser = await puppeteer.launch({
        headless: !Boolean(process.env.DISPLAY),
        args: CHROME_ARGS,
        executablePath: process.env.CHROME_BINARY_PATH || CHROME_DEFAULT_PATH
    }).catch((err) => {
        console.error(`Couldn't start Puppeteer: ${err.message}`)
    })

    const req = got('http://localhost:9223/json')
    const pages = await req.json()
    console.log(`Watch test: https://chrome-devtools-frontend.appspot.com/serve_file/@44f4233f08910d83b146130c1938256a2e05b136/inspector.html?ws=localhost:9222/devtools/page/${pages[0].id}&remoteFrontend=true`);
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
