const fs = require('fs')
const path = require('path')

const logger = require('@wdio/logger').default
const SauceLabs = require('saucelabs').default
const { remote } = require('webdriverio')

const { exec } = require('./utils')
const { LOG_FILES } = require('./constants')

const log = logger('reporter')

const api = new SauceLabs({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us-west-1'
})

module.exports = class TestrunnerReporter {
    constructor () {
        log.info('Create job shell')
        this.sessionId = (async () => {
            const session = await remote({
                user: process.env.SAUCE_USERNAME,
                key: process.env.SAUCE_ACCESS_KEY,
                logLevel: 'error',
                capabilities: {
                    browserName: 'Chrome',
                    platformName: 'MacOS 10.15',
                    browserVersion: '77',
                    'sauce:options': {
                        name: 'Puppeteer Test...'
                    }
                }
            })
            log.info(`Created job shell with session id ${session.sessionId}`)
            await session.deleteSession()
            return session.sessionId
        })()
    }

    async onRunStart () {
        log.info('Start video capturing')
        await exec('start-video')
    }

    async onRunComplete (test, { testResults, numFailedTests }) {
        const filename = path.basename(testResults[0].testFilePath)
        const hasPassed = numFailedTests === 0

        const sessionId = await this.sessionId

        /**
         * wait a bit to ensure we don't upload before the job has finished
         */
        await new Promise((resolve) => setTimeout(resolve, 1000))

        log.info('Stop video capturing')
        await exec('stop-video')

        const logFilePath = path.join(process.cwd(), '/log.json')
        const containterLogFiles = LOG_FILES.filter(
            (path) => fs.existsSync(path))

        await Promise.all([
            api.uploadJobAssets(
                sessionId,
                [
                    logFilePath,
                    ...containterLogFiles
                ]
            ).then(
                () => log.info('upload successful'),
                (e) => log.error('upload failed:', e.stack)
            ),
            api.updateJob(process.env.SAUCE_USERNAME, sessionId, {
                name: filename,
                passed: hasPassed
            })
        ])

        log.info('Finished testrun!')
        console.log(`\nOpen job details page: https://app.saucelabs.com/tests/${sessionId}\n`)
    }
}
