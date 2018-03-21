import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import cheerio from 'cheerio';
import _ from 'lodash';

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

const tagsMapping = {
  script: 'src',
  link: 'href',
  img: 'src',
};

const processLink = (link, urlHost) => {
  const { host } = url.parse(link); // hostanme?
  const { host: baseHost } = url.parse(urlHost);
  return host ? host === baseHost : !/^http/.test(link);
};

const getLinks = (html, urlHost) => {
  const $ = cheerio.load(html);
  const tags = Object.keys(tagsMapping);
  const refs = tags
    .map((tag) => {
      const attrb = tagsMapping[tag];
      const links = $(`${tag}[${attrb}]`)
        .map((index, item) => $(item).attr(attrb))
        .filter((index, item) => processLink(item, urlHost));
      return [...links];
    });
  return _.uniq(_.flatten(refs));
};

export default (urlQuery, pathToDir = path.resolve('temp')) => {
  const { htmlPageName, htmlDir } = makeHtmlAndFolder(urlQuery);
  const pathToHtml = path.resolve(pathToDir, htmlPageName);
  const pathToAssets = path.resolve(pathToDir, htmlDir);
  return axios
    .get(urlQuery)
    .then(res => fs.writeFile(pathToHtml, res.data))
    .then(() => fs.mkdir(pathToAssets))
    .then(() => fs.readFile(pathToHtml, 'utf8'))
    .then((contentHtml) => {
      const links = getLinks(contentHtml, urlQuery);
      return Promise.all(links.map((link) => {
        const newLink = /^http/.test(link) ? link : `${urlQuery}${link}`;
        return axios
          .get(newLink, { responseType: 'arraybuffer' })
          .then(res => ({ link, contentAssets: res.data }));
      }));
    })
    .then(resourses =>
      Promise.all(resourses.map(({ link, contentAssets }) => {
        const pathToResourse = path.join(pathToAssets, makeAssetsName(link));
        return fs.writeFile(pathToResourse, contentAssets);
      })).then(() => Promise.resolve(resourses)))
    .then(resourses =>
      fs.readFile(pathToHtml, 'utf8')
        .then((contentHtml) => {
          let contentHtmlPage = contentHtml;

          resourses.forEach(({ link }) => {
            const replacer = new RegExp(link, 'g');
            contentHtmlPage = contentHtmlPage
              .replace(replacer, path.join(htmlDir, makeAssetsName(link)));
          });
          return fs.writeFile(pathToHtml, contentHtmlPage);
        })
        .catch(err => console.log(err)))
    .catch(err => console.log(err));
};
