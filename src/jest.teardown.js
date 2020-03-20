const fs = require('fs')
const path = require('path')

const shell = require('shelljs')

afterAll(async () => {
    await global.browser.close()
    const logFilePath = path.join(process.cwd(), '/log.json')
    fs.writeFileSync(logFilePath, JSON.stringify(global.logs, null, 4))
    shell.exec('stop-video')
})
