FROM saucelabs/testrunner-image:latest

#================
# Install Node.JS
#================
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
  && export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" \
  && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
  && nvm install 12

ENV PATH="/home/testrunner/bin:/home/seluser/.nvm/versions/node/v12.16.1/bin:${PATH}" \
    CHROME_BINARY_PATH="/usr/bin/google-chrome-stable" \
    WDIO_LOG_PATH="/home/seluser/docker.log"

WORKDIR /home/testrunner
COPY . .
RUN sudo chown -R seluser /home/testrunner

RUN npm install

#==================
# ENTRYPOINT & CMD
#==================
# IMPORTANT: Using the string form `CMD "entry.sh"` without
# brackets [] causes Docker to run your process
# And using `bash` which doesn’t handle signals properly
CMD ["./entry.sh"]
