# page loader

[![Build Status](https://travis-ci.org/Yorickov/page-loader.svg?branch=master)](https://travis-ci.org/Yorickov/page-loader)
[![Maintainability](https://api.codeclimate.com/v1/badges/82b7d0694ddd52c16317/maintainability)](https://codeclimate.com/github/Yorickov/page-loader/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/82b7d0694ddd52c16317/test_coverage)](https://codeclimate.com/github/Yorickov/page-loader/test_coverage)

CLI-utility, downloads web page with resourses

*Educational project hexlet.io, Javascript/Back-End, p.3*

## Technologies
- Npm / Babel / ESLint
- Jest
- commander
- axios
- cheerio
- listr

## Feautures
- file system I/O
- nodejs: fs, url, path, etc.
- error handling
- debug
- DOM: basic manipulations
- asynchronous programming: promises
- HTTP
- test-driven development: mock/stub

## Setup
`make install`

*`npm install -g loader-url`*

## Usage
`$ page-loader --output [path/to/dir] [url]`

## Example
```
$ page-loader --output /var/tmp https://redmine.org/projects
$ open /var/tmp/redmine-org-projects.html
```
