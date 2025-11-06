/**
 * Array and Object manipulation functions for REXX interpreter
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

const arrayFunctions = {
  'ARRAY_GET': (array, key) => {
    if (typeof array === 'object' && array !== null) {
      if (Array.isArray(array)) {
        // Handle REXX 1-based indexing for arrays
        const numKey = Number(key);
        if (!isNaN(numKey) && Number.isInteger(numKey) && numKey >= 1) {
          // Convert REXX 1-based index to JavaScript 0-based  
          return array[numKey - 1];
        } else if (numKey === 0) {
          // Index 0 is treated as property on the array object
          return array[key];
        } else {
          // Non-numeric key, treat as property
          return array[key];
        }
      } else {
        // For objects, use key directly
        return array[key];
      }
    }
    return '';
  },

  'ARRAY_SET': (array, key, value) => {
    if (typeof array === 'object' && array !== null) {
      if (Array.isArray(array)) {
        // Handle REXX 1-based indexing for arrays
        // Convert REXX index (1-based) to JavaScript index (0-based) for numeric keys
        const numKey = Number(key);
        if (!isNaN(numKey) && Number.isInteger(numKey) && numKey >= 1) {
          // Convert REXX 1-based index to JavaScript 0-based
          array[numKey - 1] = value;
        } else if (numKey === 0) {
          // Index 0 is treated as property on the array object
          array[key] = value;
        } else {
          // Non-numeric key, treat as property
          array[key] = value;
        }
      } else {
        // For objects, use key directly
        array[key] = value;
      }
      return array;
    }
    return {};
  },

  'ARRAY_LENGTH': (array) => {
    if (Array.isArray(array)) {
      return array.length;
    } else if (typeof array === 'object' && array !== null) {
      return Object.keys(array).length;
    } else if (typeof array === 'string') {
      try {
        const parsed = JSON.parse(array);
        if (Array.isArray(parsed)) {
          return parsed.length;
        } else if (typeof parsed === 'object' && parsed !== null) {
          return Object.keys(parsed).length;
        }
        return 0;
      } catch (e) {
        // If JSON parsing fails, it might be a stringified array like "[object Object]"
        // Try to detect if it looks like an array representation
        if (array.startsWith('[') && array.endsWith(']')) {
          // Count commas + 1 as rough estimate
          const commas = (array.match(/,/g) || []).length;
          return commas + 1;
        }
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    }
    return 0;
  },

  'ARRAY_PUSH': (array, ...items) => {
    let arr;
    if (Array.isArray(array)) {
      arr = [...array];
    } else if (typeof array === 'string') {
      try {
        arr = JSON.parse(String(array));
      } catch (e) {
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    } else {
      throw new Error('First argument must be an array or JSON string');
    }
    arr.push(...items);
    return arr;
  },

  'ARRAY_POP': (array) => {
    let arr;
    if (Array.isArray(array)) {
      arr = [...array];
    } else if (typeof array === 'string') {
      try {
        arr = JSON.parse(String(array));
      } catch (e) {
        throw new Error(`Invalid array JSON: ${e.message}`);
      }
    } else {
      throw new Error('Input must be an array or JSON string');
    }
    return arr.pop(); // Returns undefined for empty array (correct behavior)
  },

  'ARRAY_SHIFT': (array) => {
    try {
      let arr = Array.isArray(array) ? [...array] : JSON.parse(String(array));
      return arr.shift();
    } catch (e) {
      return null;
    }
  },

  'ARRAY_UNSHIFT': (array, ...items) => {
    try {
      let arr = Array.isArray(array) ? [...array] : JSON.parse(String(array));
      arr.unshift(...items);
      return arr;
    } catch (e) {
      return [...items];
    }
  },

  'SPLIT': (string, separator = ' ') => {
    try {
      if (separator === '') {
        // Split into individual characters
        return string.split('');
      }
      return string.split(separator);
    } catch (e) {
      return [string];
    }
  },

  'MODERN_SPLIT': (string, separator = ' ') => {
    try {
      // Strip quotes and process escape sequences for both parameters
      let processedString = string;
      let processedSeparator = separator;
      
      // Strip quotes if present
      if (typeof processedString === 'string' && 
          ((processedString.startsWith('"') && processedString.endsWith('"')) ||
           (processedString.startsWith("'") && processedString.endsWith("'")))) {
        processedString = processedString.substring(1, processedString.length - 1);
      }
      
      if (typeof processedSeparator === 'string' && 
          ((processedSeparator.startsWith('"') && processedSeparator.endsWith('"')) ||
           (processedSeparator.startsWith("'") && processedSeparator.endsWith("'")))) {
        processedSeparator = processedSeparator.substring(1, processedSeparator.length - 1);
      }
      
      // Process escape sequences
      processedString = processedString.replace(/\\n/g, '\n');
      processedString = processedString.replace(/\\t/g, '\t');
      processedString = processedString.replace(/\\r/g, '\r');
      processedString = processedString.replace(/\\\\/g, '\\');
      
      processedSeparator = processedSeparator.replace(/\\n/g, '\n');
      processedSeparator = processedSeparator.replace(/\\t/g, '\t');
      processedSeparator = processedSeparator.replace(/\\r/g, '\r');
      processedSeparator = processedSeparator.replace(/\\\\/g, '\\');
      
      if (processedSeparator === '') {
        // Split into individual characters
        return processedString.split('');
      }
      
      // Use a regex to split by one or more occurrences of the separator
      const regex = new RegExp(processedSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+');
      return processedString.split(regex).filter(part => part !== '');
    } catch (e) {
      return [string];
    }
  },

  'JOIN': (array, separator = '') => {
    try {
      if (Array.isArray(array)) {
        return array.join(separator);
      }

      // Handle REXX stem arrays (have .0 property with count)
      if (typeof array === 'object' && array !== null && array.hasOwnProperty(0)) {
        const count = parseInt(array[0]);
        if (!isNaN(count)) {
          if (count === 0) {
            return '';  // Empty REXX array
          }
          const values = [];
          for (let i = 1; i <= count; i++) {
            if (array[i] !== undefined) {
              values.push(String(array[i]));
            }
          }
          if (values.length > 0) {
            return values.join(separator);
          }
        }
      }

      return String(array);
    } catch (e) {
      return '';
    }
  },

  'ARRAY_SLICE': (array, start, end) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const startIndex = parseInt(start) || 0;
      const endIndex = end !== undefined ? parseInt(end) : undefined;
      return arr.slice(startIndex, endIndex);
    } catch (e) {
      return [];
    }
  },

  'ARRAY_CONCAT': (array1, array2) => {
    try {
      let arr1 = Array.isArray(array1) ? array1 : JSON.parse(String(array1));
      let arr2 = Array.isArray(array2) ? array2 : JSON.parse(String(array2));
      return arr1.concat(arr2);
    } catch (e) {
      return [];
    }
  },

  'ARRAY_REVERSE': (array) => {
    try {
      let arr = Array.isArray(array) ? [...array] : [...JSON.parse(String(array))];
      return arr.reverse();
    } catch (e) {
      return [];
    }
  },

  'ARRAY_SORT': (array, property, order = 'asc') => {
    try {
      let arr = Array.isArray(array) ? [...array] : [...JSON.parse(String(array))];
      
      // Backward compatibility: if property is 'asc' or 'desc', treat it as order for string array
      if (property === 'asc' || property === 'desc') {
        const sortOrder = property;
        return arr.sort((a, b) => {
          if (sortOrder === 'desc') {
            return String(b).localeCompare(String(a));
          }
          return String(a).localeCompare(String(b));
        });
      }
      
      // Check if this is an object array (array of objects)
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray && property) {
        // Object array sorting by property
        return arr.sort((a, b) => {
          if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
            return 0; // Keep original order for non-objects
          }
          
          const aValue = a[property];
          const bValue = b[property];
          
          // Handle undefined/null values (put them at the end)
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;
          
          // Numeric comparison if both values are numbers
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            if (order === 'desc') {
              return bNum - aNum;
            }
            return aNum - bNum;
          }
          
          // String comparison for everything else
          const aStr = String(aValue);
          const bStr = String(bValue);
          if (order === 'desc') {
            return bStr.localeCompare(aStr);
          }
          return aStr.localeCompare(bStr);
        });
      } else {
        // String array sorting (no property specified or not object array)
        // If property is specified but not object array, use it as order
        const sortOrder = property && (property === 'asc' || property === 'desc') ? property : order;
        return arr.sort((a, b) => {
          if (sortOrder === 'desc') {
            return String(b).localeCompare(String(a));
          }
          return String(a).localeCompare(String(b));
        });
      }
    } catch (e) {
      return [];
    }
  },

  'ARRAY_INCLUDES': (array, item) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return arr.includes(item);
    } catch (e) {
      return false;
    }
  },

  'ARRAY_INDEXOF': (array, item) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return arr.indexOf(item);
    } catch (e) {
      return -1;
    }
  },

  'ARRAY_MIN': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? Math.min(...numbers) : null;
    } catch (e) {
      return null;
    }
  },

  'ARRAY_MAX': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? Math.max(...numbers) : null;
    } catch (e) {
      return null;
    }
  },

  'ARRAY_SUM': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.reduce((sum, num) => sum + num, 0);
    } catch (e) {
      return 0;
    }
  },

  'ARRAY_AVERAGE': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const numbers = arr.map(Number).filter(n => !isNaN(n));
      return numbers.length ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
    } catch (e) {
      return 0;
    }
  },

  'ARRAY_FILTER': (array, filterExpression) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      // Simple filter for non-null/undefined/empty values if no filterExpression
      if (!filterExpression) {
        return arr.filter(item => item != null && item !== '');
      }
      
      // Check if filterExpression is a JavaScript-style callback (arrow function or function)
      const expr = filterExpression.trim();
      if (expr.includes('=>') || expr.startsWith('function')) {
        try {
          // Handle JavaScript-style callbacks like "x => x > 2" or "function(x) { return x > 2; }"
          let callbackFn;
          if (expr.includes('=>')) {
            // Arrow function
            callbackFn = Function(`return ${expr}`)();
          } else {
            // Regular function
            callbackFn = Function(`return ${expr}`)();
          }
          return arr.filter(callbackFn);
        } catch (e) {
          // If callback evaluation fails, fall through to other methods
        }
      }
      
      // Check if this is an object array (array of objects)
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray) {
        // Object array filtering
        return arr.filter(obj => {
          if (typeof obj !== 'object' || obj === null) return false;
          
          try {
            // If filterExpression is just a property name, extract that property (truthy values only)
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
              const propValue = obj[expr];
              return propValue != null && propValue !== '' && propValue !== false;
            }
            
            // Handle comparison expressions like "age >= 18", "name === 'Alice'"
            // Create a safe evaluation context with the object properties available
            let setupCode = '';
            for (const [key, value] of Object.entries(obj)) {
              if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                setupCode += `const ${key} = obj.${key};\n`;
              }
            }
            
            // Now evaluate the expression
            const fullCode = setupCode + `return ${expr}`;
            const result = Function('obj', fullCode)(obj);
            return !!result;
          } catch (e) {
            // If expression evaluation fails, filter out this object
            return false;
          }
        });
      } else {
        // String/primitive array - handle various filter types
        if (expr === 'truthy') {
          return arr.filter(item => item != null && item !== '' && item !== false && item !== 0);
        } else if (expr === 'falsy') {
          return arr.filter(item => !item || item === '' || item === false || item === 0);
        } else {
          // Try to evaluate as a simple expression with 'item' as the variable
          try {
            return arr.filter(item => {
              // Simple expressions like "item > 2", "item.includes('test')"
              const result = Function('item', `return ${expr}`)(item);
              return !!result;
            });
          } catch (e) {
            // If expression fails, try exact match
            return arr.filter(item => String(item) === String(expr));
          }
        }
      }
    } catch (e) {
      return [];
    }
  },

  'ARRAY_MAP': (array, mapExpression) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));

      // Simple identity mapping if no mapExpression
      if (!mapExpression) {
        return [...arr];
      }

      // Check if mapExpression is a JavaScript-style callback (arrow function or function)
      const expr = String(mapExpression).trim();
      if (expr.includes('=>') || expr.startsWith('function')) {
        try {
          // Handle JavaScript-style callbacks like "x => x * 2" or "function(x) { return x * 2; }"
          let callbackFn;
          if (expr.includes('=>')) {
            // Arrow function
            callbackFn = Function(`return ${expr}`)();
          } else {
            // Regular function
            callbackFn = Function(`return ${expr}`)();
          }
          return arr.map(callbackFn);
        } catch (e) {
          // If callback evaluation fails, fall through to other methods
        }
      }

      // Check if this is an object array (array of objects)
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray) {
        // Object array mapping
        return arr.map(obj => {
          if (typeof obj !== 'object' || obj === null) return obj;
          
          try {
            // If mapExpression is just a property name, extract that property
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(mapExpression.trim())) {
              return obj[mapExpression.trim()];
            }
            
            // Handle transformation expressions like "name + ' (' + age + ')'"
            const expr = mapExpression.trim();
            
            // Create a safe evaluation context with the object properties available
            let setupCode = '';
            for (const [key, value] of Object.entries(obj)) {
              if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                setupCode += `const ${key} = obj.${key};\n`;
              }
            }
            
            // Now evaluate the expression
            const fullCode = setupCode + `return ${expr}`;
            const result = Function('obj', fullCode)(obj);
            return result;
          } catch (e) {
            // If expression evaluation fails, return the original object
            return obj;
          }
        });
      } else {
        // String array - maintain backward compatibility
        // For string arrays, treat mapExpression as a simple transformation or property access
        if (mapExpression === 'toString') {
          return arr.map(item => String(item));
        } else if (mapExpression === 'toNumber') {
          return arr.map(item => Number(item));
        } else if (mapExpression === 'toUpperCase') {
          return arr.map(item => String(item).toUpperCase());
        } else if (mapExpression === 'toLowerCase') {
          return arr.map(item => String(item).toLowerCase());
        } else if (mapExpression === 'length') {
          return arr.map(item => String(item).length);
        } else {
          // Try to evaluate as a simple expression with 'item' as the variable
          try {
            return arr.map(item => {
              // Simple expressions like "item * 2", "item.toUpperCase()"
              const result = Function('item', `return ${mapExpression}`)(item);
              return result;
            });
          } catch (e) {
            // If expression fails, return identity
            return [...arr];
          }
        }
      }
    } catch (e) {
      return [];
    }
  },

  'ARRAY_FIND': (array, searchProperty, searchValue) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      // If only searchProperty provided (backward compatibility - item search)
      if (searchValue === undefined) {
        const item = searchProperty;
        const found = arr.find(element => element === item);
        return found !== undefined ? found : null;
      }
      
      // Check if this is an object array (array of objects)
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray) {
        // Object array search by property
        const found = arr.find(obj => {
          if (typeof obj !== 'object' || obj === null) return false;
          
          const objValue = obj[searchProperty];
          if (objValue === undefined || objValue === null) return false;
          
          // First try exact match (same type and value)
          if (objValue === searchValue) {
            return true;
          }
          
          // Then try type-specific comparisons
          if (typeof objValue === typeof searchValue) {
            return objValue === searchValue;
          }
          
          // Finally, string comparison for mixed types (but not for boolean vs string)
          // Avoid false matches like 'true' string matching true boolean
          if (typeof objValue === 'boolean' || typeof searchValue === 'boolean') {
            return false;
          }
          
          return String(objValue) === String(searchValue);
        });
        
        return found !== undefined ? found : null;
      } else {
        // String array - treat searchProperty as item to find, ignore searchValue
        const item = searchProperty;
        const found = arr.find(element => element === item);
        return found !== undefined ? found : null;
      }
    } catch (e) {
      return null;
    }
  },

  'ARRAY_UNIQUE': (array) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      return [...new Set(arr)];
    } catch (e) {
      return [];
    }
  },

  'ARRAY_FLATTEN': (array, depth = 1) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      const flattenDepth = parseInt(depth) || 1;
      return arr.flat(flattenDepth);
    } catch (e) {
      return [];
    }
  },

  // SQL-Style Functions for Object Arrays
  'SELECT': (array, columns, whereClause) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      // Check if this is an object array
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      if (!isObjectArray) {
        return arr; // Return as-is for non-object arrays
      }
      
      let filteredData = [...arr];
      
      // Apply WHERE clause if provided
      if (whereClause) {
        filteredData = filteredData.filter(obj => {
          if (typeof obj !== 'object' || obj === null) return false;
          
          try {
            // Create evaluation context with object properties
            let setupCode = '';
            for (const [key, value] of Object.entries(obj)) {
              if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                setupCode += `const ${key} = obj.${key};\n`;
              }
            }
            
            // Evaluate WHERE condition
            const fullCode = setupCode + `return ${whereClause}`;
            const result = Function('obj', fullCode)(obj);
            return !!result;
          } catch (e) {
            return false;
          }
        });
      }
      
      // Apply column selection if provided
      if (columns && columns !== '*') {
        const columnList = String(columns).split(',').map(col => col.trim());
        
        return filteredData.map(obj => {
          const selected = {};
          columnList.forEach(col => {
            if (obj.hasOwnProperty(col)) {
              selected[col] = obj[col];
            }
          });
          return selected;
        });
      }
      
      return filteredData;
    } catch (e) {
      return [];
    }
  },

  'GROUP_BY': (array, groupKey) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      // Check if this is an object array
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      if (!isObjectArray) {
        return {}; // Return empty object for non-object arrays
      }
      
      const grouped = {};
      
      arr.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          const keyValue = obj[String(groupKey)];
          const keyStr = String(keyValue);
          
          if (!grouped[keyStr]) {
            grouped[keyStr] = [];
          }
          grouped[keyStr].push(obj);
        }
      });
      
      return grouped;
    } catch (e) {
      return {};
    }
  },

  'ARRAY_JOIN': (array1, array2, key1, key2) => {
    try {
      let arr1 = Array.isArray(array1) ? array1 : JSON.parse(String(array1));
      let arr2 = Array.isArray(array2) ? array2 : JSON.parse(String(array2));
      
      // Check if both are object arrays
      const isObjectArray1 = arr1.length > 0 && typeof arr1[0] === 'object' && arr1[0] !== null && !Array.isArray(arr1[0]);
      const isObjectArray2 = arr2.length > 0 && typeof arr2[0] === 'object' && arr2[0] !== null && !Array.isArray(arr2[0]);
      
      if (!isObjectArray1 || !isObjectArray2) {
        return []; // Both arrays must be object arrays
      }
      
      const result = [];
      const joinKey1 = String(key1);
      const joinKey2 = String(key2 || key1); // Default to same key name
      
      // Inner join implementation
      arr1.forEach(obj1 => {
        if (typeof obj1 === 'object' && obj1 !== null) {
          const value1 = obj1[joinKey1];
          
          arr2.forEach(obj2 => {
            if (typeof obj2 === 'object' && obj2 !== null) {
              const value2 = obj2[joinKey2];
              
              // Check for match (string comparison for mixed types)
              if (String(value1) === String(value2)) {
                // Merge objects, with obj2 properties taking precedence on conflicts
                const merged = { ...obj1, ...obj2 };
                result.push(merged);
              }
            }
          });
        }
      });
      
      return result;
    } catch (e) {
      return [];
    }
  },

  'DISTINCT': (array, property) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      if (property) {
        // Distinct by property for object arrays - keep first occurrence of each unique value
        const seen = new Set();
        return arr.filter(obj => {
          if (typeof obj === 'object' && obj !== null) {
            const propValue = obj[String(property)];
            const key = String(propValue); // Convert to string for comparison
            
            if (seen.has(key)) {
              return false; // Skip duplicate
            }
            seen.add(key);
            return true; // Keep first occurrence
          }
          return true; // Keep non-objects as-is
        });
      } else {
        // Distinct values for simple arrays
        return [...new Set(arr)];
      }
    } catch (e) {
      return [];
    }
  },

  'ARRAY_REDUCE': (array, reduceExpression, initialValue = null) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      if (arr.length === 0) {
        return initialValue;
      }
      
      // Default behavior - sum for numeric arrays, concatenation for strings
      if (!reduceExpression) {
        // Try to determine if this is a numeric array
        const firstValid = arr.find(item => item != null && item !== '');
        if (firstValid != null && !isNaN(parseFloat(firstValid))) {
          return arr.reduce((acc, val) => {
            const num = parseFloat(val);
            return isNaN(num) ? acc : acc + num;
          }, initialValue || 0);
        } else {
          return arr.reduce((acc, val) => acc + String(val || ''), initialValue || '');
        }
      }
      
      // Check if this is an object array
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray) {
        // Object array reduction with expression
        return arr.reduce((accumulator, currentItem, currentIndex) => {
          if (typeof currentItem !== 'object' || currentItem === null) return accumulator;
          
          try {
            // Create a safe evaluation context
            let setupCode = '';
            setupCode += `const acc = accumulator;\n`;
            setupCode += `const item = currentItem;\n`;
            setupCode += `const index = currentIndex;\n`;
            
            // Add object properties as variables
            for (const [key, value] of Object.entries(currentItem)) {
              if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                setupCode += `const ${key} = currentItem.${key};\n`;
              }
            }
            
            // Evaluate the reduction expression
            const func = new Function('accumulator', 'currentItem', 'currentIndex', setupCode + `return ${reduceExpression};`);
            return func(accumulator, currentItem, currentIndex);
          } catch (e) {
            return accumulator;
          }
        }, initialValue);
      } else {
        // Simple array reduction with expression
        return arr.reduce((accumulator, currentItem, currentIndex) => {
          try {
            const func = new Function('acc', 'item', 'index', `return ${reduceExpression};`);
            return func(accumulator, currentItem, currentIndex);
          } catch (e) {
            return accumulator;
          }
        }, initialValue);
      }
    } catch (e) {
      return initialValue;
    }
  },

  'ARRAY_UNIQUE': (array, compareExpression) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      if (arr.length === 0) return [];
      
      // Simple unique for primitive arrays without expression
      if (!compareExpression) {
        return [...new Set(arr)];
      }
      
      // Check if this is an object array
      const isObjectArray = arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0]);
      
      if (isObjectArray) {
        // Object array unique comparison
        const seen = new Set();
        return arr.filter(obj => {
          if (typeof obj !== 'object' || obj === null) {
            const key = String(obj);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }
          
          try {
            // If compareExpression is just a property name, use that property for uniqueness
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(compareExpression.trim())) {
              const propValue = obj[compareExpression.trim()];
              const key = String(propValue);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }
            
            // Handle complex expressions for uniqueness
            let setupCode = '';
            for (const [key, value] of Object.entries(obj)) {
              if (key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                setupCode += `const ${key} = obj.${key};\n`;
              }
            }
            
            const func = new Function('obj', setupCode + `return ${compareExpression};`);
            const result = func(obj);
            const key = String(result);
            
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          } catch (e) {
            // Fallback to object string comparison
            const key = JSON.stringify(obj);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }
        });
      } else {
        // Simple array with custom comparison expression
        const seen = new Set();
        return arr.filter(item => {
          try {
            const func = new Function('item', `return ${compareExpression};`);
            const result = func(item);
            const key = String(result);
            
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          } catch (e) {
            const key = String(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }
        });
      }
    } catch (e) {
      return [];
    }
  },

  'ARRAY_FLATTEN': (array, depth = 1) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      
      const flattenArray = (arr, currentDepth) => {
        if (currentDepth <= 0) return arr;
        
        return arr.reduce((flat, item) => {
          if (Array.isArray(item)) {
            return flat.concat(flattenArray(item, currentDepth - 1));
          } else if (typeof item === 'object' && item !== null) {
            // For objects, we can flatten nested object arrays
            const nestedArrays = Object.values(item).filter(val => Array.isArray(val));
            if (nestedArrays.length > 0) {
              // If object contains arrays, extract and flatten those
              const flattened = nestedArrays.reduce((acc, nestedArr) => {
                return acc.concat(flattenArray(nestedArr, currentDepth - 1));
              }, []);
              return flat.concat(flattened);
            } else {
              return flat.concat(item);
            }
          } else {
            return flat.concat(item);
          }
        }, []);
      };
      
      const depthValue = parseInt(depth) || 1;
      return flattenArray(arr, depthValue);
    } catch (e) {
      return [];
    }
  },

  // === Phase 4 & 5: Advanced Mathematical and Analysis Functions ===

  'SUMMARY': (array, property) => {
    try {
      let arr = Array.isArray(array) ? array : JSON.parse(String(array));
      let values = [];
      
      if (property && arr.length > 0 && typeof arr[0] === 'object') {
        // Extract property values from object array
        values = arr.map(obj => {
          if (typeof obj === 'object' && obj !== null) {
            return parseFloat(obj[property]) || 0;
          }
          return 0;
        }).filter(val => !isNaN(val));
      } else {
        // Use array values directly
        values = arr.map(val => parseFloat(val)).filter(val => !isNaN(val));
      }
      
      if (values.length === 0) {
        return { count: 0, mean: 0, median: 0, mode: null, min: 0, max: 0, std: 0 };
      }
      
      // Calculate statistics
      const sorted = [...values].sort((a, b) => a - b);
      const count = values.length;
      const mean = values.reduce((sum, val) => sum + val, 0) / count;
      const median = count % 2 === 0 
        ? (sorted[count/2 - 1] + sorted[count/2]) / 2 
        : sorted[Math.floor(count/2)];
      
      // Calculate mode
      const freq = {};
      values.forEach(val => freq[val] = (freq[val] || 0) + 1);
      const maxFreq = Math.max(...Object.values(freq));
      const modes = Object.keys(freq).filter(val => freq[val] === maxFreq);
      const mode = modes.length === count ? null : parseFloat(modes[0]);
      
      // Calculate standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
      const std = Math.sqrt(variance);
      
      return {
        count,
        mean: Math.round(mean * 1000) / 1000,
        median,
        mode,
        min: sorted[0],
        max: sorted[count - 1],
        std: Math.round(std * 1000) / 1000
      };
    } catch (e) {
      return { count: 0, mean: 0, median: 0, mode: null, min: 0, max: 0, std: 0 };
    }
  },

  'REGRESSION': (xArray, yArray, type = 'linear') => {
    try {
      let xValues = Array.isArray(xArray) ? xArray : JSON.parse(String(xArray));
      let yValues = Array.isArray(yArray) ? yArray : JSON.parse(String(yArray));
      
      // Convert to numbers
      xValues = xValues.map(val => parseFloat(val)).filter(val => !isNaN(val));
      yValues = yValues.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      if (xValues.length !== yValues.length || xValues.length < 2) {
        return { error: 'Insufficient or mismatched data' };
      }
      
      const n = xValues.length;
      
      if (type === 'linear') {
        // Linear regression: y = mx + b
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumY = yValues.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const meanY = sumY / n;
        const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
        const residualSumSquares = yValues.reduce((sum, y, i) => {
          const predicted = slope * xValues[i] + intercept;
          return sum + Math.pow(y - predicted, 2);
        }, 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        
        // Calculate correlation coefficient
        const correlation = Math.sqrt(Math.abs(rSquared)) * (slope >= 0 ? 1 : -1);
        
        return {
          type: 'linear',
          slope: Math.round(slope * 1000) / 1000,
          intercept: Math.round(intercept * 1000) / 1000,
          rSquared: Math.round(rSquared * 1000) / 1000,
          correlation: Math.round(correlation * 1000) / 1000,
          equation: `y = ${Math.round(slope * 1000) / 1000}x + ${Math.round(intercept * 1000) / 1000}`
        };
      } else if (type === 'polynomial') {
        // Simple quadratic regression: y = ax² + bx + c
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
        const sumX3 = xValues.reduce((sum, x) => sum + x * x * x, 0);
        const sumX4 = xValues.reduce((sum, x) => sum + x * x * x * x, 0);
        const sumY = yValues.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumX2Y = xValues.reduce((sum, x, i) => sum + x * x * yValues[i], 0);
        
        // Simplified quadratic fit (approximation)
        const a = (n * sumX2Y - sumX2 * sumY) / (n * sumX4 - sumX2 * sumX2);
        const b = (sumXY - a * sumX3) / sumX2;
        const c = (sumY - a * sumX2 - b * sumX) / n;
        
        return {
          type: 'polynomial',
          coefficients: {
            a: Math.round(a * 1000) / 1000,
            b: Math.round(b * 1000) / 1000,
            c: Math.round(c * 1000) / 1000
          },
          equation: `y = ${Math.round(a * 1000) / 1000}x² + ${Math.round(b * 1000) / 1000}x + ${Math.round(c * 1000) / 1000}`
        };
      }
      
      return { error: 'Unsupported regression type' };
    } catch (e) {
      return { error: e.message };
    }
  },

  'FORECAST': (historicalData, periods = 1, method = 'linear') => {
    try {
      let data = Array.isArray(historicalData) ? historicalData : JSON.parse(String(historicalData));
      data = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      if (data.length < 2) {
        return { error: 'Insufficient historical data' };
      }
      
      const n = data.length;
      const numPeriods = parseInt(periods) || 1;
      
      if (method === 'linear') {
        // Linear trend forecasting
        const xValues = Array.from({length: n}, (_, i) => i + 1);
        const regression = arrayFunctions.REGRESSION(xValues, data, 'linear');
        
        if (regression.error) {
          return regression;
        }
        
        const forecast = [];
        for (let i = 1; i <= numPeriods; i++) {
          const x = n + i;
          const predicted = regression.slope * x + regression.intercept;
          forecast.push(Math.round(predicted * 100) / 100);
        }
        
        return {
          method: 'linear',
          forecast,
          confidence: regression.rSquared,
          trend: regression.slope > 0 ? 'increasing' : regression.slope < 0 ? 'decreasing' : 'stable'
        };
      } else if (method === 'mean') {
        // Simple mean-based forecasting
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const forecast = Array(numPeriods).fill(Math.round(mean * 100) / 100);
        
        return {
          method: 'mean',
          forecast,
          confidence: 0.5,
          trend: 'stable'
        };
      } else if (method === 'exponential') {
        // Simple exponential smoothing
        const alpha = 0.3; // Smoothing factor
        let smoothed = data[0];
        
        for (let i = 1; i < n; i++) {
          smoothed = alpha * data[i] + (1 - alpha) * smoothed;
        }
        
        const forecast = Array(numPeriods).fill(Math.round(smoothed * 100) / 100);
        
        return {
          method: 'exponential',
          forecast,
          confidence: 0.7,
          trend: 'smoothed'
        };
      } else if (method === 'moving_average') {
        // Moving average forecasting
        const window = Math.min(3, Math.floor(n / 2));
        const recent = data.slice(-window);
        const average = recent.reduce((sum, val) => sum + val, 0) / window;
        const forecast = Array(numPeriods).fill(Math.round(average * 100) / 100);
        
        return {
          method: 'moving_average',
          forecast,
          confidence: 0.6,
          trend: 'recent_average'
        };
      }
      
      return { error: 'Unsupported forecasting method' };
    } catch (e) {
      return { error: e.message };
    }
  },

  'VALIDATE_SCHEMA': (data, schema) => {
    try {
      let dataObj = typeof data === 'string' ? JSON.parse(data) : data;
      let schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
      
      const errors = [];
      
      const validateValue = (value, constraint, path = '') => {
        const { type, required, min, max, minLength, maxLength, enum: enumValues, pattern } = constraint;
        
        // Check required
        if (required && (value === undefined || value === null || value === '')) {
          errors.push(`${path}: Required field is missing`);
          return;
        }
        
        // Skip validation if value is undefined/null and not required
        if (!required && (value === undefined || value === null)) {
          return;
        }
        
        // Check type
        if (type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== type) {
            errors.push(`${path}: Expected type ${type}, got ${actualType}`);
            return;
          }
        }
        
        // Check numeric constraints
        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push(`${path}: Value ${value} is less than minimum ${min}`);
          }
          if (max !== undefined && value > max) {
            errors.push(`${path}: Value ${value} is greater than maximum ${max}`);
          }
        }
        
        // Check string constraints
        if (typeof value === 'string') {
          if (minLength !== undefined && value.length < minLength) {
            errors.push(`${path}: String length ${value.length} is less than minimum ${minLength}`);
          }
          if (maxLength !== undefined && value.length > maxLength) {
            errors.push(`${path}: String length ${value.length} is greater than maximum ${maxLength}`);
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            errors.push(`${path}: String does not match pattern ${pattern}`);
          }
        }
        
        // Check enum values
        if (enumValues && !enumValues.includes(value)) {
          errors.push(`${path}: Value ${value} is not in allowed values [${enumValues.join(', ')}]`);
        }
      };
      
      const validateObject = (obj, schema, path = '') => {
        if (typeof schema === 'object' && schema.properties) {
          // Object schema validation
          Object.keys(schema.properties).forEach(key => {
            const fieldPath = path ? `${path}.${key}` : key;
            validateValue(obj[key], schema.properties[key], fieldPath);
            
            // Recursive validation for nested objects
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              if (schema.properties[key].properties) {
                validateObject(obj[key], schema.properties[key], fieldPath);
              }
            }
          });
        } else if (Array.isArray(obj) && schema.items) {
          // Array validation
          obj.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            if (typeof schema.items === 'object' && schema.items.properties) {
              validateObject(item, schema.items, itemPath);
            } else {
              validateValue(item, schema.items, itemPath);
            }
          });
        }
      };
      
      if (Array.isArray(dataObj)) {
        // Validate array of objects
        dataObj.forEach((item, index) => {
          validateObject(item, schemaObj, `[${index}]`);
        });
      } else {
        // Validate single object
        validateObject(dataObj, schemaObj);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
    } catch (e) {
      return { valid: false, errors: [`Validation error: ${e.message}`] };
    }
  },

  'CHECK_TYPES': (data, expectedTypes) => {
    try {
      let dataValue = typeof data === 'string' ? JSON.parse(data) : data;
      let types = expectedTypes;
      
      // Handle different type specification formats
      if (typeof types === 'string') {
        if (types.includes(',')) {
          types = types.split(',').map(t => t.trim());
        } else {
          types = [types];
        }
      }
      
      if (!Array.isArray(types)) {
        types = [types];
      }
      
      const checkType = (value, allowedTypes) => {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        // Special handling for 'any' type
        if (allowedTypes.includes('any')) {
          return { valid: true, actualType };
        }
        
        // Check if actual type matches any allowed type
        const isValid = allowedTypes.some(type => {
          if (type === actualType) return true;
          
          // Special case: number strings
          if (type === 'number' && typeof value === 'string' && !isNaN(parseFloat(value))) {
            return true;
          }
          
          return false;
        });
        
        return { 
          valid: isValid, 
          actualType,
          expectedTypes: allowedTypes 
        };
      };
      
      if (Array.isArray(dataValue)) {
        // Check each element in array
        const results = dataValue.map((item, index) => {
          const result = checkType(item, types);
          return {
            index,
            value: item,
            ...result
          };
        });
        
        const allValid = results.every(r => r.valid);
        const invalidItems = results.filter(r => !r.valid);
        
        return {
          valid: allValid,
          arrayType: true,
          results,
          invalidItems: invalidItems.length > 0 ? invalidItems : undefined
        };
      } else {
        // Check single value
        const result = checkType(dataValue, types);
        return {
          valid: result.valid,
          value: dataValue,
          actualType: result.actualType,
          expectedTypes: result.expectedTypes
        };
      }
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },

  'WORD_FREQUENCY': (text) => {
    try {
      const textStr = String(text).toLowerCase();
      
      // Extract words (letters only, minimum 2 characters)
      const words = textStr.match(/[a-z]{2,}/g) || [];
      
      // Count frequency
      const frequency = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
      
      // Sort by frequency (descending)
      const sorted = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 50) // Limit to top 50 words
        .reduce((obj, [word, count]) => {
          obj[word] = count;
          return obj;
        }, {});
      
      return sorted;
    } catch (e) {
      return {};
    }
  },

  'SENTIMENT_ANALYSIS': (text) => {
    try {
      const textStr = String(text).toLowerCase();
      
      // Simple sentiment word lists
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
                            'awesome', 'brilliant', 'perfect', 'love', 'like', 'happy', 'pleased', 
                            'satisfied', 'delighted', 'impressed', 'outstanding', 'superb'];
      
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 
                            'upset', 'disappointed', 'frustrated', 'annoyed', 'poor', 'worst', 
                            'useless', 'stupid', 'ridiculous', 'pathetic', 'disgusting'];
      
      // Count positive and negative words
      const words = textStr.match(/[a-z]+/g) || [];
      let positiveCount = 0;
      let negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
      });
      
      const totalSentimentWords = positiveCount + negativeCount;
      
      if (totalSentimentWords === 0) {
        return { score: 0, confidence: 0, sentiment: 'neutral' };
      }
      
      // Calculate sentiment score (-1 to 1)
      const score = (positiveCount - negativeCount) / Math.max(words.length, 1);
      const confidence = totalSentimentWords / Math.max(words.length, 1);
      
      let sentiment = 'neutral';
      if (score > 0.1) sentiment = 'positive';
      else if (score < -0.1) sentiment = 'negative';
      
      return {
        score: Math.round(score * 1000) / 1000,
        confidence: Math.round(confidence * 1000) / 1000,
        sentiment,
        positiveWords: positiveCount,
        negativeWords: negativeCount,
        totalWords: words.length
      };
    } catch (e) {
      return { score: 0, confidence: 0, sentiment: 'neutral', error: e.message };
    }
  },

  'EXTRACT_KEYWORDS': (text, maxKeywords = 20) => {
    try {
      const textStr = String(text).toLowerCase();
      const maxKeys = parseInt(maxKeywords) || 20;
      
      // Common stop words to exclude
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
                                'for', 'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 
                                'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
                                'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 
                                'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
      
      // Extract words (minimum 3 characters, not stop words)
      const words = textStr.match(/[a-z]{3,}/g) || [];
      const filteredWords = words.filter(word => !stopWords.has(word));
      
      // Calculate frequency and scores
      const frequency = {};
      filteredWords.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
      
      // Calculate keyword scores (frequency + length bonus)
      const keywordList = Object.entries(frequency)
        .map(([word, count]) => ({
          keyword: word,
          frequency: count,
          score: count + (word.length > 6 ? 2 : word.length > 4 ? 1 : 0), // Length bonus
          relevance: Math.round((count / filteredWords.length) * 1000) / 1000
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxKeys);
      
      return { keywords: keywordList };
    } catch (e) {
      return { keywords: [] };
    }
  },

  'CORRELATION_MATRIX': (data, properties) => {
    try {
      let arr = Array.isArray(data) ? data : JSON.parse(String(data));
      let props = properties ? (Array.isArray(properties) ? properties : properties.split(',').map(p => p.trim())) : null;
      
      if (!props) {
        // Auto-detect numeric properties
        if (arr.length > 0 && typeof arr[0] === 'object') {
          props = Object.keys(arr[0]).filter(key => {
            return arr.some(obj => !isNaN(parseFloat(obj[key])));
          });
        } else {
          return { error: 'No numeric properties found' };
        }
      }
      
      // Extract numeric values for each property
      const propertyData = {};
      props.forEach(prop => {
        propertyData[prop] = arr.map(obj => parseFloat(obj[prop])).filter(val => !isNaN(val));
      });
      
      // Calculate correlation matrix
      const correlations = {};
      
      props.forEach(prop1 => {
        correlations[prop1] = {};
        props.forEach(prop2 => {
          if (prop1 === prop2) {
            correlations[prop1][prop2] = 1;
          } else {
            const x = propertyData[prop1];
            const y = propertyData[prop2];
            
            if (x.length === y.length && x.length > 1) {
              // Calculate Pearson correlation coefficient
              const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
              const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
              
              const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
              const denomX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0));
              const denomY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0));
              
              const correlation = denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
              correlations[prop1][prop2] = Math.round(correlation * 1000) / 1000;
            } else {
              correlations[prop1][prop2] = 0;
            }
          }
        });
      });
      
      return correlations;
    } catch (e) {
      return { error: e.message };
    }
  },

  // Aliases for pipe-friendly syntax
  'MAP': function(...args) {
    return arrayFunctions.ARRAY_MAP(...args);
  },

  'FILTER': function(...args) {
    return arrayFunctions.ARRAY_FILTER(...args);
  },

  'REDUCE': function(...args) {
    return arrayFunctions.ARRAY_REDUCE(...args);
  }

};

// Sibling converters for unified parameter model
// These transform positional arguments to named parameter maps

function ARRAY_GET_positional_args_to_named_param_map(...args) {
  return { array: args[0], key: args[1] };
}

function ARRAY_SET_positional_args_to_named_param_map(...args) {
  return { array: args[0], key: args[1], value: args[2] };
}

function ARRAY_LENGTH_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_FILTER_positional_args_to_named_param_map(...args) {
  return { array: args[0], filterExpression: args[1] };
}

function ARRAY_SORT_positional_args_to_named_param_map(...args) {
  return { array: args[0], property: args[1], order: args[2] };
}

function ARRAY_FIND_positional_args_to_named_param_map(...args) {
  return { array: args[0], searchProperty: args[1], searchValue: args[2] };
}

function ARRAY_MAP_positional_args_to_named_param_map(...args) {
  return { array: args[0], mapExpression: args[1] };
}

function ARRAY_JOIN_positional_args_to_named_param_map(...args) {
  return { array1: args[0], array2: args[1], key1: args[2], key2: args[3] };
}

function ARRAY_CONCAT_positional_args_to_named_param_map(...args) {
  return { array1: args[0], array2: args[1] };
}

function SPLIT_positional_args_to_named_param_map(...args) {
  return { string: args[0], separator: args[1] };
}

function JOIN_positional_args_to_named_param_map(...args) {
  return { array: args[0], separator: args[1] };
}

function ARRAY_SLICE_positional_args_to_named_param_map(...args) {
  return { array: args[0], start: args[1], end: args[2] };
}

// Additional array function converters
function ARRAY_PUSH_positional_args_to_named_param_map(...args) {
  return { array: args[0], items: args.slice(1) };
}

function ARRAY_POP_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_SHIFT_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_UNSHIFT_positional_args_to_named_param_map(...args) {
  return { array: args[0], items: args.slice(1) };
}

function ARRAY_REVERSE_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_INCLUDES_positional_args_to_named_param_map(...args) {
  return { array: args[0], item: args[1] };
}

function ARRAY_INDEXOF_positional_args_to_named_param_map(...args) {
  return { array: args[0], item: args[1] };
}

function ARRAY_MIN_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_MAX_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_SUM_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_AVERAGE_positional_args_to_named_param_map(...args) {
  return { array: args[0] };
}

function ARRAY_UNIQUE_positional_args_to_named_param_map(...args) {
  return { array: args[0], compareExpression: args[1] };
}

function ARRAY_FLATTEN_positional_args_to_named_param_map(...args) {
  return { array: args[0], depth: args[1] };
}

function SELECT_positional_args_to_named_param_map(...args) {
  return { array: args[0], columns: args[1], whereClause: args[2] };
}

function GROUP_BY_positional_args_to_named_param_map(...args) {
  return { array: args[0], groupKey: args[1] };
}

function DISTINCT_positional_args_to_named_param_map(...args) {
  return { array: args[0], property: args[1] };
}

function ARRAY_REDUCE_positional_args_to_named_param_map(...args) {
  return { array: args[0], reduceExpression: args[1], initialValue: args[2] };
}

function SUMMARY_positional_args_to_named_param_map(...args) {
  return { array: args[0], property: args[1] };
}

function REGRESSION_positional_args_to_named_param_map(...args) {
  return { xArray: args[0], yArray: args[1], type: args[2] };
}

function FORECAST_positional_args_to_named_param_map(...args) {
  return { historicalData: args[0], periods: args[1], method: args[2] };
}

function CORRELATION_MATRIX_positional_args_to_named_param_map(...args) {
  return { data: args[0], properties: args[1] };
}

function MAP_positional_args_to_named_param_map(...args) {
  return { array: args[0], mapExpression: args[1] };
}

function FILTER_positional_args_to_named_param_map(...args) {
  return { array: args[0], filterExpression: args[1] };
}

function REDUCE_positional_args_to_named_param_map(...args) {
  return { array: args[0], reduceExpression: args[1], initialValue: args[2] };
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    arrayFunctions,
    ARRAY_GET_positional_args_to_named_param_map,
    ARRAY_SET_positional_args_to_named_param_map,
    ARRAY_LENGTH_positional_args_to_named_param_map,
    ARRAY_FILTER_positional_args_to_named_param_map,
    ARRAY_SORT_positional_args_to_named_param_map,
    ARRAY_FIND_positional_args_to_named_param_map,
    ARRAY_MAP_positional_args_to_named_param_map,
    ARRAY_JOIN_positional_args_to_named_param_map,
    ARRAY_CONCAT_positional_args_to_named_param_map,
    SPLIT_positional_args_to_named_param_map,
    JOIN_positional_args_to_named_param_map,
    ARRAY_SLICE_positional_args_to_named_param_map,
    ARRAY_PUSH_positional_args_to_named_param_map,
    ARRAY_POP_positional_args_to_named_param_map,
    ARRAY_SHIFT_positional_args_to_named_param_map,
    ARRAY_UNSHIFT_positional_args_to_named_param_map,
    ARRAY_REVERSE_positional_args_to_named_param_map,
    ARRAY_INCLUDES_positional_args_to_named_param_map,
    ARRAY_INDEXOF_positional_args_to_named_param_map,
    ARRAY_MIN_positional_args_to_named_param_map,
    ARRAY_MAX_positional_args_to_named_param_map,
    ARRAY_SUM_positional_args_to_named_param_map,
    ARRAY_AVERAGE_positional_args_to_named_param_map,
    ARRAY_UNIQUE_positional_args_to_named_param_map,
    ARRAY_FLATTEN_positional_args_to_named_param_map,
    SELECT_positional_args_to_named_param_map,
    GROUP_BY_positional_args_to_named_param_map,
    DISTINCT_positional_args_to_named_param_map,
    ARRAY_REDUCE_positional_args_to_named_param_map,
    SUMMARY_positional_args_to_named_param_map,
    REGRESSION_positional_args_to_named_param_map,
    FORECAST_positional_args_to_named_param_map,
    CORRELATION_MATRIX_positional_args_to_named_param_map,
    MAP_positional_args_to_named_param_map,
    FILTER_positional_args_to_named_param_map,
    REDUCE_positional_args_to_named_param_map
  };
} else if (typeof window !== 'undefined') {
  window.arrayFunctions = arrayFunctions;
  window.ARRAY_GET_positional_args_to_named_param_map = ARRAY_GET_positional_args_to_named_param_map;
  window.ARRAY_SET_positional_args_to_named_param_map = ARRAY_SET_positional_args_to_named_param_map;
  window.ARRAY_LENGTH_positional_args_to_named_param_map = ARRAY_LENGTH_positional_args_to_named_param_map;
  window.ARRAY_FILTER_positional_args_to_named_param_map = ARRAY_FILTER_positional_args_to_named_param_map;
  window.ARRAY_SORT_positional_args_to_named_param_map = ARRAY_SORT_positional_args_to_named_param_map;
  window.ARRAY_FIND_positional_args_to_named_param_map = ARRAY_FIND_positional_args_to_named_param_map;
  window.ARRAY_MAP_positional_args_to_named_param_map = ARRAY_MAP_positional_args_to_named_param_map;
  window.ARRAY_JOIN_positional_args_to_named_param_map = ARRAY_JOIN_positional_args_to_named_param_map;
  window.ARRAY_CONCAT_positional_args_to_named_param_map = ARRAY_CONCAT_positional_args_to_named_param_map;
  window.SPLIT_positional_args_to_named_param_map = SPLIT_positional_args_to_named_param_map;
  window.JOIN_positional_args_to_named_param_map = JOIN_positional_args_to_named_param_map;
  window.ARRAY_SLICE_positional_args_to_named_param_map = ARRAY_SLICE_positional_args_to_named_param_map;
  window.ARRAY_PUSH_positional_args_to_named_param_map = ARRAY_PUSH_positional_args_to_named_param_map;
  window.ARRAY_POP_positional_args_to_named_param_map = ARRAY_POP_positional_args_to_named_param_map;
  window.ARRAY_SHIFT_positional_args_to_named_param_map = ARRAY_SHIFT_positional_args_to_named_param_map;
  window.ARRAY_UNSHIFT_positional_args_to_named_param_map = ARRAY_UNSHIFT_positional_args_to_named_param_map;
  window.ARRAY_REVERSE_positional_args_to_named_param_map = ARRAY_REVERSE_positional_args_to_named_param_map;
  window.ARRAY_INCLUDES_positional_args_to_named_param_map = ARRAY_INCLUDES_positional_args_to_named_param_map;
  window.ARRAY_INDEXOF_positional_args_to_named_param_map = ARRAY_INDEXOF_positional_args_to_named_param_map;
  window.ARRAY_MIN_positional_args_to_named_param_map = ARRAY_MIN_positional_args_to_named_param_map;
  window.ARRAY_MAX_positional_args_to_named_param_map = ARRAY_MAX_positional_args_to_named_param_map;
  window.ARRAY_SUM_positional_args_to_named_param_map = ARRAY_SUM_positional_args_to_named_param_map;
  window.ARRAY_AVERAGE_positional_args_to_named_param_map = ARRAY_AVERAGE_positional_args_to_named_param_map;
  window.ARRAY_UNIQUE_positional_args_to_named_param_map = ARRAY_UNIQUE_positional_args_to_named_param_map;
  window.ARRAY_FLATTEN_positional_args_to_named_param_map = ARRAY_FLATTEN_positional_args_to_named_param_map;
  window.SELECT_positional_args_to_named_param_map = SELECT_positional_args_to_named_param_map;
  window.GROUP_BY_positional_args_to_named_param_map = GROUP_BY_positional_args_to_named_param_map;
  window.DISTINCT_positional_args_to_named_param_map = DISTINCT_positional_args_to_named_param_map;
  window.ARRAY_REDUCE_positional_args_to_named_param_map = ARRAY_REDUCE_positional_args_to_named_param_map;
  window.SUMMARY_positional_args_to_named_param_map = SUMMARY_positional_args_to_named_param_map;
  window.REGRESSION_positional_args_to_named_param_map = REGRESSION_positional_args_to_named_param_map;
  window.FORECAST_positional_args_to_named_param_map = FORECAST_positional_args_to_named_param_map;
  window.CORRELATION_MATRIX_positional_args_to_named_param_map = CORRELATION_MATRIX_positional_args_to_named_param_map;
  window.MAP_positional_args_to_named_param_map = MAP_positional_args_to_named_param_map;
  window.FILTER_positional_args_to_named_param_map = FILTER_positional_args_to_named_param_map;
  window.REDUCE_positional_args_to_named_param_map = REDUCE_positional_args_to_named_param_map;
}