Sauce Puppeteer Runner
======================

Sauce Labs test runner image to run Puppeteer tests on Sauce.

## Requirements

- Docker

## Install

```sh
$ docker pull saucelabs/sauce-puppeteer-runner:latest
```

## Run

```sh
$ docker run --env SAUCE_USERNAME --env SAUCE_ACCESS_KEY -d saucelabs/sauce-puppeteer-runner:latest
```
