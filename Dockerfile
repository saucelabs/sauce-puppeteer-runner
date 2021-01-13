FROM saucelabs/testrunner-image:v0.1.1

#================
# Install Node.JS
#================
ENV NODE_VERSION=12.16.2
ENV NVM_VERSION=0.35.3
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | bash \
  && export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" \
  && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
  && nvm install ${NODE_VERSION}

ENV PATH="/home/seluser/bin:/home/seluser/.nvm/versions/node/v${NODE_VERSION}/bin:${PATH}" \
    CHROME_BINARY_PATH="/usr/bin/google-chrome-stable" \
    WDIO_LOG_PATH="/home/seluser/docker.log"

WORKDIR /home/seluser

COPY package.json .
COPY package-lock.json .
ENV PUPPETEER_VERSION=3.0.4
ENV IMAGE_NAME=saucelabs/stt-puppeteer-jest-node
ARG BUILD_TAG
ENV IMAGE_TAG=${BUILD_TAG}

RUN npm ci --production

COPY --chown=seluser:seluser . .
RUN mkdir tests/

# Workaround for permissions in CI if run with a different user
RUN chmod 777 -R /home/seluser/

#==================
# ENTRYPOINT & CMD
#==================
# IMPORTANT: Using the string form `CMD "entry.sh"` without
# brackets [] causes Docker to run your process
# And using `bash` which doesn’t handle signals properly
CMD ["./entry.sh"]
