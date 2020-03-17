FROM saucelabs/testrunner-image:latest

COPY . .
ENV PATH="/home/seluser/.nvm/versions/node/v12.16.1/bin:${PATH}"
RUN npm install

ENV CHROME_BINARY_PATH="/usr/bin/google-chrome-stable"
CMD ["npm", "test"]
