/// <reference lib='webworker' />
addEventListener('message', ({ data }) => {
  postMessage({ type: 'done', data });
});