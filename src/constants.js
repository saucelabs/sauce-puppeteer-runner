exports.HOME_DIR = '/home/seluser'
exports.CHROME_DEFAULT_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
exports.JEST_TIMEOUT = 60 * 1000 // 1min
exports.COMMAND_TIMEOUT = 10 * 1000 // 10s

const LOG_DIR = '/var/log/cont'
exports.LOG_FILES = [
    LOG_DIR + '/chrome_browser.log',
    LOG_DIR + '/firefox_browser.log',
    LOG_DIR + '/supervisord.log',
    LOG_DIR + '/video-rec-stderr.log',
    LOG_DIR + '/video-rec-stdout.log',
    LOG_DIR + '/wait-xvfb.1.log',
    LOG_DIR + '/wait-xvfb.2.log',
    LOG_DIR + '/wait-xvfb-stdout.log',
    LOG_DIR + '/xvfb-tryouts-stderr.log',
    LOG_DIR + '/xvfb-tryouts-stdout.log',
    exports.HOME_DIR + '/videos/video.mp4',
    exports.HOME_DIR + '/docker.log'
]

exports.CHROME_ARGS = [
    '--start-fullscreen',
    '--remote-debugging-port=9223'
]
