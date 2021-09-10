const { getRunnerConfig } = require("../src/utils");
const { HOME_DIR, PROJECT_DIR, SUITE_NAME } = require('../src/constants');
const { getSuite, prepareNpmEnv } = require('sauce-testrunner-utils');

async function createJestConfig() {
    try {
        const runCfg = getRunnerConfig();
        const suite = getSuite(runCfg, SUITE_NAME);

        // Install NPM dependencies
        let metrics = [];
        let npmMetrics = await prepareNpmEnv(runCfg);
        metrics.push(npmMetrics);

        return {
            rootDir: PROJECT_DIR,
            testEnvironment: 'node',
            setupFilesAfterEnv: [
                `${HOME_DIR}/src/jest.setup.js`,
                `${HOME_DIR}/src/jest.teardown.js`
            ],
            reporters: [
                `default`,
                [ "jest-junit", {outputDirectory: HOME_DIR, outputName: `junit.xml`} ],
                [ `${HOME_DIR}/src/reporter.js`, {metrics} ],
            ],
            testMatch: suite.testMatch,
            runner: "groups"
        };
    } catch (e) {
        console.error(`Failed to prepare jest configuration. Reason: ${e.message}`);
    }
}

module.exports = async () => {
    return await createJestConfig()
};
