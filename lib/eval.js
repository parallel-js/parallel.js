/**
 * @flow
 */
const isNode = typeof module !== 'undefined' && module.exports;

if (isNode) {
  process.once('message', (code) => {
    eval(JSON.parse(code).data);
  });
} else {
  self.onmessage = function (code) {
    eval(code.data);
  };
}
