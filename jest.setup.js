const puppeteer = require('puppeteer')
const { remote } = require('webdriverio')

// ;(async () => {
//   const client = await remote({
//     user: process.env.SAUCE_USERNAME,
//     key: process.env.SAUCE_ACCESS_KEY,
//     logLevel: 'error',
//     capabilities: {
//       browserName: 'chrome',
//       browserVersion: 'latest',
//       platformName: 'Windows 10',
//       'sauce:options': {
//         name: 'Puppeteer Test'
//       }
//     }
//   })
//   return client.deleteSession()
// })().then(console.log, console.error)

beforeAll(async () => {
  global.browser = await puppeteer.launch({
    headless: false
  })
})
