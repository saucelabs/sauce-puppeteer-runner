const fs = require('fs')

afterAll(async () => {
  global.isDone = true
  if (global.browser) await global.browser.close()

  const logFilePath = __dirname + '/log.json'
  fs.writeFileSync(logFilePath, JSON.stringify(global.logs, null, 4))
  await global.api.uploadJobAssets(global.sessionId, [logFilePath]).then(
    () => console.log('upload successful'),
    (e) => console.log('upload failed:', e.stack)
  )

  console.log('Done!')
});
