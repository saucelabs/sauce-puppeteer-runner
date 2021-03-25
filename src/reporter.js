const fs = require('fs')
const path = require('path')
const {getSuite, loadRunConfig} = require("sauce-testrunner-utils");
const {HOME_DIR} = require("./constants");

const logger = require('@wdio/logger').default
const SauceLabs = require('saucelabs').default

const {exec} = require('./utils')
const {LOG_FILES} = require('./constants')

const log = logger('reporter')
const {updateExportedValue} = require('sauce-testrunner-utils').saucectl

// Path has to match the value of the Dockerfile label com.saucelabs.job-info !
const SAUCECTL_OUTPUT_FILE = '/tmp/output.json';

const region = process.env.SAUCE_REGION || 'us-west-1'
const tld = region === 'staging' ? 'net' : 'com'

const api = new SauceLabs({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region,
    tld
})

// SAUCE_JOB_NAME is only available for saucectl >= 0.16, hence the fallback
const jobName = process.env.SAUCE_JOB_NAME || `DevX Puppeteer Test Run - ${(new Date()).getTime()}`;
let build = process.env.SAUCE_BUILD_NAME
let startTime, endTime;

/**
 * replace placeholders (e.g. $BUILD_ID) with environment values
 */
const buildMatches = (build || '').match(/\$[a-zA-Z0-9_-]+/g) || []
for (const match of buildMatches) {
    const replacement = process.env[match.slice(1)]
    build = build.replace(match, replacement || '')
}

const runCfgPath = process.env['SAUCE_RUNNER_CONFIG']
const suiteName = process.env['SAUCE_SUITE']
const runCfg = loadRunConfig(runCfgPath);
const suite = getSuite(runCfg, suiteName);

// NOTE: this function is not available currently.
// It will be ready once data store API actually works.
// Keep these pieces of code for future integration.
const createJobShell = async (tags, api) => {
    const body = {
        name: jobName,
        acl: [
            {
                type: 'username',
                value: process.env.SAUCE_USERNAME
            }
        ],
        //'start_time: startTime,
        //'end_time: endTime,
        source: 'vdc', // will use devx
        platform: 'webdriver', // will use puppeteer
        status: 'complete',
        live: false,
        metadata: {},
        tags: tags,
        attributes: {
            container: false,
            browser: 'googlechrome',
            browser_version: process.env.CHROME_VER,
            commands_not_successful: 1, // to be removed
            devx: true,
            os: 'test', // need collect
            performance_enabled: 'true', // to be removed
            public: 'team',
            record_logs: true, // to be removed
            record_mp4: 'true', // to be removed
            record_screenshots: 'true', // to be removed
            record_video: 'true', // to be removed
            video_url: 'test', // remove
            log_url: 'test' // remove
        }
    };

    let sessionId;
    await Promise.all([
        api.createResultJob(
            body
        ).then(
            (resp) => {
                sessionId = resp.id;
            },
            (e) => console.error('Create job failed: ', e.stack)
        )
    ]);

    return sessionId;
}


// TODO Tian: this method is a temporary solution for creating jobs via test-composer.
// Once the global data store is ready, this method will be deprecated.
const createJobWorkaround = async (tags, api, passed, startTime, endTime) => {
    /**
     * don't try to create a job if no credentials are set
     */
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        return;
    }

    let browserVersion;
    switch (suite.browser.toLowerCase()) {
        case 'firefox':
            browserVersion = process.env.FF_VER;
            break;
        case 'chrome':
            browserVersion = process.env.CHROME_VER;
            break;
        default:
            browserVersion = '*';
    }

    const body = {
        name: jobName,
        user: process.env.SAUCE_USERNAME,
        startTime,
        endTime,
        framework: 'puppeteer',
        frameworkVersion: process.env.PUPPETEER_VERSION,
        status: 'complete',
        errors: [],
        passed,
        tags,
        build,
        browserName: suite.browser,
        browserVersion: browserVersion,
        platformName: process.env.IMAGE_NAME + ':' + process.env.IMAGE_TAG
    };

    let sessionId;
    await api.createJob(
        body
    ).then(
        (resp) => {
            sessionId = resp.ID;
        },
        (e) => console.error('Create job failed: ', e.stack)
    );

    return sessionId || 0;
};

module.exports = class TestrunnerReporter {
    constructor() {

    }

    async onRunStart() {
        startTime = new Date().toISOString()
        await this.startVideo()
    }

    async startVideo() {
        if (this.isVideoRecordingEnabled()) {
            await exec('start-video')
        }
    }

    async stopVideo() {
        if (this.isVideoRecordingEnabled()) {
            await exec('stop-video')
        }
    }

    isVideoRecordingEnabled() {
        return !process.env.SAUCE_VM || process.env.SAUCE_VIDEO_RECORD
    }

    async onRunComplete(test, {testResults, numFailedTests}) {
        log.info('Finished testrun!')
        endTime = new Date().toISOString()

        const hasPassed = numFailedTests === 0
        const logFilePath = path.join(HOME_DIR, 'log.json');
        fs.writeFileSync(logFilePath, JSON.stringify(testResults, null, 4));

        // No need to upload any assets on a sauce VM. That's handled elsewhere.
        if (process.env.SAUCE_VM) {
            return;
        }

        let tags = process.env.SAUCE_TAGS // FIXME this should come from the sauce-runner.json, not via env vars
        if (tags) {
            tags = tags.split(",")
        }

        let sessionId;
        let jobDetailsUrl, reportingSucceeded = false;
        if (process.env.ENABLE_DATA_STORE) {
            sessionId = await createJobShell(tags, api)
        } else {
            sessionId = await createJobWorkaround(tags, api, hasPassed, startTime, endTime)
        }

        /**
         * only upload assets if a session was initiated before
         */
        if (!sessionId) {
            updateExportedValue(SAUCECTL_OUTPUT_FILE, {reportingSucceeded});
            return
        }

        await this.stopVideo()

        const assets = LOG_FILES.filter((path) => fs.existsSync(path))

        await api.uploadJobAssets(
            sessionId,
            {
                files: [
                    logFilePath,
                    ...assets
                ]
            }
        ).then(
            (resp) => {
                if (resp.errors) {
                    for (let err of resp.errors) {
                        console.error(err);
                    }
                    return;
                }

                reportingSucceeded = true;
            },
            (e) => log.error('upload failed:', e.stack)
        )

        let domain;

        switch (region) {
            case "us-west-1":
                domain = "saucelabs.com"
                break
            default:
                domain = `${region}.saucelabs.${tld}`
        }
        jobDetailsUrl = `https://app.${domain}/tests/${sessionId}`;
        console.log(`\nOpen job details page: ${jobDetailsUrl}\n`)
        updateExportedValue(SAUCECTL_OUTPUT_FILE, {jobDetailsUrl, reportingSucceeded});
    }
}
