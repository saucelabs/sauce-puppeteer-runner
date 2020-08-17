const path = require('path')
const fs = require('fs');
const yaml = require('js-yaml');
const {promisify} = require('util');
const {HOME_DIR} = require('../src/constants');
const { exec } = require('child_process');

// Promisify callback functions
const fileExists = promisify(fs.exists)
const readFile = promisify(fs.readFile)

// the default test matching behavior for versions <= v0.1.4
const DefaultRunCfg = {
    projectPath: `${HOME_DIR}`,
    match: [
        `${HOME_DIR}/tests/?(*.)+(spec|test).js?(x)`,
        `${HOME_DIR}/tests/**/?(*.)+(spec|test).js?(x)`
    ]
}

async function loadRunConfig(cfgPath) {
    if (await fileExists(cfgPath)) {
        return yaml.safeLoad(await readFile(cfgPath, 'utf8'));
    }
    console.log(`Run config (${cfgPath}) unavailable. Loading defaults.`)

    return DefaultRunCfg
}

function resolveTestMatches(HOME_DIR, runCfg) {
    return runCfg.match.map(
        p => {
            if (path.isAbsolute(p)) {
                return p
            }
            return path.join(HOME_DIR, runCfg.projectPath, p)
        }
    );
}

module.exports = async () => {
    const runCfgPath = path.join(HOME_DIR, 'run.yaml')
    const runCfg = await loadRunConfig(runCfgPath)
    const testMatch = resolveTestMatches(HOME_DIR, runCfg)

    async function transpileTypescript () {
        const tsconfigPath = path.join(HOME_DIR, runCfg.projectPath, 'tsconfig.json')
        if (promisify(fs.exists)(tsconfigPath)) {
            console.log(`Transpiling typescript config found at '${tsconfigPath}'`);
            try {
                const tscPath = path.join('/home', 'seluser', 'node_modules', 'typescript', 'bin', 'tsc');
                await promisify(exec)(`${tscPath} -p ${tsconfigPath}`);
            } catch (e) {
                console.error(`Could not transpile Typescript. ${e}.`);
            }
        }
    };
    await transpileTypescript();

    return {
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
        testMatch,
    };
};