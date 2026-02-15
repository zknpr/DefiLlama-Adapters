
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { sliceIntoChunks } = require('./utils/sliceIntoChunks');

describe('sliceIntoChunks', () => {
  it('should split array into chunks of specified size', () => {
    const input = [1, 2, 3, 4, 5];
    const chunkSize = 2;
    const expected = [[1, 2], [3, 4], [5]];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });

  it('should split array correctly when length is a multiple of chunk size', () => {
    const input = [1, 2, 3, 4];
    const chunkSize = 2;
    const expected = [[1, 2], [3, 4]];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });

  it('should use default chunk size of 100', () => {
    const input = Array.from({ length: 150 }, (_, i) => i);
    const result = sliceIntoChunks(input);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].length, 100);
    assert.strictEqual(result[1].length, 50);
  });

  it('should return empty array when input is empty', () => {
    const input = [];
    const chunkSize = 2;
    const expected = [];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });

  it('should return single chunk when chunk size is larger than array length', () => {
    const input = [1, 2];
    const chunkSize = 5;
    const expected = [[1, 2]];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });

  it('should return single chunk when chunk size equals array length', () => {
    const input = [1, 2];
    const chunkSize = 2;
    const expected = [[1, 2]];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });

  it('should return chunks of size 1 when chunk size is 1', () => {
    const input = [1, 2];
    const chunkSize = 1;
    const expected = [[1], [2]];
    const result = sliceIntoChunks(input, chunkSize);
    assert.deepStrictEqual(result, expected);
  });
});
