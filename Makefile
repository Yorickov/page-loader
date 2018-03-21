install:
	npm install

build:
	rm -rf dist
	npm run build

start:
	npm run babel-node -- src/bin/page-loader.js

index:
	npm run babel-node -- src/index.js

load:
	npm run babel-node -- src/bin/page-loader.js --output /Users/yorickov/projects/js/hexlet/temp

help:
	npm run babel-node -- src/bin/page-loader.js --help

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
