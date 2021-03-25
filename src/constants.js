exports.HOME_DIR = process.env.TEST_HOME_DIR || '/home/seluser'
exports.PROJECT_DIR = process.env.SAUCE_PROJECT_DIR
exports.CHROME_DEFAULT_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
exports.DEFAULT_JEST_TIMEOUT = 60 // 1min
exports.COMMAND_TIMEOUT = 10 * 1000 // 10s

exports.LOG_FILES = [
    exports.HOME_DIR + '/videos/video.mp4',
    exports.HOME_DIR + '/docker.log',
    exports.HOME_DIR + '/console.log',
]

exports.CHROME_ARGS = [
    '--start-fullscreen',
    '--remote-debugging-port=9223'
]

exports.FIREFOX_ARGS = [
    '-browser'
]
