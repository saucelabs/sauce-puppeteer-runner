const path = require('path')
const fs = require('fs');
const yaml = require('js-yaml');
const {HOME_DIR} = require('../src/constants')

// the default test matching behavior for versions <= v0.1.4
const DefaultRunCfg = {
    projectPath: `${HOME_DIR}`,
    match: [
        `${HOME_DIR}/tests/?(*.)+(spec|test).[jt]s?(x)`,
        `${HOME_DIR}/tests/**/?(*.)+(spec|test).[jt]s?(x)`
    ]
}

const runCfgPath = path.join(HOME_DIR, 'run.yaml')
runCfg = loadRunConfig(runCfgPath)
testMatch = resolveTestMatches(runCfg)

function loadRunConfig(cfgPath) {
    if (fs.existsSync(cfgPath)) {
        return yaml.safeLoad(fs.readFileSync(cfgPath, 'utf8'));
    }

    return DefaultRunCfg
}

function resolveTestMatches(runCfg) {
    return runCfg.match.map(
        p => {
            if (path.isAbsolute(p)) {
                return p
            }
            return path.join(runCfg.projectPath, p)
        }
    );
}


module.exports = {
    rootDir: HOME_DIR,
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        `${HOME_DIR}/src/jest.setup.js`,
        `${HOME_DIR}/src/jest.teardown.js`
    ],
    reporters: [
        `default`,
        `${HOME_DIR}/src/reporter.js`
    ],
    testMatch: testMatch,
};
