import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import Listr from 'listr';

import errorHandler from './utils';

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

const replaceLink = (link, contentHtml, pathToHtml, htmlDir) => {
  const replacer = new RegExp(link, 'g');
  const pathReplace = path.join(htmlDir, makeAssetsName(buildRelativeLink(link)));
  const newHtml = contentHtml.replace(replacer, pathReplace);

  log(`html updated, new link: ${pathReplace}`);
  return newHtml;
};

const getResourses = (contentHtml, urlQuery, pathToAssets, pathToHtml, htmlDir) => {
  const links = getLinks(contentHtml, urlQuery);
  let html = contentHtml;
  log(`start downloading resourses from url: ${urlQuery}`);

  return Promise.all(links.map((link) => {
    const absLink = builAbsoluteLink(link, urlQuery);
    const pathToResourse = path.join(pathToAssets, makeAssetsName(buildRelativeLink(link)));
    return new Listr([
      {
        title: `Downloading resourse ${absLink} to path: ${pathToResourse}`,
        task: () => axios
          .get(absLink, { responseType: 'arraybuffer' })
          .then((res) => {
            html = replaceLink(link, html, pathToHtml, htmlDir);
            return fs.writeFile(pathToResourse, res.data);
          })
          .then(() => log(`resourse ${link} written to path: ${pathToResourse}`)),
      }])
      .run()
      .catch(err => errorHandler(err, log, absLink));
  }))
    .then(() => {
      log('dowloading completed, start writing html');
      return fs.writeFile(pathToHtml, html);
    });
};

const loadResourses = ({ data }, urlQuery, pathToAssets, pathToHtml, htmlDir) =>
  fs.mkdir(pathToAssets)
    .then(() => {
      log(`got html end create folder for assets on path: ${pathToAssets}`);
      return getResourses(data, urlQuery, pathToAssets, pathToHtml, htmlDir);
    });

export default (urlQuery, pathToDir = path.resolve('temp')) => {
  log('START');
  const { htmlPageName, htmlDir } = makeHtmlAndFolder(urlQuery);
  const pathToHtml = path.resolve(pathToDir, htmlPageName);
  const pathToAssets = path.resolve(pathToDir, htmlDir);
  return axios
    .get(urlQuery)
    .then(res => loadResourses(res, urlQuery, pathToAssets, pathToHtml, htmlDir))
    .then(() => log(`SUCCESS! Download from ${urlQuery} completed, path to page: ${pathToHtml}`))
    .catch((err) => {
      errorHandler(err, log, urlQuery);
      return Promise.reject(err);
    });
};
