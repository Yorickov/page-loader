install:
	npm install

build:
	rm -rf dist
	npm run build

start:
	npm run babel-node -- src/bin/page-loader.js

load:
	npm run babel-node -- dist/bin/page-loader.js --output /Users/yorickov/projects/js/hexlet/page-loader https://hexlet.io/courses

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
