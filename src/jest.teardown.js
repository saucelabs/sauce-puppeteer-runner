const fs = require('fs')
const path = require('path')

afterAll(async () => {
    await global.browser.close()
    const logFilePath = path.join(process.cwd(), '/log.json')
    fs.writeFileSync(logFilePath, JSON.stringify(global.logs, null, 4))
})