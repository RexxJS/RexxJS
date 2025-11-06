/**
 * Data processing and transformation functions for REXX interpreter
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

const dataFunctions = {
  'CSV_TO_JSON': (csvStr, delimiter = ',', hasHeader = true) => {
    try {
      const lines = String(csvStr).split('\n').filter(line => line.trim());
      if (lines.length === 0) return '[]';
      
      const hasHeaderBool = String(hasHeader).toLowerCase() === 'true';
      const delim = String(delimiter);
      
      if (!hasHeaderBool) {
        // Generate column names like col0, col1, etc.
        const firstLine = lines[0].split(delim);
        const headers = firstLine.map((_, index) => `col${index}`);
        const data = lines.map(line => {
          const values = line.split(delim);
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        return JSON.stringify(data);
      }
      
      const headers = lines[0].split(delim).map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(delim);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        return row;
      });
      
      return JSON.stringify(data);
    } catch (e) {
      return '[]';
    }
  },
  
  'JSON_TO_CSV': (jsonStr, delimiter = ',') => {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!Array.isArray(data) || data.length === 0) return '';
      
      const delim = String(delimiter);
      const headers = Object.keys(data[0]);
      
      const csvLines = [headers.join(delim)];
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape values containing delimiter or quotes
          return String(value).includes(delim) || String(value).includes('"') 
            ? `"${String(value).replace(/"/g, '""')}"` 
            : String(value);
        });
        csvLines.push(values.join(delim));
      });
      
      return csvLines.join('\n');
    } catch (e) {
      return '';
    }
  },
  
  'XML_TO_JSON': (xmlStr) => {
    try {
      // Simple XML to JSON converter (basic implementation)
      const xmlString = String(xmlStr).trim();
      
      // This is a simplified parser - for production use, you'd want a proper XML parser
      const parseXML = (xml) => {
        const result = {};
        
        // Remove XML declaration and comments
        const cleanXml = xml.replace(/<\?xml.*?\?>/g, '').replace(/<!--.*?-->/g, '').trim();
        
        // Simple tag matching
        const tagRegex = /<(\w+)(?:\s+[^>]*)?>(.*?)<\/\1>/gs;
        let match;
        
        while ((match = tagRegex.exec(cleanXml)) !== null) {
          const tagName = match[1];
          const content = match[2].trim();
          
          if (content.includes('<')) {
            result[tagName] = parseXML(content);
          } else {
            result[tagName] = content;
          }
        }
        
        return Object.keys(result).length > 0 ? result : xmlString;
      };
      
      return parseXML(xmlString);
    } catch (e) {
      return {};
    }
  },
  
  'DATA_FILTER': (dataStr, filterKey, filterValue) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '[]';
      
      const filtered = data.filter(item => {
        if (typeof item !== 'object' || item === null) return false;
        return item[String(filterKey)] === filterValue;
      });
      
      return JSON.stringify(filtered);
    } catch (e) {
      return '[]';
    }
  },
  
  'DATA_SORT': (dataStr, sortKey, ascending = true) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '[]';
      
      const isAscending = String(ascending).toLowerCase() === 'true';
      
      const sorted = [...data].sort((a, b) => {
        const aVal = a[String(sortKey)];
        const bVal = b[String(sortKey)];
        
        if (aVal < bVal) return isAscending ? -1 : 1;
        if (aVal > bVal) return isAscending ? 1 : -1;
        return 0;
      });
      
      return JSON.stringify(sorted);
    } catch (e) {
      return dataStr;
    }
  },
  
  'DATA_GROUP_BY': (dataStr, groupKey) => {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      if (!Array.isArray(data)) return '{}';
      
      const grouped = {};
      
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const keyValue = item[String(groupKey)];
          if (!grouped[keyValue]) {
            grouped[keyValue] = [];
          }
          grouped[keyValue].push(item);
        }
      });
      
      return JSON.stringify(grouped);
    } catch (e) {
      return '{}';
    }
  },

  'COPY': (value) => {
    try {
      // Handle null and undefined
      if (value === null || value === undefined) {
        return value;
      }
      
      // For primitives (string, number, boolean), return as-is (already immutable)
      if (typeof value !== 'object') {
        return value;
      }
      
      // Use structuredClone for modern browsers/Node.js (v17+)
      if (typeof structuredClone !== 'undefined') {
        try {
          const cloned = structuredClone(value);
          return cloned;
        } catch (structuredCloneError) {
          // If structuredClone fails (e.g., functions), try JSON fallback
          try {
            return JSON.parse(JSON.stringify(value));
          } catch (jsonError) {
            // If both fail, return original
            return value;
          }
        }
      }
      
      // Fallback: JSON parse/stringify for deep cloning
      // This works for most cases but has limitations (functions, undefined, symbols, etc.)
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      // If deep cloning fails, return original value
      // This maintains function behavior even with uncloneable objects
      return value;
    }
  }

  //TODO insert more data processing functions here

};

// Sibling converters for unified parameter model
function CSV_TO_JSON_positional_args_to_named_param_map(...args) {
  return { csvStr: args[0], delimiter: args[1], hasHeader: args[2] };
}

function JSON_TO_CSV_positional_args_to_named_param_map(...args) {
  return { jsonStr: args[0], delimiter: args[1] };
}

function XML_TO_JSON_positional_args_to_named_param_map(...args) {
  return { xmlStr: args[0] };
}

function DATA_FILTER_positional_args_to_named_param_map(...args) {
  return { dataStr: args[0], filterKey: args[1], filterValue: args[2] };
}

function DATA_SORT_positional_args_to_named_param_map(...args) {
  return { dataStr: args[0], sortKey: args[1], ascending: args[2] };
}

function DATA_GROUP_BY_positional_args_to_named_param_map(...args) {
  return { dataStr: args[0], groupKey: args[1] };
}

function COPY_positional_args_to_named_param_map(...args) {
  return { value: args[0] };
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dataFunctions,
    CSV_TO_JSON_positional_args_to_named_param_map,
    JSON_TO_CSV_positional_args_to_named_param_map,
    XML_TO_JSON_positional_args_to_named_param_map,
    DATA_FILTER_positional_args_to_named_param_map,
    DATA_SORT_positional_args_to_named_param_map,
    DATA_GROUP_BY_positional_args_to_named_param_map,
    COPY_positional_args_to_named_param_map
  };
} else if (typeof window !== 'undefined') {
  window.dataFunctions = dataFunctions;
  window.CSV_TO_JSON_positional_args_to_named_param_map = CSV_TO_JSON_positional_args_to_named_param_map;
  window.JSON_TO_CSV_positional_args_to_named_param_map = JSON_TO_CSV_positional_args_to_named_param_map;
  window.XML_TO_JSON_positional_args_to_named_param_map = XML_TO_JSON_positional_args_to_named_param_map;
  window.DATA_FILTER_positional_args_to_named_param_map = DATA_FILTER_positional_args_to_named_param_map;
  window.DATA_SORT_positional_args_to_named_param_map = DATA_SORT_positional_args_to_named_param_map;
  window.DATA_GROUP_BY_positional_args_to_named_param_map = DATA_GROUP_BY_positional_args_to_named_param_map;
  window.COPY_positional_args_to_named_param_map = COPY_positional_args_to_named_param_map;
}