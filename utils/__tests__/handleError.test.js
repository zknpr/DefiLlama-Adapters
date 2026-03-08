const { test, describe, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert')
const handleError = require('../handleError')

describe('handleError', () => {
  let originalConsoleLog
  let originalConsoleError
  let originalProcessExit
  let consoleLogCalls = []
  let consoleErrorCalls = []
  let processExitCalls = []

  beforeEach(() => {
    // Save originals
    originalConsoleLog = console.log
    originalConsoleError = console.error
    originalProcessExit = process.exit

    // Reset calls
    consoleLogCalls = []
    consoleErrorCalls = []
    processExitCalls = []

    // Mock functions
    console.log = (...args) => consoleLogCalls.push(args)
    console.error = (...args) => consoleErrorCalls.push(args)
    process.exit = (code) => processExitCalls.push(code)
  })

  afterEach(() => {
    // Restore originals
    console.log = originalConsoleLog
    console.error = originalConsoleError
    process.exit = originalProcessExit
  })

  test('should handle regular Error', () => {
    const error = new Error('Test error')
    error.stack = 'Error: Test error\n    at testFunction (/app/test.js:1:1)'
    handleError(error)

    assert.strictEqual(consoleLogCalls[0][1], '------ ERROR ------')
    assert.strictEqual(consoleErrorCalls.length, 1)
    assert.strictEqual(consoleErrorCalls[0][0], 'Error: Test error')
    assert.strictEqual(processExitCalls[0], 1)

    // Check truncated error stack output
    assert.strictEqual(consoleLogCalls[1][0], 'Truncated error stack:')
    assert.ok(consoleLogCalls[2][0].includes('at testFunction'))
  })

  test('should handle GraphQL error with chain info', () => {
    const error = new Error('GraphQL error')
    error.stack = 'Error: GraphQL error\n    at testFunction (/node_modules/graphql-request/index.js:1:1)'
    error.response = {
      errors: [{ message: 'Graphql failure 1' }, { message: 'Graphql failure 2' }]
    }
    error.chain = 'ethereum'
    handleError(error)

    assert.strictEqual(consoleErrorCalls[0][0], 'On chain ethereum:Graphql failure 1\nGraphql failure 2')
    assert.strictEqual(processExitCalls[0], 1)
  })

  test('should handle GraphQL error without chain info', () => {
    const error = new Error('GraphQL error')
    error.stack = 'Error: GraphQL error\n    at testFunction (/node_modules/graphql-request/index.js:1:1)'
    error.response = {
      errors: [{ message: 'Graphql failure 1' }]
    }
    handleError(error)

    assert.strictEqual(consoleErrorCalls[0][0], 'On chain Unknown:Graphql failure 1')
  })

  test('should handle Axios error', () => {
    const error = new Error('Axios error')
    error.stack = 'Error: Axios error\n    at testFunction (/app/test.js:1:1)'
    error.response = {
      data: { message: 'Axios response failure' }
    }
    handleError(error)

    assert.strictEqual(consoleErrorCalls[0][0], 'Error: Axios error')
    const axiosLogCall = consoleLogCalls.find(call => call[0] === 'Axios: ')
    assert.ok(axiosLogCall)
    assert.strictEqual(axiosLogCall[1], 'Axios response failure')
  })

  test('should filter out node_modules and node:internal from stack', () => {
    const error = new Error('Stack test')
    error.stack = `Error: Stack test
    at testFunction (/app/test.js:1:1)
    at Object.<anonymous> (/node_modules/defillama/index.js:1:1)
    at someModule (/node_modules/some-module/index.js:1:1)
    at internalFunction (node:internal/modules/cjs/loader:1:1)`

    handleError(error)

    const stackLog = consoleLogCalls[2][0]
    assert.ok(stackLog.includes('/node_modules/some-module/index.js')) // Includes first node_module not defillama
    assert.ok(stackLog.includes('/app/test.js')) // Includes actual app code
    assert.ok(!stackLog.includes('node:internal')) // Filters out node:internal
  })

  test('should return empty stack for checkExportKeys', () => {
    const error = new Error('checkExportKeys error')
    error.stack = `Error: checkExportKeys error
    at checkExportKeys (/app/test.js:1:1)`

    handleError(error)

    // Check that 'Truncated error stack:' was not logged
    const stackLogCall = consoleLogCalls.find(call => call[0] === 'Truncated error stack:')
    assert.strictEqual(stackLogCall, undefined)
  })

  test('should handle missing error.stack gracefully', () => {
    const error = new Error('No stack error')
    error.stack = undefined

    handleError(error)

    assert.strictEqual(consoleErrorCalls[0][0], 'Error: No stack error')
    const stackLogCall = consoleLogCalls.find(call => call[0] === 'Truncated error stack:')
    assert.strictEqual(stackLogCall, undefined)
  })
})
