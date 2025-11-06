/**
 * DOM Pipeline Functions for RexxJS
 *
 * Specialized functions for extracting and filtering DOM elements in pipelines.
 * These functions work with the unified |> pipeline operator.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const domPipelineFunctions = {
  /**
   * Filter elements by attribute value
   *
   * @param {Object} params - Named parameters
   * @param {Array|Object} params.elements - Array-like object of elements
   * @param {string} params.attrName - Attribute name to filter by
   * @param {string} params.attrValue - Attribute value to match
   * @returns {Object} Array-like object with matching elements
   */
  'FILTER_BY_ATTR': function(params) {
    const { elements, attrName, attrValue } = params;

    if (!elements || typeof elements !== 'object') {
      return { length: 0 };
    }

    // Handle array-like object from ELEMENT "all"
    const result = { length: 0 };
    let count = 0;

    // Get the element manager if available (for mock environment or test)
    const elementManager = this && this.domElementManager ? this.domElementManager : null;

    for (let i = 1; i <= elements.length; i++) {
      const elemRef = elements[i];
      if (!elemRef) continue;

      try {
        let elem;
        if (typeof elemRef === 'string' && elemRef.includes('dom_element')) {
          // It's a reference, get actual element
          elem = elementManager ? elementManager.getElementFromRef(elemRef) : null;
        } else {
          // Direct element
          elem = elemRef;
        }

        if (elem) {
          const attr = elem.getAttribute ? elem.getAttribute(attrName) : null;
          if (attr === attrValue) {
            result[++count] = elemRef;
          }
        }
      } catch (e) {
        // Skip elements that can't be accessed
      }
    }

    result.length = count;
    return result;
  },

  /**
   * Filter elements by class name
   *
   * @param {Object} params - Named parameters
   * @param {Array|Object} params.elements - Array-like object of elements
   * @param {string} params.className - Class name to filter by
   * @returns {Object} Array-like object with matching elements
   */
  'FILTER_BY_CLASS': function(params) {
    const { elements, className } = params;

    if (!elements || typeof elements !== 'object') {
      return { length: 0 };
    }

    const result = { length: 0 };
    let count = 0;
    const elementManager = this && this.domElementManager ? this.domElementManager : null;

    for (let i = 1; i <= elements.length; i++) {
      const elemRef = elements[i];
      if (!elemRef) continue;

      try {
        let elem;
        if (typeof elemRef === 'string' && elemRef.includes('dom_element')) {
          elem = elementManager ? elementManager.getElementFromRef(elemRef) : null;
        } else {
          elem = elemRef;
        }

        if (elem && elem.classList) {
          if (elem.classList.contains(className)) {
            result[++count] = elemRef;
          }
        }
      } catch (e) {
        // Skip elements that can't be accessed
      }
    }

    result.length = count;
    return result;
  },

  /**
   * Extract .value from form elements
   * Returns REXX stem array for pipeline processing
   *
   * @param {Object} params - Named parameters
   * @param {Array|Object} params.elements - Array-like object of elements
   * @returns {Object} REXX stem array with .0 = count, .1 = value, etc.
   */
  'GET_VALUES': function(params) {
    const { elements } = params;

    const result = { 0: 0 };  // Start with count = 0

    if (!elements || typeof elements !== 'object') {
      return result;
    }

    let count = 0;
    const elementManager = this && this.domElementManager ? this.domElementManager : null;

    for (let i = 1; i <= elements.length; i++) {
      const elemRef = elements[i];
      if (!elemRef) continue;

      try {
        let elem;
        if (typeof elemRef === 'string' && elemRef.includes('dom_element')) {
          elem = elementManager ? elementManager.getElementFromRef(elemRef) : null;
        } else {
          elem = elemRef;
        }

        if (elem && elem.value !== undefined) {
          result[++count] = String(elem.value);
        }
      } catch (e) {
        // Skip elements that can't be accessed
      }
    }

    result[0] = count;
    return result;
  },

  /**
   * Extract text content from elements
   * Returns REXX stem array for pipeline processing
   *
   * @param {Object} params - Named parameters
   * @param {Array|Object} params.elements - Array-like object of elements
   * @returns {Object} REXX stem array with .0 = count, .1 = text, etc.
   */
  'GET_TEXT': function(params) {
    const { elements } = params;

    const result = { 0: 0 };  // Start with count = 0

    if (!elements || typeof elements !== 'object') {
      return result;
    }

    let count = 0;
    const elementManager = this && this.domElementManager ? this.domElementManager : null;

    for (let i = 1; i <= elements.length; i++) {
      const elemRef = elements[i];
      if (!elemRef) continue;

      try {
        let elem;
        if (typeof elemRef === 'string' && elemRef.includes('dom_element')) {
          elem = elementManager ? elementManager.getElementFromRef(elemRef) : null;
        } else {
          elem = elemRef;
        }

        if (elem && elem.textContent !== undefined) {
          result[++count] = String(elem.textContent || '');
        }
      } catch (e) {
        // Skip elements that can't be accessed
      }
    }

    result[0] = count;
    return result;
  },

  /**
   * Extract attribute values from elements
   * Returns REXX stem array for pipeline processing
   *
   * @param {Object} params - Named parameters
   * @param {Array|Object} params.elements - Array-like object of elements
   * @param {string} params.attrName - Attribute name to extract
   * @returns {Object} REXX stem array with .0 = count, .1 = attr, etc.
   */
  'GET_ATTRS': function(params) {
    const { elements, attrName } = params;

    const result = { 0: 0 };  // Start with count = 0

    if (!elements || typeof elements !== 'object') {
      return result;
    }

    if (!attrName) {
      throw new Error('GET_ATTRS requires attrName parameter');
    }

    let count = 0;
    const elementManager = this && this.domElementManager ? this.domElementManager : null;

    for (let i = 1; i <= elements.length; i++) {
      const elemRef = elements[i];
      if (!elemRef) continue;

      try {
        let elem;
        if (typeof elemRef === 'string' && elemRef.includes('dom_element')) {
          elem = elementManager ? elementManager.getElementFromRef(elemRef) : null;
        } else {
          elem = elemRef;
        }

        if (elem && elem.getAttribute) {
          const value = elem.getAttribute(attrName);
          if (value !== null) {
            result[++count] = String(value);
          }
        }
      } catch (e) {
        // Skip elements that can't be accessed
      }
    }

    result[0] = count;
    return result;
  }
};

// Sibling converters for unified parameter model
function FILTER_BY_ATTR_positional_args_to_named_param_map(...args) {
  return { elements: args[0], attrName: args[1], attrValue: args[2] };
}

function FILTER_BY_CLASS_positional_args_to_named_param_map(...args) {
  return { elements: args[0], className: args[1] };
}

function GET_VALUES_positional_args_to_named_param_map(...args) {
  return { elements: args[0] };
}

function GET_TEXT_positional_args_to_named_param_map(...args) {
  return { elements: args[0] };
}

function GET_ATTRS_positional_args_to_named_param_map(...args) {
  return { elements: args[0], attrName: args[1] };
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    domPipelineFunctions,
    FILTER_BY_ATTR_positional_args_to_named_param_map,
    FILTER_BY_CLASS_positional_args_to_named_param_map,
    GET_VALUES_positional_args_to_named_param_map,
    GET_TEXT_positional_args_to_named_param_map,
    GET_ATTRS_positional_args_to_named_param_map
  };
} else if (typeof window !== 'undefined') {
  window.domPipelineFunctions = domPipelineFunctions;
  window.FILTER_BY_ATTR_positional_args_to_named_param_map = FILTER_BY_ATTR_positional_args_to_named_param_map;
  window.FILTER_BY_CLASS_positional_args_to_named_param_map = FILTER_BY_CLASS_positional_args_to_named_param_map;
  window.GET_VALUES_positional_args_to_named_param_map = GET_VALUES_positional_args_to_named_param_map;
  window.GET_TEXT_positional_args_to_named_param_map = GET_TEXT_positional_args_to_named_param_map;
  window.GET_ATTRS_positional_args_to_named_param_map = GET_ATTRS_positional_args_to_named_param_map;
}
