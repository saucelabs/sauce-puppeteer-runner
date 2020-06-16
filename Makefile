DOCKER_IMAGE_NAME := saucelabs/stt-puppeteer-jest-node

docker:
	docker build -t $(DOCKER_IMAGE_NAME):latest .
