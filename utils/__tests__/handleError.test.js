const { test, describe } = require('node:test');
const assert = require('node:assert');
const { getStackMessage } = require('../handleError');

describe('getStackMessage', () => {

  test('should return empty array for falsy stack', () => {
    assert.deepStrictEqual(getStackMessage(undefined), []);
    assert.deepStrictEqual(getStackMessage(null), []);
    assert.deepStrictEqual(getStackMessage(''), []);
  });

  test('should return empty array if checkExportKeys is in stack', () => {
    const stack = `Error: Cannot find module
    at checkExportKeys (/app/test.js:1:1)`;
    assert.deepStrictEqual(getStackMessage(stack), []);
  });

  test('should parse standard stack trace, filtering out node:internal', () => {
    const stack = `Error: Something went wrong
    at foo (/app/foo.js:10:5)
    at bar (/app/bar.js:20:10)
    at Module._compile (node:internal/modules/cjs/loader:1234:14)`;

    const result = getStackMessage(stack);

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], undefined); // firstNMStackMessage
    assert.strictEqual(result[1].trim(), 'at foo (/app/foo.js:10:5)');
    assert.strictEqual(result[2].trim(), 'at bar (/app/bar.js:20:10)');
  });

  test('should extract the first node_modules trace as first item and filter the rest', () => {
    const stack = `Error: failed
    at myFunc (/app/index.js:5:5)
    at Object.<anonymous> (/app/node_modules/axios/lib/core/Axios.js:10:5)
    at someInternal (/app/node_modules/axios/lib/core/dispatchRequest.js:5:5)
    at anotherFunc (/app/main.js:15:15)`;

    const result = getStackMessage(stack);

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].trim(), 'at Object.<anonymous> (/app/node_modules/axios/lib/core/Axios.js:10:5)');
    assert.strictEqual(result[1].trim(), 'at myFunc (/app/index.js:5:5)');
    assert.strictEqual(result[2].trim(), 'at anotherFunc (/app/main.js:15:15)');
  });

  test('should not treat defillama packages as node_modules to be filtered out', () => {
    const stack = `Error: failed
    at sdkFunc (/app/node_modules/@defillama/sdk/build/index.js:5:5)
    at myFunc (/app/index.js:10:5)
    at externalFunc (/app/node_modules/axios/lib/core/Axios.js:15:5)`;

    const result = getStackMessage(stack);

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].trim(), 'at externalFunc (/app/node_modules/axios/lib/core/Axios.js:15:5)');
    assert.strictEqual(result[1].trim(), 'at sdkFunc (/app/node_modules/@defillama/sdk/build/index.js:5:5)');
    assert.strictEqual(result[2].trim(), 'at myFunc (/app/index.js:10:5)');
  });

  test('should not use logger message as the first node_modules message', () => {
    const stack = `Error: failed
    at myFunc (/app/index.js:10:5)
    at Logger.log (/app/node_modules/winston/log.js:10:5)
    at Object.<anonymous> (/app/node_modules/axios/lib/core/Axios.js:15:5)`;

    const result = getStackMessage(stack);

    assert.strictEqual(result.length, 2);
    // The logger message is skipped when finding firstNMStackMessage
    assert.strictEqual(result[0].trim(), 'at Object.<anonymous> (/app/node_modules/axios/lib/core/Axios.js:15:5)');
    assert.strictEqual(result[1].trim(), 'at myFunc (/app/index.js:10:5)');
  });

});
