FROM saucelabs/testrunner-image:v0.4.0

#================
# Install Node.JS
#================
ENV NODE_VERSION=16.17.0
ENV NVM_VERSION=0.35.3
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | bash \
  && export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" \
  && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
  && nvm install ${NODE_VERSION}

ENV PATH="/home/seluser/bin:/home/seluser/.nvm/versions/node/v${NODE_VERSION}/bin:${PATH}" \
    CHROME_BINARY_PATH="/usr/bin/google-chrome-stable" \
    FIREFOX_BINARY_PATH="/usr/bin/firefox" \
    WDIO_LOG_PATH="/home/seluser/docker.log"

WORKDIR /home/seluser

COPY package.json .
COPY package-lock.json .

ENV IMAGE_NAME=saucelabs/stt-puppeteer-jest-node

ARG BUILD_TAG
ENV IMAGE_TAG=${BUILD_TAG}

ARG PUPPETEER_VERSION
ENV PUPPETEER_VERSION=${PUPPETEER_VERSION}

RUN npm ci --production

COPY --chown=seluser:seluser . .

# Let saucectl know where to mount files
RUN mkdir -p /home/seluser/__project__/ && chown seluser:seluser /home/seluser/__project__/
LABEL com.saucelabs.project-dir=/home/seluser/__project__/
ENV SAUCE_PROJECT_DIR=/home/seluser/__project__/

# Let saucectl know where to read job details url
LABEL com.saucelabs.job-info=/tmp/output.json
RUN echo "{}" > /tmp/output.json

#==================
# ENTRYPOINT & CMD
#==================
# IMPORTANT: Using the string form `CMD "entry.sh"` without
# brackets [] causes Docker to run your process
# And using `bash` which doesn’t handle signals properly
CMD ["./entry.sh"]
