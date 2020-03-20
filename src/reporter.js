const path = require('path')

const { remote } = require('webdriverio')
const SauceLabs = require('saucelabs').default

const api = new SauceLabs({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us-west-1'
})

module.exports = class TestrunnerReporter {
    constructor () {
        console.log('Create job shell')
        this.sessionId = (async () => {
            const session = await remote({
                user: process.env.SAUCE_USERNAME,
                key: process.env.SAUCE_ACCESS_KEY,
                capabilities: {
                    browserName: 'Chrome',
                    platformName: 'MacOS 10.15',
                    browserVersion: '77',
                    'sauce:options': {
                        name: 'Puppeteer Test...'
                    }
                }
            })
            console.log(`Created job shell with session id ${session.sessionId}`)
            await session.deleteSession()
            return session.sessionId
        })()
    }

    async onRunComplete (test, { testResults, numFailedTests }) {
        const filename = path.basename(testResults[0].testFilePath)
        const hasPassed = numFailedTests === 0

        const sessionId = await this.sessionId

        /**
         * wait a bit to ensure we don't upload before the job has finished
         */
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const logFilePath = path.join(process.cwd(), '/log.json')
        await Promise.all([
            api.uploadJobAssets(
                sessionId,
                [
                    logFilePath,
                    '/home/seluser/videos/video.mp4'
                ]
            ).then(
                () => console.log('upload successful'),
                (e) => console.log('upload failed:', e.stack)
            ),
            api.updateJob(process.env.SAUCE_USERNAME, sessionId, {
                name: filename,
                passed: hasPassed
            })
        ])

        console.log('Done!')
    }
}
