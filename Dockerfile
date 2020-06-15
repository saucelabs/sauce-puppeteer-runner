FROM saucelabs/testrunner-image:latest

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
RUN npm install

#==================
# Install saucectl
#==================
ARG SAUCECTL_VERSION=0.6.2
ENV SAUCECTL_BINARY=saucectl_${SAUCECTL_VERSION}_linux_64-bit.tar.gz
RUN curl -L -o ${SAUCECTL_BINARY} \
  -H "Accept: application/octet-stream" \
  https://github.com/saucelabs/saucectl/releases/download/v${SAUCECTL_VERSION}/${SAUCECTL_BINARY} \
  && tar -xvzf ${SAUCECTL_BINARY} \
  && mkdir /home/seluser/bin/ \
  && mv ./saucectl /home/seluser/bin/saucectl \
  && rm ${SAUCECTL_BINARY}

COPY . .
RUN sudo chown -R seluser /home/seluser

#==================
# ENTRYPOINT & CMD
#==================
# IMPORTANT: Using the string form `CMD "entry.sh"` without
# brackets [] causes Docker to run your process
# And using `bash` which doesn’t handle signals properly
CMD ["./entry.sh"]
