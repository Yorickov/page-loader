#!/usr/bin/env node
import commander from 'commander';
import { description, version } from '../../package.json';

import pageLoader from '..';
import { errorHandler } from '../utils';

const program = commander;

program
  .version(version)
  .description(description)
  .arguments('<url>')
  .option('-o, --output [directory]', 'download url into directory [output]')
  .action((url, option) =>
    pageLoader(url, option.output)
      .catch((err) => {
        errorHandler(err);
        process.exit(1);
      }));

program.parse(process.argv);
