const path = require('path')

const puppeteer = require('puppeteer-core')
const debug = require(
    path.join(
        path.dirname(require.resolve('puppeteer-core')),
        'node_modules',
        'debug'
    )
)

const { CHROME_DEFAULT_PATH, DEFAULT_JEST_TIMEOUT, CHROME_ARGS, FIREFOX_ARGS} = require('./constants')
const {getSuite, loadRunConfig} = require('sauce-testrunner-utils');
const { logHelper } = require('./utils')
debug.log = logHelper

const testTimeout = (parseInt(process.env.TEST_TIMEOUT) || DEFAULT_JEST_TIMEOUT)
process.stdout.write(`Setting test timeout to ${testTimeout}sec\n\n`);
jest.setTimeout(testTimeout * 1000)

beforeAll(async () => {
    const runCfgPath = process.env['SAUCE_RUNNER_CONFIG']
    const suiteName = process.env['SAUCE_SUITE']
    const runCfg = loadRunConfig(runCfgPath);
    const suite = getSuite(runCfg, suiteName);

    const opts = getPuppeteerLaunchOptions(suite.browser)

    global.browser = await puppeteer.launch(opts);
})

function getPuppeteerLaunchOptions(browser) {
    const chromeOpts = {
        args: CHROME_ARGS,
        product: "chrome",
        executablePath: process.env.CHROME_BINARY_PATH
    }

    const firefoxOpts = {
        args: FIREFOX_ARGS,
        product: "firefox",
        executablePath: process.env.FIREFOX_BINARY_PATH
    }

    let opts = {
        headless: !Boolean(process.env.DISPLAY),
    }

    if (browser === "chrome") {
        opts = Object.assign(opts, chromeOpts)
    }

    if (browser === "firefox") {
        opts = Object.assign(opts, firefoxOpts)
    }

    return opts
}

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
