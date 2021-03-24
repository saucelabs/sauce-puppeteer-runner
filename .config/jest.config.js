const {HOME_DIR, PROJECT_DIR} = require('../src/constants');
const {getSuite, loadRunConfig} = require('sauce-testrunner-utils');

function createJestConfig(runCfgPath, suiteName) {
    try {
        const runCfg = loadRunConfig(runCfgPath);
        const suite = getSuite(runCfg, suiteName);

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
    const runCfgPath = process.env['SAUCE_RUNNER_CONFIG']
    const suiteName = process.env['SAUCE_SUITE']
    return createJestConfig(runCfgPath, suiteName)
};
