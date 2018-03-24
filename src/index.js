import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import Listr from 'Listr'; // eslint-disable-line

import { responseError, fsError } from './utils';

const log = debug('page-loader');

const makeAssetsName = link => link
  .split('/')
  .filter(item => item)
  .join('-');

const makeHtmlAndFolder = (urlStr) => {
  const { host, pathname } = url.parse(urlStr);
  const getHost = `${host}`.replace(/[^а-яА-ЯёЁa-zA-Z0-9]/g, '-');
  const getPath = makeAssetsName(`${getHost}${pathname}`);
  const htmlPageName = `${getPath}.html`;
  const htmlDir = `${getPath}_files`;
  return { htmlPageName, htmlDir };
};

const buildRelativeLink = (link) => {
  const { pathname } = url.parse(link);
  return pathname;
};

const builAbsoluteLink = (link, urlHost) => {
  const { host } = url.parse(link);
  return host ? link : `${urlHost}${link}`;
};

const isValideLink = (link, urlHost) => {
  const { host: outerHost } = url.parse(link);
  const { host: innerHost } = url.parse(urlHost);
  return outerHost ? outerHost.indexOf(innerHost) !== -1 : true;
};

const tagsMapping = {
  script: 'src',
  link: 'href',
  img: 'src',
};

const getLinks = (html, urlHost) => {
  const $ = cheerio.load(html);
  const tags = Object.keys(tagsMapping);
  const refs = tags
    .map((tag) => {
      const attrb = tagsMapping[tag];
      const links = $(`${tag}[${attrb}]`)
        .map((index, item) => $(item).attr(attrb))
        .filter((index, item) => isValideLink(item, urlHost));
      return [...links];
    });
  return _.uniq(_.flatten(refs));
};

const getResourses = (contentHtml, urlQuery, pathToAssets) => {
  const links = getLinks(contentHtml, urlQuery);
  return Promise.all(links.map((link) => {
    const absLink = builAbsoluteLink(link, urlQuery);
    const pathToResourse = path.join(pathToAssets, makeAssetsName(buildRelativeLink(link)));
    return axios
      .get(absLink, { responseType: 'arraybuffer' })
      .then(res => fs.writeFile(pathToResourse, res.data)
        .then(() => {
          log(`resourse on ${link} downloaded and written`);
          return ({ link, status: 'downloaded' });
        }))
      .catch((err) => {
        responseError(err, absLink, log);
        return ({ link, status: 'not downloaded' });
      });
  }))
    .then((resourses) => {
      const downloadedLinks = resourses
        .filter(resourse => resourse.status === 'downloaded')
        .map(({ link }) => link);
      return ({ downloadedLinks, contentHtml });
    });
};

const replaceLinks = ({ downloadedLinks, contentHtml }, pathToHtml, htmlDir) => {
  const newHtml = downloadedLinks.reduce((acc, link) => {
    const replacer = new RegExp(link, 'g');
    const pathReplace = path.join(htmlDir, makeAssetsName(buildRelativeLink(link)));
    const newAcc = acc.replace(replacer, pathReplace);
    return newAcc;
  }, contentHtml);
  return fs.writeFile(pathToHtml, newHtml);
};

const createResoursesDir = (pathToAssets) => {
  log('got and written html');
  return fs.mkdir(pathToAssets);
};

export default (urlQuery, pathToDir = path.resolve('temp')) => {
  log('start');
  const { htmlPageName, htmlDir } = makeHtmlAndFolder(urlQuery);
  const pathToHtml = path.resolve(pathToDir, htmlPageName);
  const pathToAssets = path.resolve(pathToDir, htmlDir);
  return axios
    .get(urlQuery)
    .then(res => createResoursesDir(pathToAssets)
      .then(() => getResourses(res.data, urlQuery, pathToAssets)))
    .then(resourses => replaceLinks(resourses, pathToHtml, htmlDir))
    .catch((err) => {
      if (err.response) {
        responseError(err, urlQuery);
        return Promise.reject(err);
      } else if (err.code) {
        fsError(err, log);
        return Promise.reject(err);
      }
      return Promise.reject(err);
    });
};
