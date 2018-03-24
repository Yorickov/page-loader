#!/usr/bin/env node
import commander from 'commander';
import { description, version } from '../../package.json';
import pageLoader from '..';

const program = commander;

program
  .version(version)
  .description(description)
  .arguments('<url>')
  .option('-o, --output [directory]', 'download url into directory [output]')
  .action((url, option) =>
    pageLoader(url, option.output)
      .catch((err) => {
        if (err.response) {
          console.error(`${err.response.status}`);
        } else if (err.code) {
          console.error(`${err.code}`);
        } else {
          console.error('unexpected error');
        }
        process.exit(1);
      }))
  .parse(process.argv);
