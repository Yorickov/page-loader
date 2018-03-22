install:
	npm install

build:
	rm -rf dist
	npm run build

loader:
	DEBUG=page-loader page-loader --output /Users/yorickov/projects/js/hexlet/temp https://hexlet.io/courses

start:
	npm run babel-node -- src/bin/page-loader.js --output /Users/yorickov/projects/js/hexlet/temp https://hexlet.io/courses

index:
	npm run babel-node -- src/index.js

test:
	npm test

watch:
	npm run watch

lint:
	npm run eslint .

clean:
	rm -rf dist

publish:
	npm publish

.PHONY: test
