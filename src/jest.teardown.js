afterAll(async () => {
    if (global.browser){
        await global.browser.close().catch(
            (err) => console.error(`Couldn't close browser: ${err.message}`))
    }
})
