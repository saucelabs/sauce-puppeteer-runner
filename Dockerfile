FROM saucelabs/testrunner-image:latest

#================
# Install Node.JS
#================
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
  && export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" \
  && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
  && nvm install 12.16.2

ENV PATH="/home/testrunner/bin:/home/seluser/.nvm/versions/node/v12.16.2/bin:${PATH}" \
    CHROME_BINARY_PATH="/usr/bin/google-chrome-stable" \
    WDIO_LOG_PATH="/home/seluser/docker.log"

WORKDIR /home/testrunner
COPY . .
RUN sudo chown -R seluser /home/testrunner

RUN curl -L -o saucectl_0.3.0_Linux_x86_64.tar.gz \
  -H 'Authorization: token 3b7322d6d66db64750809c1e2a0162a0e8b124c0' \
  -H "Accept: application/octet-stream" \
  https://api.github.com/repos/saucelabs/saucectl/releases/assets/19820019 \
  && tar -xvzf saucectl_0.3.0_Linux_x86_64.tar.gz \
  && mkdir /home/testrunner/bin/ \
  && mv ./saucectl /home/testrunner/bin/

RUN npm install

#==================
# ENTRYPOINT & CMD
#==================
# IMPORTANT: Using the string form `CMD "entry.sh"` without
# brackets [] causes Docker to run your process
# And using `bash` which doesn’t handle signals properly
CMD ["./entry.sh"]
