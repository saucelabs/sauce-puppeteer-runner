CHROME_VERSION=81.0.4044.138
PUPPETEER_VERSION=3.0.4
SAUCECTL_VERSION=0.6.3

build_base_flavor:
	docker build -f Dockerfile.base \
		--build-arg PUPPETEER_VERSION=${PUPPETEER_VERSION} \
		--build-arg CHROME_VERSION=${CHROME_VERSION} \
		-t saucelabs/sauce-puppeteer:${PUPPETEER_VERSION} .\
		${NO_CACHE}

build_saucectl_flavor: build_base_flavor
	docker build -f Dockerfile.saucectl \
		--build-arg SAUCECTL_VERSION=${SAUCECTL_VERSION} \
		--build-arg PUPPETEER_VERSION=${PUPPETEER_VERSION} \
		-t saucelabs/sauce-puppeteer:${PUPPETEER_VERSION}-saucectl${SAUCECTL_VERSION}-vruno .\
		${NO_CACHE}

build_all_flavors: build_base_flavor build_saucectl_flavor

push_base_flavor:
	docker push saucelabs/sauce-puppeteer:${PUPPETEER_VERSION}

push_saucectl_flavor:
	docker push ${DOCKER_REGISTRY}saucelabs/sauce-puppeteer:${PUPPETEER_VERSION}-saucectl${SAUCECTL_VERSION}

push_all_flavors: push_base_flavor push_saucectl_flavor
