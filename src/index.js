import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';

import AbsoluteLink from './utils/AbsoluteLink';
import RelativeLink from './utils/RelativeLink';

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

const buildLink = (link, urlHost) => {
  const { host, pathname } = url.parse(link);
  const { host: baseHost } = url.parse(urlHost);
  return host ? new AbsoluteLink(link, baseHost, pathname, host)
    : new RelativeLink(link, urlHost);
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
        .map((index, item) => {
          const attr = $(item).attr(attrb);
          return buildLink(attr, urlHost);
        })
        .filter((index, item) => item.isValidate());
      return [...links];
    });
  return _.uniq(_.flatten(refs));
};

const getResourses = (contentHtml, urlQuery) => {
  const links = getLinks(contentHtml, urlQuery);
  log(`got links: ${links}`);
  return Promise.all(links.map(link =>
    axios
      .get(link.getAbsUrl(), { responseType: 'arraybuffer' })
      .then((res) => {
        log(`${link.getAbsUrl()}: downloading...`);
        return ({ link, contentAssets: res.data, status: 'downloaded' });
      })
      .catch((err) => {
        responseError(err, link.getAbsUrl());
        return ({ link, contentAssets: `${err.response.status}`, status: 'not downloaded' }); // del
      })))
    .then(resourses => ({ resourses, contentHtml }));
};

const writeResourses = (resourses, contentHtml, pathToAssets) =>
  Promise.all(resourses
    .filter(link => link.status === 'downloaded')
    .map(({ link, contentAssets }) => {
      const pathToResourse = path.join(pathToAssets, makeAssetsName(link.getLocal()));
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
    const replacer = new RegExp(link.getOriginLink(), 'g');
    contentHtmlPage = contentHtmlPage
      .replace(replacer, path.join(htmlDir, makeAssetsName(link.getLocal())));
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
      } else if (err.code) {
        fsError(err);
        return Promise.reject(err.code);
      } else {
        Promise.reject(err);
      }
    });
};
