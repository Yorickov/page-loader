import url from 'url';

export const errorHandler = (err, fn = console.error, ref = '') => {
  const {
    code,
    path,
    response,
    message,
  } = err;
  if (code) {
    fn(`IO error on path: ${path}, ${message}`);
  } else if (response.status) {
    fn(`failed download, error ${response.status} on request: ${ref}`);
  } else {
    fn('unknown error');
  }
};

export const buildRelativeLink = (link) => {
  const { pathname } = url.parse(link);
  return pathname;
};

export const builAbsoluteLink = (link, urlHost) => {
  const { host } = url.parse(link);
  return host ? link : `${urlHost}${link}`;
};

export const isValideLink = (link, urlHost) => {
  const { host: outerHost } = url.parse(link);
  const { host: innerHost } = url.parse(urlHost);
  return outerHost ? outerHost.indexOf(innerHost) !== -1 : true;
};
