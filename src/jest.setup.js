const path = require('path')

const puppeteer = require('puppeteer-core')
const debug = require(
    path.join(
        path.dirname(require.resolve('puppeteer-core')),
        'node_modules',
        'debug'
    )
)
const { SUITE_NAME } = require("./constants");
const { getRunnerConfig } = require("./utils");
const { DEFAULT_JEST_TIMEOUT, CHROME_ARGS, FIREFOX_ARGS } = require('./constants');
const { getSuite } = require('sauce-testrunner-utils');
const { logHelper } = require('./utils');
debug.log = logHelper

const testTimeout = (parseInt(process.env.TEST_TIMEOUT) || DEFAULT_JEST_TIMEOUT)
process.stdout.write(`Setting test timeout to ${testTimeout}sec\n\n`);
jest.setTimeout(testTimeout * 1000)

beforeAll(async () => {
    const runCfg = getRunnerConfig();
    const suite = getSuite(runCfg, SUITE_NAME);

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

    switch (browser.toLowerCase()) {
        case 'chrome':
            opts = Object.assign(opts, chromeOpts);
            break;
        case 'firefox':
            opts = Object.assign(opts, firefoxOpts);
            break;
        default:
            throw new Error(`Unsupported browser: ${browser}`);
    }

    return opts
}

const monkeyPatchedTest = (origFn) => (testName, testFn) => {
    function patchedFn(...args) {
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
