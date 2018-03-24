import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';

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
        .filter((index, item) => {
          const { host: outerHost } = url.parse(item);
          const { host: innerHost } = url.parse(urlHost);
          return outerHost ? outerHost.indexOf(innerHost) !== -1 : true;
        });
      return [...links];
    });
  return _.uniq(_.flatten(refs));
};

const getResourses = (contentHtml, urlQuery) => {
  const links = getLinks(contentHtml, urlQuery);
  log(`got links: ${links}`);
  return Promise.all(links.map((link) => {
    const absLink = builAbsoluteLink(link, urlQuery);
    return axios
      .get(absLink, { responseType: 'arraybuffer' })
      .then((res) => {
        log(`${absLink}: downloading...`);
        return ({ link, contentAssets: res.data, status: 'downloaded' });
      })
      .catch((err) => {
        responseError(err, absLink, log);
        return ({ link, contentAssets: `${err.response.status}`, status: 'not downloaded' }); // del
      });
  }))
    .then(resourses => ({ resourses, contentHtml }));
};

const writeResourses = (resourses, contentHtml, pathToAssets) =>
  Promise.all(resourses
    .filter(resourse => resourse.status === 'downloaded')
    .map(({ link, contentAssets }) => {
      const pathToResourse = path.join(pathToAssets, makeAssetsName(buildRelativeLink(link)));
      return fs.writeFile(pathToResourse, contentAssets);
    }))
    .then(() => {
      log('resourses written');
      const links = resourses.map(({ link }) => link);
      return ({ links, contentHtml });
    });

const replaceLinks = (links, contentHtml, pathToHtml, htmlDir) => {
  let contentHtmlPage = contentHtml;

  links.forEach((link) => {
    const replacer = new RegExp(link, 'g');
    contentHtmlPage = contentHtmlPage
      .replace(replacer, path.join(htmlDir, makeAssetsName(buildRelativeLink(link))));
  });

  log('replaced links in html');
  return fs.writeFile(pathToHtml, contentHtmlPage);
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
    .get(urlQuery) // !!!!
    .then(res => fs.writeFile(pathToHtml, res.data))
    .then(() => createResoursesDir(pathToAssets))
    .then(() => fs.readFile(pathToHtml, 'utf8'))
    .then(contentHtml => getResourses(contentHtml, urlQuery))
    .then(({ resourses, contentHtml }) => writeResourses(resourses, contentHtml, pathToAssets))
    .then(({ links, contentHtml }) => replaceLinks(links, contentHtml, pathToHtml, htmlDir))
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
