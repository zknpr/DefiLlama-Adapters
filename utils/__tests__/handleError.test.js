const { test } = require('node:test')
const assert = require('node:assert')
const { getStackMessage } = require('../handleError')

test('getStackMessage - handles undefined/null/empty stack', () => {
  assert.deepStrictEqual(getStackMessage(undefined), [])
  assert.deepStrictEqual(getStackMessage(null), [])
  assert.deepStrictEqual(getStackMessage(''), [])
})

test('getStackMessage - ignores checkExportKeys error', () => {
  const stack = `Error
    at checkExportKeys (/app/test.js:100:1)
    at main (/app/index.js:1:1)`
  assert.deepStrictEqual(getStackMessage(stack), [])
})

test('getStackMessage - handles basic stack correctly', () => {
  const stack = `Error: Cannot find module
    at Object.<anonymous> (/app/index.js:5:1)
    at Module._compile (node:internal/modules/cjs/loader:1000:1)`

  const expected = [
    undefined, // No node_modules
    '    at Object.<anonymous> (/app/index.js:5:1)'
  ]
  assert.deepStrictEqual(getStackMessage(stack), expected)
})

test('getStackMessage - filters internal messages', () => {
  const stack = `Error: Something went wrong
    at myFunc (/app/myCode.js:10:5)
    at node:internal/process/task_queues:96:5
    at main (/app/index.js:5:3)`

  const expected = [
    undefined,
    '    at myFunc (/app/myCode.js:10:5)',
    '    at main (/app/index.js:5:3)'
  ]
  assert.deepStrictEqual(getStackMessage(stack), expected)
})

test('getStackMessage - includes first node_modules trace that is not logger', () => {
  const stack = `Error: API error
    at log (/app/node_modules/logger/index.js:5:1)
    at request (/app/node_modules/axios/index.js:10:1)
    at localFunc (/app/index.js:10:1)
    at node:internal/process/task_queues:96:5`

  const expected = [
    '    at request (/app/node_modules/axios/index.js:10:1)',
    '    at localFunc (/app/index.js:10:1)'
  ]
  assert.deepStrictEqual(getStackMessage(stack), expected)
})

test('getStackMessage - treats defillama node_modules as local module', () => {
  const stack = `Error: API error
    at log (/app/node_modules/logger/index.js:5:1)
    at request (/app/node_modules/axios/index.js:10:1)
    at defillama_request (/app/node_modules/defillama/api.js:2:1)
    at localFunc (/app/index.js:10:1)
    at node:internal/process/task_queues:96:5`

  const expected = [
    '    at request (/app/node_modules/axios/index.js:10:1)',
    '    at defillama_request (/app/node_modules/defillama/api.js:2:1)',
    '    at localFunc (/app/index.js:10:1)'
  ]
  assert.deepStrictEqual(getStackMessage(stack), expected)
})

test('getStackMessage - removes error message lines', () => {
  const stack = `Error: Some message
Some other context
    at Object.<anonymous> (/app/index.js:5:1)`

  const expected = [
    undefined,
    '    at Object.<anonymous> (/app/index.js:5:1)'
  ]
  assert.deepStrictEqual(getStackMessage(stack), expected)
})
