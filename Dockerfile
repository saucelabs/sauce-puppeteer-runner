FROM mhart/alpine-node:12.16.0

WORKDIR /usr/app

COPY . .
RUN npm install

CMD ["npm", "test"]