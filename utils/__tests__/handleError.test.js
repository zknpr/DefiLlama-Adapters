const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const handleError = require('../handleError');

describe('handleError', () => {
  let originalConsoleLog;
  let originalConsoleError;
  let originalProcessExit;

  let consoleErrorOutput;
  let exitCode;

  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;

    consoleErrorOutput = [];
    exitCode = null;

    console.log = () => {};
    console.error = (...args) => {
      consoleErrorOutput.push(args.join(' '));
    };
    process.exit = (code) => {
      exitCode = code;
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  it('should parse and log graph error correctly with a defined chain', () => {
    const error = new Error('Graphql error');
    error.stack = 'Error: Graphql error\n    at someFunction (graphql-request/src/index.ts:1:1)';
    error.chain = 'ethereum';
    error.response = {
      errors: [
        { message: 'First graph error' },
        { message: 'Second graph error' }
      ]
    };

    handleError(error);

    assert.strictEqual(consoleErrorOutput.length, 1);
    assert.strictEqual(
      consoleErrorOutput[0],
      'On chain ethereum:First graph error\nSecond graph error'
    );
    assert.strictEqual(exitCode, 1);
  });

  it('should parse and log graph error correctly with Unknown chain', () => {
    const error = new Error('Graphql error');
    error.stack = 'Error: Graphql error\n    at someFunction (graphql-request/src/index.ts:1:1)';
    error.response = {
      errors: [
        { message: 'First graph error' }
      ]
    };

    handleError(error);

    assert.strictEqual(consoleErrorOutput.length, 1);
    assert.strictEqual(
      consoleErrorOutput[0],
      'On chain Unknown:First graph error'
    );
    assert.strictEqual(exitCode, 1);
  });

  it('should log standard error if not a graph error', () => {
    const error = new Error('Standard error message');

    handleError(error);

    assert.strictEqual(consoleErrorOutput.length, 1);
    assert.strictEqual(consoleErrorOutput[0], 'Error: Standard error message');
    assert.strictEqual(exitCode, 1);
  });
});
