FROM saucelabs/testrunner-image:latest

ENV PATH="/home/testrunner/bin:${PATH}"
ENV PATH="/home/seluser/.nvm/versions/node/v12.16.1/bin:${PATH}"
ENV CHROME_BINARY_PATH="/usr/bin/google-chrome-stable"

WORKDIR /home/testrunner
COPY . .
RUN sudo chown -R seluser /home/testrunner

RUN npm install
CMD tail -f /dev/null
