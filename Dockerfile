FROM saucelabs/testrunner-image:latest

ENV PATH="/home/seluser/.nvm/versions/node/v12.16.1/bin:${PATH}"
ENV CHROME_BINARY_PATH="/usr/bin/google-chrome-stable"

WORKDIR /home/testrunner
COPY . .

RUN npm install
CMD ["npm", "test"]
