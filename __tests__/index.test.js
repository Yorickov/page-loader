import fs from 'mz/fs';
import os from 'os';
import nock from 'nock';
import path from 'path';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http'; // no influence

import pageLoader from '../src';

axios.defaults.adapter = httpAdapter; // no influence

const pathToHtml = '__tests__/__fixtures__/page.html';
const urlStr = 'https://hexlet.io/courses';
const fileName = 'hexlet-io-courses.html';

describe('load html', () => {
  const osTempDir = os.tmpdir();
  let pathToTemp;
  let testHtml;

  beforeAll(async () => {
    pathToTemp = await fs.mkdtemp(path.join(osTempDir, 'temp'));
    testHtml = await fs.readFile(pathToHtml, 'utf8');

    nock(urlStr)
      .get('') // '/' - Error 'Nock: No match for request'
      .replyWithFile(200, pathToHtml);
  });

  it('testing...', async () => {
    await pageLoader(urlStr, pathToTemp);
    const fileContent = await fs.readFile(path.join(pathToTemp, fileName), 'utf8');
    expect(fileContent).toEqual(testHtml);
  });
});
