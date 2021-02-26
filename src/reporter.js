const fs = require('fs')
const path = require('path')

const logger = require('@wdio/logger').default
const SauceLabs = require('saucelabs').default
const { remote } = require('webdriverio')

const { exec } = require('./utils')
const { LOG_FILES, HOME_DIR } = require('./constants')

const log = logger('reporter')
const { updateExportedValue } = require('sauce-testrunner-utils').saucectl

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
        browserName: 'chrome',
        browserVersion: process.env.CHROME_VER,
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

const createJobLegacy = async (tags, api) => {
    /**
     * don't try to create a job if no credentials are set
     */
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        return
    }

    /**
     * create a job shell by trying to initialise a session with
     * invalid capabilities
     * ToDo(Christian): remove once own testrunner job API is available
     */
    const hostname = `ondemand.${region}.saucelabs.${tld}`;
    await remote({
        user: process.env.SAUCE_USERNAME,
        key: process.env.SAUCE_ACCESS_KEY,
        region,
        tld,
        hostname,
        connectionRetryCount: 0,
        logLevel: 'silent',
        capabilities: {
            browserName: 'Chrome',
            platformName: '*',
            browserVersion: '*',
            'sauce:options': {
                devX: true,
                name: jobName,
                tags: tags,
                build
            }
        }
    }).catch((err) => err)

    const { jobs } = await api.listJobs(
        process.env.SAUCE_USERNAME,
        { limit: 1, full: true, name: jobName }
    )
    return jobs && jobs.length && jobs[0].id
}

module.exports = class TestrunnerReporter {
    constructor () {
        log.info('Create job shell')
   }

    async onRunStart () {
        log.info('Start video capturing')
        startTime = new Date().toISOString()
        await exec('start-video')
    }

    async onRunComplete (test, { testResults, numFailedTests }) {
        log.info('Finished testrun!')
        if (process.env.SAUCE_USERNAME === '' || process.env.SAUCE_ACCESS_KEY === '') {
            console.log('Skipping asset uploads! Remember to setup your SAUCE_USERNAME/SAUCE_ACCESS_KEY');
            return;
        }
        endTime = new Date().toISOString()

        const hasPassed = numFailedTests === 0
        let tags = process.env.SAUCE_TAGS
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
            updateExportedValue(SAUCECTL_OUTPUT_FILE, { reportingSucceeded });
            return
        }

        await exec('stop-video')

        const logFilePath = path.join(HOME_DIR, 'log.json')
        fs.writeFileSync(logFilePath, JSON.stringify(testResults, null, 4))

        const containterLogFiles = LOG_FILES.filter(
            (path) => fs.existsSync(path))

        await api.uploadJobAssets(
                sessionId,
                {
                    files: [
                        logFilePath,
                        ...containterLogFiles
                    ]
                }
            ).then(
              (resp) => {
                if (resp.errors) {
                  for (let err of resp.errors) {
                    console.error(err);
                  }
                }
              },
              (e) => log.error('upload failed:', e.stack)
            )

        let domain

        switch (region) {
            case "us-west-1":
                domain = "saucelabs.com"
                break
            default:
                domain = `${region}.saucelabs.${tld}`
        }
        jobDetailsUrl = `https://app.${domain}/tests/${sessionId}`;
        console.log(`\nOpen job details page: ${jobDetailsUrl}\n`)
        updateExportedValue(SAUCECTL_OUTPUT_FILE, { jobDetailsUrl, reportingSucceeded });
    }
}
