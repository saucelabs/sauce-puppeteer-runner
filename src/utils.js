const shell = require('shelljs')
const {loadRunConfig} = require("sauce-testrunner-utils");
const logger = require('@wdio/logger').default

const { COMMAND_TIMEOUT } = require('./constants')

const log = logger('utils')

let lastCommand = Date.now()

global.logs = []

let runCfg;

exports.getRunnerConfig = () => {
    if (runCfg) {
        return runCfg
    }

    const runCfgPath = process.env.SAUCE_RUNNER_CONFIG;
    runCfg = loadRunConfig(runCfgPath);
    runCfg.path = runCfgPath;
    return runCfg
}

exports.logHelper = (...args) => {
    const sendString = 'SEND ► ['
    const receiveString = '◀ RECV'

    if (args[0].includes(receiveString)) {
        const line = args[0].slice(args[0].indexOf('{'))

        try {
            const response = JSON.parse(line)
            if (!response.id) {
                return
            }

            const log = global.logs.find(
                (log) => parseInt(log.id, 10) === parseInt(response.id))

            if (log) {
                log.result = response
            }
        } catch (e) {
            log.error(`Couldn't parse Puppeteer logs: ${e.stack}`)
        }

        return
    }

    if (!args[0].includes(sendString)) {
        return
    }

    // It extracts sent command in the args[0] like
    // 2022-06-03T00:16:49.613Z puppeteer:protocol:SEND ► [
    //  '{"sessionId":"ea27a779-42d2-4c8c-9dac-10634741a60e","method":"Runtime.callFunctionOn"}'
    //]
    const line = args[0].slice(args[0].indexOf(sendString) + sendString.length).replace(/\n/g, '').trim()
    const command = JSON.parse(line.substring(1, line.length-2))
    const duration = (Date.now() - lastCommand) / 1000
    global.logs.push({
        id: command.id,
        screenshot: 0,
        between_commands: duration,
        start_time: Date.now() / 1000,
        suggestion_values: [],
        request: command.params,
        HTTPStatus: 200,
        result: "",
        suggestion: null,
        duration,
        path: command.method,
        in_video_timeline: 0,
        method: "SOCKET",
        statusCode: 0
    })

    lastCommand = Date.now()
}

exports.exec = async (expression, timeout = COMMAND_TIMEOUT) => {
    const cp = shell.exec(expression, { async: true, silent: true })
    cp.stdout.on('data', (data) => log.info(`${data}`))
    cp.stderr.on('data', (data) => log.info(`${data}`))

    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, COMMAND_TIMEOUT)
        cp.on('exit', () => {
            clearTimeout(timeout)
            resolve()
        })
    })
}
