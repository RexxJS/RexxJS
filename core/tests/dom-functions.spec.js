/**
 * DOM Functions Tests - Unified ELEMENT() Function
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { domFunctions } = require('../src/dom-functions');
const { JSDOM } = require('jsdom');

describe('DOM Functions - ELEMENT()', () => {
  let dom;
  let element;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="container">
        <button id="button1" class="btn">Button 1</button>
        <input type="text" id="input1" value="initial value" />
        <form id="form1">
          <input type="text" name="field1" value="value1" />
        </form>
        <select id="select1">
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
        </select>
      </div>
    `);
    global.document = dom.window.document;
    global.window = dom.window;
    global.Event = dom.window.Event;
    global.FormData = dom.window.FormData;
    element = domFunctions.ELEMENT;
  });

  afterEach(() => {
    global.document = undefined;
    global.window = undefined;
    global.Event = undefined;
    global.FormData = undefined;
  });

  describe('ELEMENT - Selector Operations', () => {
    it('should check if an element exists', () => {
      expect(element({ selector: '#button1' })).toBeTruthy();
      expect(element({ selector: '#non-existent' })).toBeFalsy();
    });

    it('should count the number of elements', () => {
      expect(element({ selector: '.btn', operation: 'count' })).toBe(1);
    });

    it('should get the text content of an element', () => {
      expect(element({ selector: '#button1', operation: 'text' })).toBe('Button 1');
    });

    it('should get the value of an input element', () => {
      expect(element({ selector: '#input1', operation: 'value' })).toBe('initial value');
    });

    it('should set the value of an input element', () => {
      element({ selector: '#input1', operation: 'value', arg4: 'new value' });
      expect(document.querySelector('#input1').value).toBe('new value');
    });

    it('should get an attribute of an element', () => {
      expect(element({ selector: '#button1', operation: 'attribute', arg3: 'id' })).toBe('button1');
    });

    it('should check if an element has a class', () => {
      expect(element({ selector: '#button1', operation: 'has_class', arg3: 'btn' })).toBe(true);
    });

    it('should serialize a form', () => {
      const result = element({ selector: '#form1', operation: 'serialize' });
      expect(JSON.parse(result)).toEqual({ field1: 'value1' });
    });

    it('should get the name of an element', () => {
      expect(element({ selector: '#form1', operation: 'name' })).toBe(''); // form has no name
      document.querySelector('#input1').name = 'test-input';
      expect(element({ selector: '#input1', operation: 'name' })).toBe('test-input');
    });

    it('should get the id of an element', () => {
      expect(element({ selector: '.btn', operation: 'id' })).toBe('button1');
    });

    it('should get the class of an element', () => {
      expect(element({ selector: '#button1', operation: 'class' })).toBe('btn');
    });

    it('should get a dataset attribute of an element', () => {
      document.querySelector('#button1').dataset.test = 'test-value';
      expect(element({ selector: '#button1', operation: 'dataset', arg3: 'test' })).toBe('test-value');
    });

    it('should set a dataset attribute of an element', () => {
      element({ selector: '#button1', operation: 'dataset', arg3: 'test', arg4: 'new-value' });
      expect(document.querySelector('#button1').dataset.test).toBe('new-value');
    });

    it('should return empty string for dataset of non-existent element', () => {
        expect(element({ selector: '#non-existent', operation: 'dataset', arg3: 'test' })).toBe('');
    });

    it('should return empty string for attribute of non-existent element', () => {
        expect(element({ selector: '#non-existent', operation: 'attribute', arg3: 'id' })).toBe('');
    });

    it('should return empty object for serialize on non-form element', () => {
        expect(element({ selector: '#button1', operation: 'serialize' })).toBe('{}');
    });

    it('should throw error for unknown operation', () => {
        expect(() => {
            element({ selector: '#button1', operation: 'unknown' });
        }).toThrow('Unknown selector operation: unknown');
    });

    it('should throw error if selector is missing', () => {
        expect(() => {
            element({ operation: 'exists' });
        }).toThrow('selector parameter is required');
    });

    it('should check if an element is visible', () => {
        const visibleButton = document.createElement('button');
        visibleButton.id = 'visibleButton';
        document.body.appendChild(visibleButton);
        Object.defineProperty(visibleButton, 'offsetParent', {
            get: () => document.body,
        });
        expect(element({ selector: '#visibleButton', operation: 'visible' })).toBe(true);

        const invisibleButton = document.createElement('button');
        invisibleButton.id = 'invisibleButton';
        document.body.appendChild(invisibleButton);
        Object.defineProperty(invisibleButton, 'offsetParent', {
            get: () => null,
        });
        expect(element({ selector: '#invisibleButton', operation: 'visible' })).toBe(false);
    });
  });

  describe('ELEMENT - Click operation', () => {
    it('should click an element', () => {
      const button = document.querySelector('#button1');
      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });
      element({ selector: '#button1', operation: 'click' });
      expect(clicked).toBe(true);
    });

    it('should throw an error if element is not found', () => {
        expect(() => {
            element({ selector: '#non-existent', operation: 'click' });
        }).toThrow('Element not found: #non-existent');
    });
  });

  describe('ELEMENT - Type operation', () => {
    it('should type text into an input element', () => {
      element({ selector: '#input1', operation: 'type', arg3: 'new value' });
      expect(document.querySelector('#input1').value).toBe('new value');
    });
  });

  describe('ELEMENT - Set operation', () => {
    it('should set a property of an element', () => {
      element({ selector: '#button1', operation: 'set', arg3: 'disabled', arg4: true });
      expect(document.querySelector('#button1').disabled).toBe(true);
    });
  });

  describe('ELEMENT - Class manipulation', () => {
    it('ADD_CLASS should add a class to an element', () => {
      element({ selector: '#button1', operation: 'class', arg3: 'add', arg4: 'new-class' });
      expect(document.querySelector('#button1').classList.contains('new-class')).toBe(true);
    });

    it('REMOVE_CLASS should remove a class from an element', () => {
      document.querySelector('#button1').classList.add('new-class');
      element({ selector: '#button1', operation: 'class', arg3: 'remove', arg4: 'new-class' });
      expect(document.querySelector('#button1').classList.contains('new-class')).toBe(false);
    });
  });

  describe('ELEMENT - Style operation', () => {
    it('should set a style property of an element', () => {
      element({ selector: '#button1', operation: 'style', arg3: 'color', arg4: 'red' });
      expect(document.querySelector('#button1').style.color).toBe('red');
    });
  });

  describe('ELEMENT - Wait operation', () => {
    it('should wait for an element to appear', async () => {
        const promise = element({ selector: '#new-element', operation: 'wait', arg3: 100 });
        setTimeout(() => {
            const newElement = document.createElement('div');
            newElement.id = 'new-element';
            Object.defineProperty(newElement, 'offsetParent', {
                get: () => document.body
            });
            document.body.appendChild(newElement);
        }, 50);
        await expect(promise).resolves.toBeTruthy();
    });

    it('should time out if element does not appear', async () => {
        await expect(element({ selector: '#new-element', operation: 'wait', arg3: 100 })).resolves.toBeFalsy();
    }, 10000);
  });

  describe('ELEMENT - Wait/Sleep utility operations', () => {
    it('should wait for a specified amount of time', async () => {
      const start = Date.now();
      await element({ selector: 'wait', operation: 'sleep', arg3: 100 });
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(95);
    });
  });

  describe('ELEMENT - Select option', () => {
    it('should select an option in a select element', () => {
      element({ selector: '#select1', operation: 'value', arg4: 'opt2' });
      expect(document.querySelector('#select1').value).toBe('opt2');
    });
  });

  describe('ELEMENT - Sleep utility operation', () => {
    it('should sleep for a specified amount of time', async () => {
      const start = Date.now();
      await element({ selector: 'sleep', arg3: 100 });
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });
});
