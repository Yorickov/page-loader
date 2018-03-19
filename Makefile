install:
	npm install

build:
	rm -rf dist
	npm run build

start:
	npm run babel-node -- src/bin/page-loader.js

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
