const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');
const { domPipelineFunctions } = require('../src/dom-pipeline-functions');
const { arrayFunctions } = require('../src/array-functions');

describe('DOM Pipeline Functions', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });

  describe('REXX Stem Array Format with JOIN', () => {
    test('JOIN should convert REXX stem array with multiple elements', () => {
      // Simulate a REXX stem array
      const arr = { 0: 3, 1: 'apple', 2: 'banana', 3: 'cherry' };
      const result = arrayFunctions.JOIN(arr, ',');
      expect(result).toBe('apple,banana,cherry');
    });

    test('JOIN should work with empty REXX stem array', () => {
      const arr = { 0: 0 };
      const result = arrayFunctions.JOIN(arr, ',');
      expect(result).toBe('');
    });

    test('JOIN should work with single element REXX stem array', () => {
      const arr = { 0: 1, 1: 'single' };
      const result = arrayFunctions.JOIN(arr, ',');
      expect(result).toBe('single');
    });

    test('JOIN should work with JavaScript arrays (backward compat)', () => {
      const arr = ['a', 'b', 'c'];
      const result = arrayFunctions.JOIN(arr, '-');
      expect(result).toBe('a-b-c');
    });

    test('JOIN with different separators', () => {
      const arr = { 0: 3, 1: 'one', 2: 'two', 3: 'three' };
      expect(arrayFunctions.JOIN(arr, ' | ')).toBe('one | two | three');
      expect(arrayFunctions.JOIN(arr, '/')).toBe('one/two/three');
      expect(arrayFunctions.JOIN(arr, '')).toBe('onetwothree');
    });
  });

  describe('GET_VALUES returns REXX stem array', () => {
    test('GET_VALUES should return object with .0 property for count', () => {
      // Create mock elements
      const mockElements = {
        0: 0,
        length: 2,
        1: { value: 'val1' },
        2: { value: 'val2' }
      };

      const result = domPipelineFunctions.GET_VALUES.call({}, { elements: mockElements });
      expect(result[0]).toBe(2);
      expect(result[1]).toBe('val1');
      expect(result[2]).toBe('val2');
    });

    test('GET_VALUES should work with empty element set', () => {
      const mockElements = { 0: 0, length: 0 };
      const result = domPipelineFunctions.GET_VALUES.call({}, { elements: mockElements });
      expect(result[0]).toBe(0);
    });
  });

  describe('GET_TEXT returns REXX stem array', () => {
    test('GET_TEXT should extract text content into stem array', () => {
      const mockElements = {
        0: 0,
        length: 2,
        1: { textContent: 'Hello' },
        2: { textContent: 'World' }
      };

      const result = domPipelineFunctions.GET_TEXT.call({}, { elements: mockElements });
      expect(result[0]).toBe(2);
      expect(result[1]).toBe('Hello');
      expect(result[2]).toBe('World');
    });
  });

  describe('GET_ATTRS returns REXX stem array', () => {
    test('GET_ATTRS should extract attribute values into stem array', () => {
      const mockElements = {
        0: 0,
        length: 2,
        1: { getAttribute: () => 'id-1' },
        2: { getAttribute: () => 'id-2' }
      };

      const result = domPipelineFunctions.GET_ATTRS.call({}, {
        elements: mockElements,
        attrName: 'data-id'
      });
      expect(result[0]).toBe(2);
      expect(result[1]).toBe('id-1');
      expect(result[2]).toBe('id-2');
    });
  });

  describe('Pipeline Integration (unit level)', () => {
    test('Complete pipeline: GET_VALUES -> JOIN', () => {
      // Simulate: GET_VALUES |> JOIN(",")
      const mockElements = {
        length: 3,
        1: { value: 'apple' },
        2: { value: 'banana' },
        3: { value: 'cherry' }
      };

      const values = domPipelineFunctions.GET_VALUES.call({}, { elements: mockElements });
      const joined = arrayFunctions.JOIN(values, ',');

      expect(joined).toBe('apple,banana,cherry');
    });

    test('GET_TEXT stem array can be passed to JOIN', () => {
      const mockElements = {
        length: 2,
        1: { textContent: 'First' },
        2: { textContent: 'Second' }
      };

      const texts = domPipelineFunctions.GET_TEXT.call({}, { elements: mockElements });
      const joined = arrayFunctions.JOIN(texts, ' AND ');

      expect(joined).toBe('First AND Second');
    });

    test('GET_ATTRS stem array can be passed to JOIN', () => {
      const mockElements = {
        length: 3,
        1: { getAttribute: () => 'x' },
        2: { getAttribute: () => 'y' },
        3: { getAttribute: () => 'z' }
      };

      const attrs = domPipelineFunctions.GET_ATTRS.call({}, {
        elements: mockElements,
        attrName: 'coord'
      });
      const joined = arrayFunctions.JOIN(attrs, ':');

      expect(joined).toBe('x:y:z');
    });
  });
});
