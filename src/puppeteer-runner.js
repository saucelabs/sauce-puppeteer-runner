#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const child_process = require('child_process');
const {getArgs} = require('sauce-testrunner-utils');

const puppeteerRunner = async () => {
    const fd = fs.openSync(path.join(__dirname, '..', 'console.log'), 'w+', 0o644);
    const ws = stream.Writable({
        write(data, encoding, cb) {
            fs.write(fd, data, undefined, encoding, cb)
        },
    });

    const {runCfgPath, suiteName} = getArgs();
    // Prepare the context to be used by other jest related files, as we cannot pass settings to them directly.
    process.env.SAUCE_RUNNER_CONFIG = runCfgPath
    process.env.SAUCE_SUITE = suiteName

    const child = child_process.spawn('jest', ['--no-colors',
        '--config=./.config/jest.config.js', '--runInBand', '--forceExit']);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(ws);
    child.stderr.pipe(ws);

    child.on('exit', (exitCode) => {
        fs.closeSync(fd);
        process.exit(exitCode);
    });
};

exports.puppeteerRunner = puppeteerRunner;
