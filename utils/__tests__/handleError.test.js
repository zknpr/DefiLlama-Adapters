const test = require('node:test');
const assert = require('node:assert');
const handleError = require('../handleError');

test('handleError prints axios error message when response.data.message exists', () => {
  let logOutput = [];
  const originalLog = console.log;
  console.log = (...args) => {
    logOutput.push(args.join(' '));
  };

  let errorOutput = [];
  const originalError = console.error;
  console.error = (...args) => {
    errorOutput.push(args.join(' '));
  };

  let exitCode = null;
  const originalExit = process.exit;
  process.exit = (code) => {
    exitCode = code;
  };

  const error = new Error('Request failed with status code 400');
  error.response = {
    data: {
      message: 'Invalid request parameters'
    }
  };

  try {
    handleError(error);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
  }

  const logsJoined = logOutput.join('\n');
  assert.ok(logsJoined.includes('Axios:  Invalid request parameters'), 'Should print axios error message');
  assert.strictEqual(exitCode, 1, 'Should exit with code 1');
});

test('handleError does not print axios error when response.data.message is missing', () => {
  let logOutput = [];
  const originalLog = console.log;
  console.log = (...args) => {
    logOutput.push(args.join(' '));
  };

  let errorOutput = [];
  const originalError = console.error;
  console.error = (...args) => {
    errorOutput.push(args.join(' '));
  };

  let exitCode = null;
  const originalExit = process.exit;
  process.exit = (code) => {
    exitCode = code;
  };

  const error = new Error('Generic error without axios response');

  try {
    handleError(error);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
  }

  const logsJoined = logOutput.join('\n');
  assert.ok(!logsJoined.includes('Axios:'), 'Should not print axios error message');
  assert.strictEqual(exitCode, 1, 'Should exit with code 1');
});
