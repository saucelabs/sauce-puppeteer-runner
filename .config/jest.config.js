const {getRunnerConfig} = require("../src/utils");
const {HOME_DIR, PROJECT_DIR, SUITE_NAME} = require('../src/constants');
const {getSuite} = require('sauce-testrunner-utils');

function createJestConfig() {
    try {
        const runCfg = getRunnerConfig();
        const suite = getSuite(runCfg, SUITE_NAME);

        return {
            rootDir: PROJECT_DIR,
            testEnvironment: 'node',
            setupFilesAfterEnv: [
                `${HOME_DIR}/src/jest.setup.js`,
                `${HOME_DIR}/src/jest.teardown.js`
            ],
            reporters: [
                `default`,
                `${HOME_DIR}/src/reporter.js`
            ],
            testMatch: suite.testMatch,
        };
    } catch (e) {
        console.error(`Failed to prepare jest configuration. Reason: ${e.message}`);
    }
}

module.exports = async () => {
    return createJestConfig()
};
