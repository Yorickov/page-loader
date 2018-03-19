#!/usr/bin/node
import commander from 'commander';
import { description, version } from '../../package.json';
import pageLoader from '..';

const program = commander;

program
  .version(version)
  .description(description)
  .arguments('<url>')
  .option('-o, --output [path]', 'download directory [output]')
  .action((url, option) =>
    pageLoader(url, option.output))
  .parse(process.argv);
