DOCKER_IMAGE_NAME := saucelabs/sauce-puppeteer

docker:
	docker build -t $(DOCKER_IMAGE_NAME):latest .
