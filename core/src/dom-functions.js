/**
 * DOM functions for REXX interpreter - Browser automation and manipulation
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const domFunctions = {
  /**
   * Unified ELEMENT() function - Single API for all DOM operations
   *
   * Usage patterns:
   *   ELEMENT(selector)                      - Get single element by selector
   *   ELEMENT(selector, "all")               - Get all elements matching selector
   *   ELEMENT(element, "text")               - Get element text
   *   ELEMENT(element, "text", value)        - Set element text
   *   ELEMENT(element, "attr", name)         - Get attribute
   *   ELEMENT(element, "attr", name, value)  - Set attribute
   *   ELEMENT(element, "style", prop)        - Get style property
   *   ELEMENT(element, "style", prop, val)   - Set style property
   *   ELEMENT(element, "class", op, name)    - Add/remove/toggle class
   *   ELEMENT(element, "click")              - Click element
   *   ELEMENT(element, "parent")             - Get parent element
   *   ELEMENT(element, "children")           - Get children elements
   */
  'ELEMENT': function(params) {
    try {
      // Handle both positional and named parameters
      let selector, operation, arg3, arg4;

      if (Array.isArray(params)) {
        // Positional parameters as array
        selector = params[0];
        operation = (params[1] || '').toString().toLowerCase();
        arg3 = params[2];
        arg4 = params[3];
      } else if (typeof params === 'object' && params !== null) {
        // Named parameters in object
        // Handle both selector= and element= parameter names
        // If both element= and selector= provided, element is context, selector is query
        if (params.element && params.selector) {
          selector = params.element;
          arg3 = params.selector;  // Move selector to arg3 for context-based query
        } else {
          selector = params.selector || params.element || params.selector_or_element;
        }
        operation = (params.operation || '').toString().toLowerCase();
        // Only use arg3/arg4 if not already set above
        if (typeof params.arg3 !== 'undefined' && !arg3) arg3 = params.arg3;
        if (typeof params.arg4 !== 'undefined' && !arg4) arg4 = params.arg4;
      } else {
        throw new Error('ELEMENT requires parameters as array or object');
      }

      // Handle special utility operations that don't need selectors
      if (selector === 'sleep' || selector === 'wait') {
        if (operation === 'sleep' || operation === '' || !operation) {
          const duration = arg3 !== undefined ? parseInt(arg3) : 100;
          return new Promise(resolve => setTimeout(() => resolve(true), duration));
        }
      }

      // Handle create operation (creates new DOM elements)
      if (operation === 'create') {
        const tag = selector || arg3;
        if (!tag) {
          throw new Error('create operation requires a tag parameter');
        }
        try {
          const element = document.createElement(tag);

          // Set any additional attributes - arg4 and params object may contain them
          if (typeof arg3 === 'object' && arg3 !== null) {
            // If arg3 is an object, use it for attributes
            for (const [key, value] of Object.entries(arg3)) {
              if (key !== 'tag' && key !== 'text') {
                element.setAttribute(key, value);
              }
            }
            if (arg3.text) {
              element.textContent = arg3.text;
            }
          } else if (params && typeof params === 'object') {
            // Use params object for attributes
            for (const [key, value] of Object.entries(params)) {
              if (key !== 'selector' && key !== 'operation' && key !== 'text' && key !== 'tag') {
                element.setAttribute(key, value);
              }
            }
            if (params.text) {
              element.textContent = params.text;
            }
          }

          // Create a reference for the new element
          if (this && this.domElementManager) {
            const elementRef = `dom_element_${this.domElementManager.nextElementId++}`;
            this.domElementManager.elementCache.set(elementRef, element);
            return elementRef;
          }
          return element; // Direct element for testing
        } catch (error) {
          throw new Error(`create failed: ${error.message}`);
        }
      }

      if (!selector) {
        throw new Error('selector parameter is required');
      }

      // Check if we're in a mock environment (Node.js tests) - do this first before any DOM APIs
      const isInMockEnvironment = this && this.domElementManager && typeof document === 'undefined';

      // Selector-based operations (first param is a selector string starting with # or . or contains space for multi-selector)
      if (typeof selector === 'string' && (selector.startsWith('#') || selector.startsWith('.') || selector.includes(' '))) {
        // Use mock DOM manager for Node.js test environment
        if (isInMockEnvironment) {
          switch (operation) {
            case '':
            case 'get':
            case 'first': {
              try {
                return this.domElementManager.getElement(selector);
              } catch (error) {
                if (error.message.includes('Element not found')) {
                  return null; // Return null for non-existent elements
                }
                throw error;
              }
            }
            case 'all': {
              // Mock environment: for "all", just return array of refs for now
              // In a real browser this would query multiple elements
              try {
                const refs = [];
                // For now, return a single element wrapped in array for basic support
                const ref = this.domElementManager.getElement(selector);
                refs.push(ref);
                return { length: refs.length, 1: ref };
              } catch (error) {
                return { length: 0 };
              }
            }
            case 'count': {
              try {
                this.domElementManager.getElement(selector);
                return 1; // Mock returns 1 if found
              } catch {
                return 0; // 0 if not found
              }
            }
            case 'exists': {
              try {
                this.domElementManager.getElement(selector);
                return true;
              } catch {
                return false;
              }
            }
            case 'text': {
              try {
                const ref = this.domElementManager.getElement(selector);
                const elem = this.domElementManager.elementCache.get(ref);
                return elem ? (elem.textContent || elem.value || '') : '';
              } catch {
                return '';
              }
            }
            case 'value': {
              try {
                const ref = this.domElementManager.getElement(selector);
                const elem = this.domElementManager.elementCache.get(ref);
                if (!elem) {
                  if (arg4 !== undefined) throw new Error(`Element not found: ${selector}`);
                  return '';
                }
                // If arg4 is provided, set the value
                if (arg4 !== undefined) {
                  elem.value = arg4;
                  return arg4;
                }
                return elem.value || '';
              } catch (error) {
                if (arg4 !== undefined) throw error;
                return '';
              }
            }
            case 'visible': {
              try {
                this.domElementManager.getElement(selector);
                return true; // Mock always returns true if element exists
              } catch {
                return false;
              }
            }
            case 'wait': {
              const timeout = arg3 ? parseInt(arg3) : 5000;
              return new Promise((resolve) => {
                const startTime = Date.now();
                const check = () => {
                  try {
                    return resolve(this.domElementManager.getElement(selector));
                  } catch {
                    if (Date.now() - startTime > timeout) {
                      return resolve(null);
                    }
                    setTimeout(check, 100);
                  }
                };
                check();
              });
            }
            // Element reference operations in mock environment
            case 'stale': {
              // When called with element= parameter in mock environment
              try {
                return this.domElementManager.isStale(selector);
              } catch {
                return true; // Consider stale if there's an error
              }
            }
            case 'click': {
              // When called with element= parameter in mock environment
              try {
                this.domElementManager.clickElement(selector);
                return selector;  // Return element for chaining
              } catch {
                throw new Error(`click operation failed: Element not found`);
              }
            }
            case 'type': {
              // When called with element= parameter in mock environment
              try {
                this.domElementManager.typeInElement(selector, arg3 || '');
                return selector;  // Return element for chaining
              } catch {
                throw new Error(`type operation failed: Element not found`);
              }
            }
            default:
              throw new Error(`Unsupported operation "${operation}" for selector "${selector}"`);
          }
        }

        // Browser environment - use DOM APIs
        if (typeof document === 'undefined') {
          // In Node test environment without JSDOM, avoid crashing; return null or wait-resolve null
          if (operation === 'wait') {
            return new Promise((resolve) => resolve(null));
          }
          return null;
        }

        const elements = document.querySelectorAll(selector);
        // Only use first element by default (index 0) - arg3/arg4 are operation-specific parameters
        const index = 0;

        switch (operation) {
          case '':
          case 'get':
          case 'first': {
            const elem = document.querySelector(selector);
            if (!elem) return null; // Return null for non-existent elements
            // If domElementManager is available, create element reference; otherwise return element directly
            if (this && this.domElementManager) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, elem);
              return ref;
            }
            return elem; // Direct element for testing
          }
          case 'all': {
            const result = { length: elements.length };
            if (this && this.domElementManager) {
              elements.forEach((el, i) => {
                const ref = `dom_element_${this.domElementManager.nextElementId++}`;
                this.domElementManager.elementCache.set(ref, el);
                result[i + 1] = ref;
              });
            } else {
              // For testing, store elements directly
              elements.forEach((el, i) => {
                result[i + 1] = el;
              });
            }
            return result;
          }
          case 'wait': {
            const timeout = arg3 ? parseInt(arg3) : 5000;
            return new Promise((resolve) => {
              const startTime = Date.now();
              const check = () => {
                const elem = typeof document !== 'undefined' ? document.querySelector(selector) : null;
                if (elem && elem.offsetParent !== null) {
                  // If domElementManager is available, create element reference; otherwise return element directly
                  if (this && this.domElementManager) {
                    const ref = `dom_element_${this.domElementManager.nextElementId++}`;
                    this.domElementManager.elementCache.set(ref, elem);
                    resolve(ref);
                  } else {
                    resolve(elem); // Direct element for testing
                  }
                  return;
                }
                if (Date.now() - startTime > timeout) {
                  resolve(null); // Return null on timeout
                }
                setTimeout(check, 100);
              };
              check();
            });
          }
          // Selector-based query operations (return values, not element refs)
          case 'count':
            return elements.length;
          case 'exists':
            return elements.length > index;
          case 'visible':
            return elements.length > index && elements[index].offsetParent !== null;
          case 'text':
            return elements.length > index ? elements[index].textContent || '' : '';
          case 'value': {
            if (elements.length <= index) {
              if (arg4 !== undefined) throw new Error(`Element not found: ${selector}`);
              return '';
            }
            // If arg4 is provided, set the value
            if (arg4 !== undefined) {
              elements[index].value = arg4;
              return arg4;
            }
            return elements[index].value || '';
          }
          case 'name':
            return elements.length > index ? elements[index].name || '' : '';
          case 'id':
            return elements.length > index ? elements[index].id || '' : '';
          case 'class_simple':  // Simple class getter - not used, kept for reference
            return elements.length > index ? elements[index].className || '' : '';
          case 'has_class': {
            if (!arg3) return false;
            return elements.length > index && elements[index].classList.contains(arg3);
          }
          case 'attribute': {
            if (!arg3) return '';
            if (elements.length <= index) return '';
            return elements[index].getAttribute(arg3) || '';
          }
          case 'dataset': {
            if (!arg3) return '';
            if (elements.length <= index) {
              if (arg4 !== undefined) throw new Error(`Element not found: ${selector}`);
              return '';
            }
            // If arg4 is provided, set the dataset attribute
            if (arg4 !== undefined) {
              elements[index].dataset[arg3] = arg4;
              return arg4;
            }
            return elements[index].dataset[arg3] || '';
          }
          case 'serialize': {
            if (elements.length > index && elements[index].tagName === 'FORM') {
              const formData = new FormData(elements[index]);
              const result = {};
              for (const [key, value] of formData.entries()) {
                result[key] = value;
              }
              return JSON.stringify(result);
            }
            return '{}';
          }
          case 'click': {
            if (elements.length <= index) throw new Error(`Element not found: ${selector}`);
            elements[index].click();
            // Return selector (or element reference) for chaining in pipelines
            if (this && this.domElementManager) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, elements[index]);
              return ref;
            }
            return elements[index];
          }
          case 'type': {
            if (elements.length <= index) throw new Error(`Element not found: ${selector}`);
            elements[index].value = arg3 || '';
            elements[index].dispatchEvent(new Event('input', { bubbles: true }));
            elements[index].dispatchEvent(new Event('change', { bubbles: true }));
            // Return selector (or element reference) for chaining in pipelines
            if (this && this.domElementManager) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, elements[index]);
              return ref;
            }
            return elements[index];
          }
          case 'set': {
            if (elements.length <= index) throw new Error(`Element not found: ${selector}`);
            const prop = arg3;
            const value = arg4;
            elements[index][prop] = value;
            // Return selector (or element reference) for chaining in pipelines
            if (this && this.domElementManager) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, elements[index]);
              return ref;
            }
            return elements[index];
          }
          case 'style': {
            if (elements.length <= index) throw new Error(`Element not found: ${selector}`);
            const prop = arg3;
            const value = arg4;
            elements[index].style[prop] = value;
            // Return selector (or element reference) for chaining in pipelines
            if (this && this.domElementManager) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, elements[index]);
              return ref;
            }
            return elements[index];
          }
          case 'class': {
            const operation2 = arg3 ? arg3.toString().toLowerCase() : 'get';
            const className = arg4;
            if (elements.length <= index) {
              if (operation2 === 'get') return '';
              if (operation2 === 'add' || operation2 === 'remove' || operation2 === 'toggle' || operation2 === 'has') {
                throw new Error(`Element not found: ${selector}`);
              }
              return '';
            }
            switch (operation2) {
              case 'add':
                if (!className) throw new Error('className is required');
                elements[index].classList.add(className);
                // Return element for chaining
                if (this && this.domElementManager) {
                  const ref = `dom_element_${this.domElementManager.nextElementId++}`;
                  this.domElementManager.elementCache.set(ref, elements[index]);
                  return ref;
                }
                return elements[index];
              case 'remove':
                if (!className) throw new Error('className is required');
                elements[index].classList.remove(className);
                // Return element for chaining
                if (this && this.domElementManager) {
                  const ref = `dom_element_${this.domElementManager.nextElementId++}`;
                  this.domElementManager.elementCache.set(ref, elements[index]);
                  return ref;
                }
                return elements[index];
              case 'toggle':
                if (!className) throw new Error('className is required');
                elements[index].classList.toggle(className);
                // Return element for chaining
                if (this && this.domElementManager) {
                  const ref = `dom_element_${this.domElementManager.nextElementId++}`;
                  this.domElementManager.elementCache.set(ref, elements[index]);
                  return ref;
                }
                return elements[index];
              case 'has':
                if (!className) throw new Error('className is required');
                return elements[index].classList.contains(className);
              case 'get':
              default:
                return elements[index].className || '';
            }
          }
          default:
            throw new Error(`Unknown selector operation: ${operation}`);
        }
      }

      // Element-based operations (first param is an element reference)
      // Special handling for "stale" operation - check before trying to get element
      if (operation === 'stale' || operation === 'isstale') {
        if (isInMockEnvironment && this.domElementManager) {
          // In mock environment, use domElementManager
          try {
            return this.domElementManager.isStale(selector);
          } catch {
            return true; // Consider stale if there's an error
          }
        } else {
          // In browser environment, check if element is in the DOM
          try {
            const elem = selector.toString().includes('dom_element')
              ? this.domElementManager?.getElementFromRef(selector)
              : selector;
            return !elem || !document.contains(elem) ? true : false;
          } catch (e) {
            return true; // Element is stale if we can't check it
          }
        }
      }

      const elem = selector.toString().includes('dom_element')
        ? this.domElementManager.getElementFromRef(selector)
        : selector;

      if (!elem) throw new Error('Invalid element reference or selector');

      switch (operation) {
        // Text operations
        case 'text':
        case 'textcontent': {
          if (arg3 !== undefined) {
            elem.textContent = arg3;
            return selector;  // Return element for chaining
          }
          return elem.textContent || '';
        }

        // Attribute operations
        case 'attr':
        case 'attribute': {
          if (arg4 !== undefined) {
            elem.setAttribute(arg3, arg4);
            return selector;  // Return element for chaining
          }
          if (arg3 === undefined) throw new Error('attr operation requires attribute name');
          return elem.getAttribute(arg3) || '';
        }

        // Style operations
        case 'style':
        case 'css': {
          if (arg4 !== undefined) {
            elem.style[arg3] = arg4;
            return selector;  // Return element for chaining
          }
          if (arg3 === undefined) throw new Error('style operation requires property name');
          return window.getComputedStyle(elem)[arg3] || '';
        }

        // Class operations
        case 'class': {
          const classOp = (arg3 || '').toLowerCase();
          const className = arg4 || arg3;
          if (classOp === 'add') {
            elem.classList.add(className);
            return selector;  // Return element for chaining
          } else if (classOp === 'remove') {
            elem.classList.remove(className);
            return selector;  // Return element for chaining
          } else if (classOp === 'toggle') {
            elem.classList.toggle(className);
            return selector;  // Return element for chaining
          } else if (classOp === 'has' || classOp === 'contains') {
            return elem.classList.contains(className);
          } else if (classOp === '' || classOp === 'get' || classOp === 'list') {
            return elem.className;
          }
          throw new Error(`Unknown class operation: ${classOp}`);
        }

        // Action operations
        case 'click': {
          elem.click();
          return selector;  // Return element for chaining
        }
        case 'type':
        case 'fill': {
          if (arg3 === undefined) throw new Error('type operation requires text parameter');
          elem.value = arg3;
          elem.dispatchEvent(new Event('input', { bubbles: true }));
          elem.dispatchEvent(new Event('change', { bubbles: true }));
          return selector;  // Return element for chaining
        }
        case 'focus': {
          elem.focus();
          return selector;  // Return element for chaining
        }
        case 'blur': {
          elem.blur();
          return selector;  // Return element for chaining
        }

        // Navigation operations
        case 'parent':
        case 'parentelement': {
          if (!elem.parentElement) throw new Error('Element has no parent');
          const ref = `dom_element_${this.domElementManager.nextElementId++}`;
          this.domElementManager.elementCache.set(ref, elem.parentElement);
          return ref;
        }
        case 'children': {
          // If a selector is provided in arg3, find matching child (like query)
          if (arg3 !== undefined) {
            const child = elem.querySelector(arg3);
            if (!child) throw new Error(`No child element found matching: ${arg3}`);
            const ref = `dom_element_${this.domElementManager.nextElementId++}`;
            this.domElementManager.elementCache.set(ref, child);
            return ref;
          }
          // Otherwise return all direct children
          const result = { length: elem.children.length };
          Array.from(elem.children).forEach((child, i) => {
            const ref = `dom_element_${this.domElementManager.nextElementId++}`;
            this.domElementManager.elementCache.set(ref, child);
            result[i + 1] = ref;
          });
          return result;
        }
        case 'next':
        case 'nextsibling': {
          const next = elem.nextElementSibling;
          if (!next) throw new Error('Element has no next sibling');
          const ref = `dom_element_${this.domElementManager.nextElementId++}`;
          this.domElementManager.elementCache.set(ref, next);
          return ref;
        }
        case 'prev':
        case 'previoussibling': {
          const prev = elem.previousElementSibling;
          if (!prev) throw new Error('Element has no previous sibling');
          const ref = `dom_element_${this.domElementManager.nextElementId++}`;
          this.domElementManager.elementCache.set(ref, prev);
          return ref;
        }
        case 'siblings': {
          const parent = elem.parentElement;
          if (!parent) throw new Error('Element has no parent');
          const result = { length: 0 };
          let count = 0;
          Array.from(parent.children).forEach((child) => {
            if (child !== elem) {
              const ref = `dom_element_${this.domElementManager.nextElementId++}`;
              this.domElementManager.elementCache.set(ref, child);
              result[++count] = ref;
            }
          });
          result.length = count;
          return result;
        }
        case 'query':
        case 'find': {
          if (arg3 === undefined) throw new Error('query operation requires selector');
          const child = elem.querySelector(arg3);
          if (!child) throw new Error(`No element found matching: ${arg3}`);
          const ref = `dom_element_${this.domElementManager.nextElementId++}`;
          this.domElementManager.elementCache.set(ref, child);
          return ref;
        }
        case 'queryall':
        case 'findall': {
          if (arg3 === undefined) throw new Error('queryall operation requires selector');
          const children = elem.querySelectorAll(arg3);
          const result = { length: children.length };
          children.forEach((child, i) => {
            const ref = `dom_element_${this.domElementManager.nextElementId++}`;
            this.domElementManager.elementCache.set(ref, child);
            result[i + 1] = ref;
          });
          return result;
        }

        // Property operations
        case 'tag':
        case 'tagname': {
          return elem.tagName.toLowerCase();
        }
        case 'id': {
          return elem.id || '';
        }
        case 'visible':
        case 'isvisible': {
          return elem.offsetParent !== null;
        }
        case 'bounds':
        case 'rect':
        case 'getBoundingClientRect': {
          const rect = elem.getBoundingClientRect();
          return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        }

        // Manipulation operations
        case 'append': {
          if (arg3 === undefined) throw new Error('append requires child element');
          const child = arg3.toString().includes('dom_element')
            ? this.domElementManager.getElementFromRef(arg3)
            : arg3;
          elem.appendChild(child);
          return selector;  // Return element for chaining
        }
        case 'prepend': {
          if (arg3 === undefined) throw new Error('prepend requires child element');
          const child = arg3.toString().includes('dom_element')
            ? this.domElementManager.getElementFromRef(arg3)
            : arg3;
          elem.insertBefore(child, elem.firstChild);
          return selector;  // Return element for chaining
        }
        case 'remove': {
          if (elem.parentNode) elem.parentNode.removeChild(elem);
          return selector;  // Return element for chaining (useful to know what was removed)
        }
        case 'clone': {
          const deep = arg3 === true || arg3 === 'true';
          const cloned = elem.cloneNode(deep);
          const ref = `dom_element_${this.domElementManager.nextElementId++}`;
          this.domElementManager.elementCache.set(ref, cloned);
          return ref;
        }

        case 'insert_before':
        case 'insertbefore': {
          if (arg3 === undefined) throw new Error('insert_before requires new element');
          const newElem = arg3.toString().includes('dom_element')
            ? this.domElementManager.getElementFromRef(arg3)
            : arg3;
          if (elem.parentNode) elem.parentNode.insertBefore(newElem, elem);
          return true;
        }

        case 'insert_after':
        case 'insertafter': {
          if (arg3 === undefined) throw new Error('insert_after requires new element');
          const newElem = arg3.toString().includes('dom_element')
            ? this.domElementManager.getElementFromRef(arg3)
            : arg3;
          if (elem.parentNode) {
            if (elem.nextSibling) {
              elem.parentNode.insertBefore(newElem, elem.nextSibling);
            } else {
              elem.parentNode.appendChild(newElem);
            }
          }
          return true;
        }

        case 'replace':
        case 'replacewith': {
          if (arg3 === undefined) throw new Error('replace requires new element');
          const newElem = arg3.toString().includes('dom_element')
            ? this.domElementManager.getElementFromRef(arg3)
            : arg3;
          if (elem.parentNode) elem.parentNode.replaceChild(newElem, elem);
          return true;
        }

        case 'on_click':
        case 'onclick': {
          if (arg3 === undefined) throw new Error('on_click requires handler');
          elem.addEventListener('click', () => {
            // Handler is a function reference - simplified for now
            if (window[arg3]) window[arg3]();
          });
          return true;
        }

        case 'on_event':
        case 'onevent': {
          if (arg3 === undefined) throw new Error('on_event requires event type');
          if (arg4 === undefined) throw new Error('on_event requires handler');
          elem.addEventListener(arg3, () => {
            if (window[arg4]) window[arg4]();
          });
          return true;
        }

        case 'trigger_event':
        case 'triggerevent': {
          if (arg3 === undefined) throw new Error('trigger_event requires event type');
          const eventType = arg3;
          let event;
          if (eventType === 'click') {
            event = new MouseEvent('click', { bubbles: true });
          } else {
            // Custom event with data
            event = new CustomEvent(eventType, {
              detail: arg4 ? JSON.parse(arg4) : {},
              bubbles: true
            });
          }
          elem.dispatchEvent(event);
          return true;
        }

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`ELEMENT failed: ${error.message}`);
    }
  },

  
  'SLEEP': async (params) => {
    const ms = (params && params.ms !== undefined) ? parseInt(params.ms) :
               (typeof params === 'number') ? params : 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return true;
  },
  


};

/**
 * Sibling function: Convert positional arguments to named parameter map for ELEMENT
 * ELEMENT(selector, operation, arg3, arg4) -> { selector, operation, arg3, arg4 }
 */
function ELEMENT_positional_args_to_named_param_map(...args) {
  return {
    selector: args[0],
    operation: args[1],
    arg3: args[2],
    arg4: args[3]
  };
}

// ELEMENT() is the unified API - no legacy DOM_* functions
const domOperations = {
  'ELEMENT': domFunctions['ELEMENT'],
  'SLEEP': domFunctions['SLEEP']
};

// domFunctionsOnly should be empty now - ELEMENT is only in operations
// If any other functions are in domFunctions, they would go here
// But since we removed all legacy DOM_* functions, this is now empty
const domFunctionsOnly = {};

// Named parameter metadata - only ELEMENT() and SLEEP()
const domFunctionMetadata = {
  'namedParameters_for_ELEMENT': () => ['selector', 'element', 'operation', 'arg3', 'arg4'],
  'namedParameters_for_SLEEP': () => ['duration']
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    domFunctions,  // Keep for backward compatibility
    functions: domFunctionsOnly,
    operations: domOperations,
    functionMetadata: domFunctionMetadata,
    ELEMENT_positional_args_to_named_param_map
  };
} else if (typeof window !== 'undefined') {
  window.domFunctions = domFunctions;
  window.domFunctionsOnly = domFunctionsOnly;
  window.domOperations = domOperations;
  window.domFunctionMetadata = domFunctionMetadata;
  window.ELEMENT_positional_args_to_named_param_map = ELEMENT_positional_args_to_named_param_map;
}
