import path from 'path';
import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';

const makeFileNameFromUrl = (urlStr) => {
  const { host, pathname } = url.parse(urlStr);
  const urlName = path.join(host, pathname).replace(/[^а-яА-ЯёЁa-zA-Z0-9]/g, '-');
  return `${urlName}.html`;
};

export default (urlStr, pathToDir = path.resolve()) => {
  const fileName = makeFileNameFromUrl(urlStr);
  const pathToFile = path.resolve(pathToDir, fileName);

  return axios
    .get(urlStr)
    .then(res => fs.writeFile(pathToFile, res.data))
    .catch(err => console.log(err));
};
