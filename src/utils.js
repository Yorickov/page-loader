export const responseError = (err, ref, fn = console.error) => {
  switch (err.response.status) {
    case 403:
      fn(`${ref} failed download, code: ${err.response.status} Access Denied`);
      break;
    case 404:
      fn(`${ref} failed download, code: ${err.response.status} Resourse Not Found`);
      break;
    case 500:
      fn(`${ref} failed download, code: ${err.response.status} Internal Server Error`);
      break;
    case 503:
      fn(`${ref} failed download, code: ${err.response.status} Server Unavailable`);
      break;
    default:
      fn(`Mistake with code: ${err.response.code}`);
  }
};

export const fsError = (err, fn = console.error) => {
  switch (err.code) {
    case 'EEXIST':
      fn('file exists');
      break;
    case 'EISDIR':
      fn('path is directory');
      break;
    case 'ENOENT':
      fn('no directory');
      break;
    default:
      fn(`error code: ${err.code}`);
  }
};
