make loaderinstall:
	npm install

build:
	rm -rf dist
	npm run build

loader:
	DEBUG=page-loader page-loader --output /var/tmp https://hexlet.io/courses

start:
	npm run babel-node -- src/bin/page-loader.js --output /var/tmp https://hexlet.io/courses

index:
	npm run babel-node -- src/index.js

test:
	npm test

watch:
	npm test -- --watchAll

coverage:
	npm test -- --coverage

lint:
	npm run eslint .

clean:
	rm -rf dist

publish:
	npm publish

.PHONY: test
