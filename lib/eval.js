// @flow
/* eslint no-eval: 0 */
const isNode = typeof module !== 'undefined' && module.exports;

if (isNode) {
  process.once('message', (code) => {
    eval(JSON.parse(code).data);
  });
} else {
  self.onmessage = function onmessage(code) {
    eval(code.data);
  };
}
