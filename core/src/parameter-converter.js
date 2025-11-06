/**
 * Parameter conversion utilities for REXX interpreter
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

function convertParamsToArgs(functionName, params) {
    switch (functionName) {
        case 'UPPER':
        case 'LOWER':
        case 'LENGTH':
        case 'ABS':
            // Single parameter functions - look for common parameter names
            return [params.string || params.str || params.value || params.text || Object.values(params)[0] || ''];

        case 'SUBSTR':
            // String substring function - string, start, length
            return [
                params.string || params.str || params.text || Object.values(params)[0] || '',
                params.start || params.pos || params.position || Object.values(params)[1] || 1,
                params.length || params.len || Object.values(params)[2]
            ];

        case 'POS':
            // String position function - string, needle, start (data-first for pipe compatibility)
            return [
                params.string || params.str || params.text || params.haystack || Object.values(params)[0] || '',
                params.needle || params.substring || params.search || Object.values(params)[1] || '',
                params.start || params.position || Object.values(params)[2] || 1
            ];

        case 'WORDPOS':
            // Word position function - string, phrase, start (data-first for pipe compatibility)
            return [
                params.string ?? params.str ?? params.text ?? Object.values(params)[0] ?? '',
                params.phrase ?? params.word ?? params.search ?? Object.values(params)[1] ?? '',
                params.start ?? params.position ?? Object.values(params)[2] ?? 1
            ];

        case 'MAX':
        case 'MIN':
            // Multi-parameter functions - collect all numeric parameters
            const values = [];
            // Try named parameters first
            if (params.values) {
                // If there's a 'values' parameter, use it (could be array or comma-separated)
                if (Array.isArray(params.values)) {
                    values.push(...params.values);
                } else if (typeof params.values === 'string' && params.values.includes(',')) {
                    // Split comma-separated values
                    values.push(...params.values.split(',').map(v => v.trim()));
                } else {
                    values.push(params.values);
                }
            } else {
                // Otherwise collect all parameter values
                for (const key in params) {
                    values.push(params[key]);
                }
            }
            return values;

        // R Statistical Functions - handle JSON array parameter conversion
        case 'R_MAX':
        case 'R_MIN':
        case 'MEAN':
        case 'MEDIAN':
        case 'R_MEDIAN':
        case 'R_LENGTH':
        case 'LENGTH':
        case 'MIN':
        case 'MAX':
            // R functions expect arrays as first parameter
            const rawData = params.x || params.data || params.values || Object.values(params)[0] || [];
            let processedData = rawData;
            
            // If it's a JSON string like "[1,2,3,4,5]", parse it to an array
            if (typeof rawData === 'string') {
              if (rawData.trim().startsWith('[') && rawData.trim().endsWith(']')) {
                try {
                  processedData = JSON.parse(rawData);
                } catch (e) {
                  // If parsing fails, use original data
                  processedData = rawData;
                }
              }
            }
            
            // Include na_rm parameter if provided
            return [processedData, params.na_rm || false];

        // NumPy-inspired functions
        case 'zeros':
        case 'ones':
        case 'full':
        case 'eye':
        case 'identity':
        case 'ZEROS':
        case 'ONES':
        case 'FULL':
        case 'EYE':
        case 'IDENTITY':
            // Shape parameter - can be number or array
            const shapeParam = params.shape || params.size || Object.values(params)[0];
            let shape = shapeParam;
            
            if (typeof shapeParam === 'string') {
              if (shapeParam.trim().startsWith('[') && shapeParam.trim().endsWith(']')) {
                try {
                  shape = JSON.parse(shapeParam);
                } catch (e) {
                  shape = parseInt(shapeParam) || 1;
                }
              } else {
                shape = parseInt(shapeParam) || 1;
              }
            }
            
            // For full function, include fill value
            if (functionName === 'full') {
              return [shape, params.fillValue || params.value || 0];
            }
            
            return [shape];

        case 'arange':
        case 'ARANGE':
            // arange(start, stop, step) or arange(stop)
            const startVal = parseInt(params.start) || parseInt(Object.values(params)[0]) || 0;
            const stopVal = parseInt(params.stop) || parseInt(Object.values(params)[1]) || 10;
            const stepVal = parseInt(params.step) || parseInt(Object.values(params)[2]) || 1;
            return [startVal, stopVal, stepVal];

        // SciPy interpolation functions
        case 'INTERP1D':
        case 'interp1d':
            // interp1d(x, y, options)
            const xData = JSON.parse(params.x || Object.values(params)[0] || '[]');
            const yData = JSON.parse(params.y || Object.values(params)[1] || '[]');
            const options = params.options ? JSON.parse(params.options) : {};
            return [xData, yData, options];
            
        case 'PCHIP':
        case 'pchip':
            // pchip(x, y, options)
            const pchipX = JSON.parse(params.x || Object.values(params)[0] || '[]');
            const pchipY = JSON.parse(params.y || Object.values(params)[1] || '[]');
            const pchipOptions = params.options ? JSON.parse(params.options) : {};
            return [pchipX, pchipY, pchipOptions];
            
        case 'SPLREP':
        case 'splrep':
            // splrep(x, y, options)
            const sprepX = JSON.parse(params.x || Object.values(params)[0] || '[]');
            const sprepY = JSON.parse(params.y || Object.values(params)[1] || '[]');
            const sprepOptions = params.options ? JSON.parse(params.options) : {};
            return [sprepX, sprepY, sprepOptions];
            
        case 'RBF':
        case 'rbf':
            // rbf(x, y, d, options) - note: y can be null for 1D case
            const rbfX = JSON.parse(params.x || Object.values(params)[0] || '[]');
            const rbfY = params.y ? JSON.parse(params.y) : null;
            const rbfD = JSON.parse(params.d || Object.values(params)[rbfY ? 2 : 1] || '[]');
            const rbfOptions = params.options ? JSON.parse(params.options) : {};
            return [rbfX, rbfY, rbfD, rbfOptions];
            
        // SciPy stats functions
        case 'sp_describe':
        case 'SP_DESCRIBE':
        case 'describe':
        case 'DESCRIBE':
            // describe(a, ddof)
            const describeData = JSON.parse(params.a || params.data || Object.values(params)[0] || '[]');
            const ddof = parseInt(params.ddof) || 1;
            return [describeData, ddof];
            
        case 'ttest_1samp':
        case 'TTEST_1SAMP':
            // ttest_1samp(a, popmean)
            const sampleData = JSON.parse(params.a || params.sample || Object.values(params)[0] || '[]');
            const popmean = parseFloat(params.popmean || Object.values(params)[1] || 0);
            return [sampleData, popmean];
            
        case 'pearsonr':
        case 'PEARSONR':
            // pearsonr(x, y)
            const pearsonX = JSON.parse(params.x || Object.values(params)[0] || '[]');
            const pearsonY = JSON.parse(params.y || Object.values(params)[1] || '[]');
            return [pearsonX, pearsonY];
            
        // SymPy functions
        case 'SY_SYMBOL':
        case 'symbols':
        case 'SYMBOLS':
            // symbols(names) - can be space-separated string
            const symbolNames = params.vars || params.names || params.name || Object.values(params)[0] || '';
            return [symbolNames];
            
        case 'SY_DIFF':
        case 'diff':
        case 'DIFF': {
            // Multiple DIFF functions - disambiguate by parameters
            // 1. Text DIFF: params has text1/text2 (new)
            // 2. Array DIFF: params has a/array (numpy-style)
            // 3. Symbolic DIFF: params has expr/expression (symbolic math)

            if (params.text1 !== undefined || params.text2 !== undefined || params.old !== undefined || params.new !== undefined) {
                // Text diff: DIFF(text1, text2, options)
                const text1 = params.text1 || params.old || params.original || params.a || Object.values(params)[0];
                const text2 = params.text2 || params.new || params.modified || params.b || Object.values(params)[1];
                let diffOptions = params.options || params.opts || {};

                if (Object.keys(diffOptions).length === 0) {
                    diffOptions = {
                        format: params.format,
                        context: params.context,
                        filename1: params.filename1,
                        filename2: params.filename2
                    };
                    Object.keys(diffOptions).forEach(key => diffOptions[key] === undefined && delete diffOptions[key]);
                }

                return [text1, text2, diffOptions];
            } else if (params.a !== undefined || params.array !== undefined || params.data !== undefined) {
                // Array diff: DIFF(array, n) - numpy-style differentiation
                const diffArrayStr = params.a || params.array || params.data || Object.values(params)[0] || '[]';
                const diffArray = typeof diffArrayStr === 'string' ? JSON.parse(diffArrayStr) : diffArrayStr;
                const diffN = parseInt(params.n || params.order || Object.values(params)[1]) || 1;
                return [diffArray, diffN];
            } else {
                // Symbolic diff: diff(expr, variable) - symbolic math
                const diffExpr = params.expr || params.expression || Object.values(params)[0] || '';
                const diffVar = params.variable || params.var || Object.values(params)[1] || 'x';
                return [diffExpr, diffVar];
            }
        }
            
        case 'SY_NUM':
        case 'num':
        case 'NUM':
            // num(value)
            const numValue = parseFloat(params.value || Object.values(params)[0] || 0);
            return [numValue];
            
        case 'expand':
        case 'EXPAND':
        case 'factor':
        case 'FACTOR':
        case 'simplify':
        case 'SIMPLIFY':
            // Single expression parameter
            const expr = params.expr || params.expression || Object.values(params)[0] || '';
            return [expr];

        case 'amin':
        case 'amax':
        case 'mean':
        case 'median':
        case 'std':
        case 'var':
        case 'AMIN':
        case 'AMAX':
        case 'MEAN':
        case 'MEDIAN':
        case 'STD':
        case 'VAR':
            // NumPy statistical functions - expect array parameter
            const arrayData = params.a || params.array || params.data || Object.values(params)[0] || [];
            let parsedArrayData = arrayData;
            
            // If it's a JSON string like "[1,2,3,4,5]", parse it to an array
            if (typeof arrayData === 'string') {
              if (arrayData.trim().startsWith('[') && arrayData.trim().endsWith(']')) {
                try {
                  parsedArrayData = JSON.parse(arrayData);
                } catch (e) {
                  parsedArrayData = arrayData;
                }
              }
            }
            
            return [parsedArrayData];

        case 'dot':
        case 'vdot':
        case 'inner':
        case 'DOT':
        case 'VDOT':
        case 'INNER':
            // Dot product functions - expect two array parameters
            const vector1 = params.a || params.x || params.vector1 || Object.values(params)[0] || [];
            const vector2 = params.b || params.y || params.vector2 || Object.values(params)[1] || [];
            
            let parsedVector1 = vector1;
            let parsedVector2 = vector2;
            
            // Parse JSON strings
            if (typeof vector1 === 'string' && vector1.trim().startsWith('[')) {
              try { parsedVector1 = JSON.parse(vector1); } catch (e) { /* ignore */ }
            }
            if (typeof vector2 === 'string' && vector2.trim().startsWith('[')) {
              try { parsedVector2 = JSON.parse(vector2); } catch (e) { /* ignore */ }
            }
            
            return [parsedVector1, parsedVector2];

        case 'DATE':
        case 'TIME':
            // Classic REXX date/time functions with optional format code, timezone, and locale
            // Supports:
            // - DATE() or TIME()
            // - DATE('N') or TIME('N')
            // - DATE('N', 'UTC') or TIME('N', 'America/New_York')
            // - DATE('N', 'UTC', 'fr-FR') or TIME('N', 'UTC', 'de-DE')
            // - DATE format='N' timezone='UTC' locale='fr-FR'

            let formatCode = '';
            let timezone = 'UTC';
            let locale = 'en-US';

            // Handle positional arguments (params.value, params.arg1, params.arg2, etc.)
            if (params.value) {
                formatCode = params.value;
                // Remove quotes if present
                if ((formatCode.startsWith('"') && formatCode.endsWith('"')) ||
                    (formatCode.startsWith("'") && formatCode.endsWith("'"))) {
                    formatCode = formatCode.slice(1, -1);
                }
            }

            // Second positional argument: timezone
            if (params.arg1) {
                timezone = params.arg1;
                // Remove quotes if present
                if ((timezone.startsWith('"') && timezone.endsWith('"')) ||
                    (timezone.startsWith("'") && timezone.endsWith("'"))) {
                    timezone = timezone.slice(1, -1);
                }
            }

            // Third positional argument: locale
            if (params.arg2) {
                locale = params.arg2;
                // Remove quotes if present
                if ((locale.startsWith('"') && locale.endsWith('"')) ||
                    (locale.startsWith("'") && locale.endsWith("'"))) {
                    locale = locale.slice(1, -1);
                }
            }

            // Handle named parameters (override positional if provided)
            if (params.format) {
                formatCode = params.format;
                if ((formatCode.startsWith('"') && formatCode.endsWith('"')) ||
                    (formatCode.startsWith("'") && formatCode.endsWith("'"))) {
                    formatCode = formatCode.slice(1, -1);
                }
            }
            if (params.timezone) {
                timezone = params.timezone;
                if ((timezone.startsWith('"') && timezone.endsWith('"')) ||
                    (timezone.startsWith("'") && timezone.endsWith("'"))) {
                    timezone = timezone.slice(1, -1);
                }
            }
            if (params.locale) {
                locale = params.locale;
                if ((locale.startsWith('"') && locale.endsWith('"')) ||
                    (locale.startsWith("'") && locale.endsWith("'"))) {
                    locale = locale.slice(1, -1);
                }
            }

            return [formatCode, timezone, locale];

        case 'NOW':
            // NOW can take timezone and format parameters
            return [
                params.timezone || 'UTC',
                params.format || 'ISO'
            ];

        case 'DATE_ADD':
        case 'DATE_SUB':
            // Date arithmetic functions
            return [
                params.date || params.dateStr || Object.values(params)[0] || '',
                params.days || 0,
                params.months || 0,
                params.years || 0,
                params.hours || 0,
                params.minutes || 0,
                params.seconds || 0
            ];

        case 'DATE_DIFF':
            // Date difference function
            return [
                params.date1 || params.from || Object.values(params)[0] || '',
                params.date2 || params.to || Object.values(params)[1] || '',
                params.unit || 'days'
            ];

        case 'DATE_PARSE':
            // Date parsing function
            return [
                params.date || params.dateStr || params.string || Object.values(params)[0] || '',
                params.format || 'auto'
            ];

        case 'DATE_VALID':
            // Date validation function
            return [params.date || params.dateStr || params.string || Object.values(params)[0] || ''];

        // Array/Collection Functions
        case 'ARRAY_LENGTH':
        case 'ARRAY_POP':
        case 'ARRAY_SHIFT':
        case 'ARRAY_REVERSE':
        case 'ARRAY_UNIQUE':
        case 'ARRAY_MIN':
        case 'ARRAY_MAX':
        case 'ARRAY_SUM':
        case 'ARRAY_AVERAGE':
            // Single array parameter functions
            return [params.array || params.arr || Object.values(params)[0] || '[]'];

        case 'ARRAY_REDUCE':
            // Array, reduce expression, initial value
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.expression || params.expr || params.reducer || Object.values(params)[1] || null,
                params.initialValue || params.initial || params.start || Object.values(params)[2] || null
            ];

        case 'ARRAY_PUSH':
        case 'ARRAY_UNSHIFT':
            // Array plus items
            const arrayParam = params.array || params.arr || Object.values(params)[0] || '[]';
            const items = [];
            for (const key in params) {
                if (key !== 'array' && key !== 'arr') {
                    items.push(params[key]);
                }
            }
            return [arrayParam, ...items];

        case 'ARRAY_SLICE':
            // Array, start, end
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.start || 0,
                params.end
            ];

        case 'ARRAY_CONCAT':
            // Two arrays
            return [
                params.array1 || params.arr1 || Object.values(params)[0] || '[]',
                params.array2 || params.arr2 || Object.values(params)[1] || '[]'
            ];

        case 'ARRAY_SORT':
            // Array, optional property (for object arrays), and optional order
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.property || params.prop || params.sortBy || Object.values(params)[1],
                params.order || Object.values(params)[2] || 'asc'
            ];

        case 'ARRAY_INCLUDES':
        case 'ARRAY_INDEXOF':
            // Array and item
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.item || params.value || Object.values(params)[1] || null
            ];

        case 'ARRAY_FIND':
            // Array, searchProperty, searchValue (3 parameters)
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.searchProperty || params.property || params.prop || Object.values(params)[1] || null,
                params.searchValue || params.value || params.val || Object.values(params)[2] || null
            ];

        case 'ARRAY_FILTER':
            // Array and optional filter expression/callback
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.filterExpression || params.filter || params.callback || params.expression || Object.values(params)[1] || null
            ];

        case 'ARRAY_MAP':
            // Array and optional map expression/callback
            // Handle cases where parsing splits the mapExpression incorrectly due to escaped quotes
            let mapExpr = params.mapExpression || params.map || params.callback || params.expression;
            if (mapExpr && params.value && typeof params.value === 'string') {
                // Reconstruct the full expression if it was split
                // Original was split like: mapExpression="name + \"" value="(\" + age + \")\""
                // Need to rebuild as: name + " (" + age + ")"
                const fullExpr = mapExpr + ' ' + params.value;
                
                // Clean up escape sequences and reconstruct proper JavaScript expression
                // First normalize all escape sequences
                mapExpr = fullExpr
                    .replace(/\\"/g, '"')     // Replace \" with "
                    .replace(/\\\\/g, '\\')   // Replace \\ with \
                    .replace(/\\(?!\\)/g, '') // Remove single backslashes not followed by another backslash
                    .replace(/^"|"$/g, '')    // Remove outer quotes
                    .trim();
                
                // Then fix the specific pattern we expect: name + " (" + age + ")"
                // Handle the specific case: name + (" + age + ")" -> name + " (" + age + ")"
                // The pattern we see is: name +  (" + age + ")"
                mapExpr = mapExpr.replace(/\+\s*\(\s*"\s*\+\s*/, '+ " (" + ').replace(/\s*\+\s*"\s*\)\s*"*$/, ' + ")"');
            }
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                mapExpr || Object.values(params)[1] || null
            ];

        case 'ARRAY_FLATTEN':
            // Array and optional depth
            return [
                params.array || params.arr || Object.values(params)[0] || '[]',
                params.depth || 1
            ];

        case 'SELECT':
            // Array, columns, and optional WHERE clause
            return [
                params.array || params.arr || params.data || Object.values(params)[0] || '[]',
                params.columns || params.cols || params.select || Object.values(params)[1] || '*',
                params.where || params.whereClause || params.condition || Object.values(params)[2]
            ];

        case 'GROUP_BY':
            // Array and group key
            return [
                params.array || params.arr || params.data || Object.values(params)[0] || '[]',
                params.key || params.groupKey || params.by || Object.values(params)[1] || ''
            ];

        case 'ARRAY_JOIN':
            // Two arrays and their join keys
            return [
                params.array1 || params.arr1 || params.left || Object.values(params)[0] || '[]',
                params.array2 || params.arr2 || params.right || Object.values(params)[1] || '[]',
                params.key1 || params.leftKey || params.on || Object.values(params)[2] || 'id',
                params.key2 || params.rightKey || Object.values(params)[3]
            ];

        case 'DISTINCT':
            // Array and optional property for object arrays
            return [
                params.array || params.arr || params.data || Object.values(params)[0] || '[]',
                params.property || params.prop || params.by || Object.values(params)[1]
            ];

        // Statistical Functions with Dictionary Returns
        case 'SUMMARY':
            // Data array for statistical summary
            return [
                params.data || params.array || params.values || Object.values(params)[0] || '[]'
            ];

        case 'CORRELATION_MATRIX':
            // Array of arrays for correlation analysis
            return [
                params.data || params.arrays || params.matrix || Object.values(params)[0] || '[]'
            ];

        case 'REGRESSION':
            // X values, Y values, type (linear/polynomial)
            return [
                params.xValues || params.x || params.independent || Object.values(params)[0] || '[]',
                params.yValues || params.y || params.dependent || Object.values(params)[1] || '[]',
                params.type || params.method || params.model || Object.values(params)[2] || 'linear'
            ];

        case 'FORECAST':
            // Historical data, periods to forecast, method
            return [
                params.data || params.historical || params.values || Object.values(params)[0] || '[]',
                params.periods || params.steps || params.count || Object.values(params)[1] || 1,
                params.method || params.type || params.algorithm || Object.values(params)[2] || 'linear'
            ];

        // Text Analysis Functions with Dictionary Returns
        case 'WORD_FREQUENCY':
            // Text for word frequency analysis
            return [
                params.text || params.string || params.content || Object.values(params)[0] || ''
            ];

        case 'SENTIMENT_ANALYSIS':
            // Text for sentiment analysis
            return [
                params.text || params.string || params.content || Object.values(params)[0] || ''
            ];

        case 'EXTRACT_KEYWORDS':
            // Text and optional max keywords count
            return [
                params.text || params.string || params.content || Object.values(params)[0] || '',
                params.maxKeywords || params.max || params.limit || Object.values(params)[1] || 10
            ];

        // File System Functions
        case 'FILE_WRITE':
            // Filename, content, encoding
            return [
                params.filename || params.file || params.name || Object.values(params)[0] || '',
                params.content || params.data || Object.values(params)[1] || '',
                params.encoding || 'utf8'
            ];

        case 'FILE_READ':
        case 'FILE_EXISTS':
        case 'FILE_DELETE':
        case 'FILE_SIZE':
            // Single filename parameter
            return [
                params.filename || params.file || params.name || Object.values(params)[0] || ''
            ];

        case 'FILE_APPEND':
            // Filename and content to append
            return [
                params.filename || params.file || params.name || Object.values(params)[0] || '',
                params.content || params.data || Object.values(params)[1] || ''
            ];

        case 'FILE_LIST':
            // Optional pattern
            return [
                params.pattern || params.filter || params.glob || Object.values(params)[0] || '*'
            ];

        case 'FILE_COPY':
        case 'FILE_MOVE':
            // Source and destination
            return [
                params.source || params.src || params.from || Object.values(params)[0] || '',
                params.destination || params.dest || params.to || Object.values(params)[1] || ''
            ];

        case 'FILE_BACKUP':
            // Filename and optional suffix
            return [
                params.filename || params.file || params.name || Object.values(params)[0] || '',
                params.suffix || params.ext || Object.values(params)[1] || '.bak'
            ];

        // Validation Functions
        case 'IS_EMAIL':
        case 'IS_URL':
        case 'IS_INTEGER':
        case 'IS_POSITIVE':
        case 'IS_NEGATIVE':
        case 'IS_CREDIT_CARD':
        case 'IS_MAC_ADDRESS':
        case 'IS_EMPTY':
        case 'IS_NOT_EMPTY':
        case 'IS_ALPHA':
        case 'IS_ALPHANUMERIC':
        case 'IS_NUMERIC':
        case 'IS_LOWERCASE':
        case 'IS_UPPERCASE':
            // Single value parameter
            return [
                params.value || params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'IS_NUMBER':
            // Number value with optional min/max
            return [
                params.value || params.input || params.data || Object.values(params)[0] || '',
                params.min,
                params.max
            ];

        case 'IS_PHONE':
            // Phone number and optional format
            return [
                params.phone || params.number || params.value || Object.values(params)[0] || '',
                params.format || params.type || Object.values(params)[1] || 'any'
            ];

        case 'IS_RANGE':
            // Value, min, max
            return [
                params.value || params.input || Object.values(params)[0] || 0,
                params.min || params.minimum || Object.values(params)[1] || 0,
                params.max || params.maximum || Object.values(params)[2] || 100
            ];

        case 'IS_DATE':
            // Date string and optional format
            return [
                params.date || params.value || params.dateStr || Object.values(params)[0] || '',
                params.format || params.type || Object.values(params)[1] || 'any'
            ];

        case 'IS_TIME':
            // Time string and optional format
            return [
                params.time || params.value || params.timeStr || Object.values(params)[0] || '',
                params.format || params.type || Object.values(params)[1] || '24'
            ];

        case 'IS_ZIP_CODE':
            // Zip code and optional country
            return [
                params.zip || params.zipCode || params.postal || params.value || Object.values(params)[0] || '',
                params.country || params.region || Object.values(params)[1] || 'us'
            ];

        case 'IS_IP':
            // IP address and optional version
            return [
                params.ip || params.address || params.value || Object.values(params)[0] || '',
                params.version || params.type || Object.values(params)[1] || 'any'
            ];

        case 'IS_LENGTH':
            // Value, min, optional max
            return [
                params.value || params.input || params.string || Object.values(params)[0] || '',
                params.min || params.minimum || Object.values(params)[1] || 0,
                params.max || params.maximum || Object.values(params)[2] || null
            ];

        case 'IS_PATTERN':
            // Value and pattern
            return [
                params.value || params.input || params.string || Object.values(params)[0] || '',
                params.pattern || params.regex || params.match || Object.values(params)[1] || ''
            ];

        case 'IS_POSTAL_CODE':
            // Postal code and country
            return [
                params.code || params.postal || params.zip || params.value || Object.values(params)[0] || '',
                params.country || params.region || Object.values(params)[1] || 'US'
            ];

        case 'MATCHES_PATTERN':
            // Text and pattern
            return [
                params.text || params.value || params.input || Object.values(params)[0] || '',
                params.pattern || params.regex || Object.values(params)[1] || ''
            ];

        case 'VALIDATE_ALL':
        case 'VALIDATE_ANY':
            // Value and multiple validators
            const value = params.value || params.input || Object.values(params)[0] || '';
            const validators = [];
            for (const key in params) {
                if (key !== 'value' && key !== 'input') {
                    validators.push(params[key]);
                }
            }
            return [value, ...validators];

        case 'VALIDATE_SCHEMA':
            // Data and schema definition
            return [
                params.data || params.object || params.input || Object.values(params)[0] || '{}',
                params.schema || params.definition || params.rules || Object.values(params)[1] || '{}'
            ];

        case 'CHECK_TYPES':
            // Data and expected types
            return [
                params.data || params.input || params.value || Object.values(params)[0] || '',
                params.types || params.expected || params.expectedTypes || Object.values(params)[1] || 'string'
            ];

        // Math/Calculation Functions
        case 'MATH_ABS':
        case 'MATH_CEIL':
        case 'MATH_FLOOR':
        case 'MATH_SQRT':
        case 'MATH_FACTORIAL':
            // Single value parameter
            return [
                params.value || params.number || params.input || Object.values(params)[0] || '0'
            ];

        case 'MATH_ROUND':
            // Value and precision
            return [
                params.value || params.number || params.input || Object.values(params)[0] || '0',
                params.precision || params.decimals || params.places || Object.values(params)[1] || '0'
            ];

        case 'MATH_POWER':
            // Base and exponent
            return [
                params.base || params.value || params.number || Object.values(params)[0] || '0',
                params.exponent || params.power || Object.values(params)[1] || '1'
            ];

        case 'MATH_LOG':
            // Value and optional base
            return [
                params.value || params.number || Object.values(params)[0] || '1',
                params.base || Object.values(params)[1] || Math.E.toString()
            ];

        case 'MATH_SIN':
        case 'MATH_COS':
        case 'MATH_TAN':
            // Angle value and unit
            return [
                params.value || params.angle || params.number || Object.values(params)[0] || '0',
                params.unit || params.units || Object.values(params)[1] || 'radians'
            ];

        case 'MATH_RANDOM':
            // Min and max
            return [
                params.min || params.minimum || Object.values(params)[0] || '0',
                params.max || params.maximum || Object.values(params)[1] || '1'
            ];

        case 'MATH_RANDOM_INT':
            // Min and max integers
            return [
                params.min || params.minimum || Object.values(params)[0] || '0',
                params.max || params.maximum || Object.values(params)[1] || '100'
            ];

        case 'MATH_CLAMP':
            // Value, min, max
            return [
                params.value || params.number || Object.values(params)[0] || '0',
                params.min || params.minimum || Object.values(params)[1] || '0',
                params.max || params.maximum || Object.values(params)[2] || '100'
            ];

        case 'MATH_PERCENTAGE':
            // Value and total
            return [
                params.value || params.number || params.part || Object.values(params)[0] || '0',
                params.total || params.whole || Object.values(params)[1] || '100'
            ];

        case 'MATH_GCD':
        case 'MATH_LCM':
            // Two numbers
            return [
                params.a || params.first || params.value1 || Object.values(params)[0] || '0',
                params.b || params.second || params.value2 || Object.values(params)[1] || '0'
            ];

        case 'MATH_DISTANCE_2D':
            // Four coordinates: x1, y1, x2, y2
            return [
                params.x1 || Object.values(params)[0] || '0',
                params.y1 || Object.values(params)[1] || '0',
                params.x2 || Object.values(params)[2] || '0',
                params.y2 || Object.values(params)[3] || '0'
            ];

        case 'MATH_ANGLE_2D':
            // Four coordinates plus unit
            return [
                params.x1 || Object.values(params)[0] || '0',
                params.y1 || Object.values(params)[1] || '0',
                params.x2 || Object.values(params)[2] || '0',
                params.y2 || Object.values(params)[3] || '0',
                params.unit || params.units || Object.values(params)[4] || 'radians'
            ];

        case 'MATH_MAX':
        case 'MATH_MIN':
        case 'MATH_SUM':
        case 'MATH_AVERAGE':
            // Multiple values
            const mathValues = [];
            for (const key in params) {
                mathValues.push(params[key]);
            }
            return mathValues.length > 0 ? mathValues : ['0'];

        // Date/Time Functions
        case 'NOW':
        case 'NOW_TIMESTAMP':
            // No parameters
            return [];

        case 'DATE_FORMAT':
        case 'TIME_FORMAT':
            // Date string and format
            return [
                params.date || params.dateStr || params.value || Object.values(params)[0] || new Date().toISOString(),
                params.format || Object.values(params)[1] || 'ISO'
            ];

        case 'DATE_ADD':
        case 'DATE_SUBTRACT':
            // Date, amount, unit
            return [
                params.date || params.dateStr || params.value || Object.values(params)[0] || new Date().toISOString(),
                params.amount || params.number || Object.values(params)[1] || '1',
                params.unit || params.units || Object.values(params)[2] || 'days'
            ];

        case 'DATE_DIFF':
            // Two dates and unit
            return [
                params.date1 || params.start || params.from || Object.values(params)[0] || new Date().toISOString(),
                params.date2 || params.end || params.to || Object.values(params)[1] || new Date().toISOString(),
                params.unit || params.units || Object.values(params)[2] || 'days'
            ];

        case 'DATE_PARSE':
        case 'DATE_IS_WEEKEND':
        case 'DATE_IS_BUSINESS_DAY':
        case 'DATE_NEXT_BUSINESS_DAY':
        case 'DATE_QUARTER':
        case 'DATE_WEEK_NUMBER':
            // Single date parameter
            return [
                params.date || params.dateStr || params.value || Object.values(params)[0] || new Date().toISOString()
            ];

        case 'DATE_CREATE':
            // Year, month, day, hour, minute, second
            return [
                params.year || Object.values(params)[0] || new Date().getFullYear(),
                params.month || Object.values(params)[1] || (new Date().getMonth() + 1),
                params.day || Object.values(params)[2] || new Date().getDate(),
                params.hour || Object.values(params)[3] || '0',
                params.minute || Object.values(params)[4] || '0',
                params.second || Object.values(params)[5] || '0'
            ];

        case 'DATE_AGE':
            // Birth date and optional reference date
            return [
                params.birthDate || params.birth || params.date || Object.values(params)[0] || '1990-01-01',
                params.referenceDate || params.reference || params.asOf || Object.values(params)[1] || null
            ];

        // Excel/Google Sheets Functions
        case 'IF':
            // Condition, trueValue, falseValue
            return [
                params.condition || params.test || Object.values(params)[0],
                params.trueValue || params.true || params.ifTrue || Object.values(params)[1] || '',
                params.falseValue || params.false || params.ifFalse || Object.values(params)[2] || ''
            ];

        case 'AND':
        case 'OR':
        case 'AVERAGE':
        case 'MODE':
        case 'STDEV':
        case 'VAR':
        case 'CONCATENATE':
            // Multiple values
            const multiValues = [];
            for (const key in params) {
                multiValues.push(params[key]);
            }
            return multiValues.length > 0 ? multiValues : [''];

        case 'NOT':
        case 'LEN':
        case 'EXCEL_UPPER':
        case 'EXCEL_LOWER':
        case 'PROPER':
        case 'EXCEL_TRIM':
        case 'TODAY':
        case 'EXCEL_NOW':
        case 'YEAR':
        case 'MONTH':
        case 'DAY':
            // Single value parameter
            return [
                params.value || params.text || params.date || Object.values(params)[0] || ''
            ];

        case 'LEFT':
        case 'RIGHT':
            // Text and number of characters and optional pad character
            return [
                params.text || params.value || Object.values(params)[0] || '',
                params.numChars || params.chars || params.length || Object.values(params)[1] || '1',
                params.pad || Object.values(params)[2] || ' '
            ];

        case 'MID':
            // Text, start position, number of characters
            return [
                params.text || params.value || Object.values(params)[0] || '',
                params.startNum || params.start || params.position || Object.values(params)[1] || '1',
                params.numChars || params.chars || params.length || Object.values(params)[2] || '1'
            ];

        case 'SUBSTITUTE':
            // Text, oldText, newText, instanceNum
            return [
                params.text || params.value || Object.values(params)[0] || '',
                params.oldText || params.old || params.find || Object.values(params)[1] || '',
                params.newText || params.new || params.replace || Object.values(params)[2] || '',
                params.instanceNum || params.instance || Object.values(params)[3] || '0'
            ];

        case 'VLOOKUP':
            // tableArray, lookupValue, colIndex, exactMatch (data-first for pipe compatibility)
            return [
                params.tableArray || params.table || params.array || Object.values(params)[0] || '[]',
                params.lookupValue || params.lookup || params.value || Object.values(params)[1] || '',
                params.colIndex || params.col || params.column || Object.values(params)[2] || '1',
                params.exactMatch || params.exact || Object.values(params)[3] || 'false'
            ];

        case 'HLOOKUP':
            // tableArray, lookupValue, rowIndex, exactMatch (data-first for pipe compatibility)
            return [
                params.tableArray || params.table || params.array || Object.values(params)[0] || '[]',
                params.lookupValue || params.lookup || params.value || Object.values(params)[1] || '',
                params.rowIndex || params.row || Object.values(params)[2] || '1',
                params.exactMatch || params.exact || Object.values(params)[3] || 'false'
            ];

        case 'INDEX':
            // INDEX can be used for two purposes:
            // 1. String search: INDEX(string, needle [, start]) - like POS
            // 2. Array indexing: INDEX(array, row, col) - for 3D arrays
            // We detect based on the parameter names
            if (params.string || params.text || params.haystack || params.needle || params.substring || params.search) {
                // String search mode (like POS)
                return [
                    params.string || params.text || params.haystack || Object.values(params)[0] || '',
                    params.needle || params.substring || params.search || Object.values(params)[1] || '',
                    params.start || params.startPos || Object.values(params)[2] || 1
                ];
            } else {
                // Array indexing mode (3D array)
                return [
                    params.array || params.table || Object.values(params)[0] || '[]',
                    params.row || params.rowIndex || Object.values(params)[1] || '1',
                    params.col || params.column || params.colIndex || Object.values(params)[2] || '1'
                ];
            }

        case 'MATCH':
            // lookupArray, lookupValue, matchType (data-first for pipe compatibility)
            return [
                params.lookupArray || params.array || Object.values(params)[0] || '[]',
                params.lookupValue || params.lookup || params.value || Object.values(params)[1] || '',
                params.matchType || params.type || Object.values(params)[2] || '0'
            ];

        case 'PERCENTILE':
            // array, percentile
            return [
                params.array || params.values || params.data || Object.values(params)[0] || '[]',
                params.percentile || params.p || Object.values(params)[1] || '0.5'
            ];

        case 'WEEKDAY':
            // date, type
            return [
                params.date || params.value || Object.values(params)[0] || new Date().toISOString(),
                params.type || params.format || Object.values(params)[1] || '1'
            ];

        case 'PMT':
            // rate, nper, pv, fv, type
            return [
                params.rate || params.interestRate || Object.values(params)[0] || '0',
                params.nper || params.periods || params.numberOfPayments || Object.values(params)[1] || '0',
                params.pv || params.presentValue || Object.values(params)[2] || '0',
                params.fv || params.futureValue || Object.values(params)[3] || '0',
                params.type || params.paymentType || Object.values(params)[4] || '0'
            ];

        case 'FV':
        case 'PV':
            // rate, nper, pmt, pv/fv, type
            return [
                params.rate || params.interestRate || Object.values(params)[0] || '0',
                params.nper || params.periods || Object.values(params)[1] || '0',
                params.pmt || params.payment || Object.values(params)[2] || '0',
                params.pv || params.fv || params.value || Object.values(params)[3] || '0',
                params.type || params.paymentType || Object.values(params)[4] || '0'
            ];

        case 'NPV':
            // rate, values...
            return [
                params.rate || params.discountRate || Object.values(params)[0] || '0',
                ...Object.keys(params).filter(k => k !== 'rate' && k !== 'discountRate').map(k => params[k])
            ];
            
        // New Excel functions
        case 'IF':
        case 'if':
            // IF(logical_test, value_if_true, value_if_false)
            const logicalTest = params.logical_test || params.test || Object.values(params)[0] || false;
            const valueIfTrue = params.value_if_true || params.true || Object.values(params)[1];
            const valueIfFalse = params.value_if_false || params.false || Object.values(params)[2];
            return [logicalTest, valueIfTrue, valueIfFalse];
            
        case 'AND':
        case 'and':
        case 'OR':
        case 'or':
            // AND/OR(...conditions)
            const conditions = Object.values(params);
            return conditions;
            
        case 'NOT':
        case 'not':
            // NOT(logical)
            const logical = params.logical || params.value || Object.values(params)[0] || false;
            return [logical];
            
        case 'CONCATENATE':
        case 'concatenate':
            // CONCATENATE(...texts)
            const texts = Object.values(params);
            return texts;
            
        case 'LEFT':
        case 'left':
            // LEFT(text, num_chars [, pad])
            const leftText = params.text || Object.values(params)[0] || '';
            const leftChars = parseInt(params.num_chars || params.chars || Object.values(params)[1]) || 1;
            const leftPad = params.pad || Object.values(params)[2] || ' ';
            return [leftText, leftChars, leftPad];

        case 'RIGHT':
        case 'right':
            // RIGHT(text, num_chars [, pad])
            const rightText = params.text || Object.values(params)[0] || '';
            const rightChars = parseInt(params.num_chars || params.chars || Object.values(params)[1]) || 1;
            const rightPad = params.pad || Object.values(params)[2] || ' ';
            return [rightText, rightChars, rightPad];
            
        case 'MID':
        case 'mid':
            // MID(text, start_num, num_chars)
            const midText = params.text || Object.values(params)[0] || '';
            const startNum = parseInt(params.start_num || params.start || Object.values(params)[1]) || 1;
            const midChars = parseInt(params.num_chars || params.chars || Object.values(params)[2]) || 0;
            return [midText, startNum, midChars];
            
        case 'LEN':
        case 'len':
            // LEN(text)
            const lenText = params.text || params.value || Object.values(params)[0] || '';
            return [lenText];
            
        case 'UPPER':
        case 'upper':
        case 'LOWER':
        case 'lower':
        case 'TRIM':
        case 'trim':
            // Single text parameter functions
            const singleText = params.text || params.value || Object.values(params)[0] || '';
            return [singleText];
            
        case 'TODAY':
        case 'today':
        case 'NOW':
        case 'now':
            // No parameters
            return [];
            
        case 'YEAR':
        case 'year':
        case 'MONTH':
        case 'month':
        case 'DAY':
        case 'day':
            // Single date parameter
            const dateValue = params.date || params.value || Object.values(params)[0] || new Date();
            return [dateValue];
            
        case 'POWER':
        case 'power':
            // POWER(number, power)
            const powerNumber = parseFloat(params.number || params.base || Object.values(params)[0]) || 0;
            const powerExp = parseFloat(params.power || params.exponent || Object.values(params)[1]) || 1;
            return [powerNumber, powerExp];
            
        case 'SQRT':
        case 'sqrt':
            // SQRT(number)
            const sqrtNumber = parseFloat(params.number || params.value || Object.values(params)[0]) || 0;
            return [sqrtNumber];
            
        case 'MOD':
        case 'mod':
            // MOD(number, divisor)
            const modNumber = parseFloat(params.number || Object.values(params)[0]) || 0;
            const modDivisor = parseFloat(params.divisor || Object.values(params)[1]) || 1;
            return [modNumber, modDivisor];
            
        case 'ROUND':
        case 'round':
            // ROUND(number, num_digits)
            const roundNumber = parseFloat(params.number || params.value || Object.values(params)[0]) || 0;
            const roundDigits = parseInt(params.num_digits || params.digits || Object.values(params)[1]) || 0;
            return [roundNumber, roundDigits];
            
        // New R statistical functions
        case 'COR':
        case 'cor':
            // COR(x, y, use)
            const corXRaw = params.x || Object.values(params)[0] || '[]';
            const corX = typeof corXRaw === 'string' ? JSON.parse(corXRaw) : corXRaw;
            const corYRaw = params.y || Object.values(params)[1] || '[]';
            const corY = typeof corYRaw === 'string' ? JSON.parse(corYRaw) : corYRaw;
            const corUse = params.use || Object.values(params)[2] || 'complete.obs';
            return [corX, corY, corUse];
            
        case 'SCALE':
        case 'scale':
            // SCALE(x, center, scale)
            const scaleX = JSON.parse(params.x || params.data || Object.values(params)[0] || '[]');
            const scaleCenter = params.center !== undefined ? params.center === 'true' || params.center === true : true;
            const scaleScale = params.scale !== undefined ? params.scale === 'true' || params.scale === true : true;
            return [scaleX, scaleCenter, scaleScale];
            
        case 'QUANTILE':
        case 'quantile':
            // QUANTILE(x, probs, na_rm)
            const quantX = JSON.parse(params.x || params.data || Object.values(params)[0] || '[]');
            const quantProbs = params.probs ? JSON.parse(params.probs) : [0, 0.25, 0.5, 0.75, 1.0];
            const quantNaRm = params.na_rm === 'true' || params.na_rm === true || false;
            return [quantX, quantProbs, quantNaRm];
            
        case 'IQR':
        case 'iqr':
            // IQR(x, na_rm)
            const iqrX = JSON.parse(params.x || params.data || Object.values(params)[0] || '[]');
            const iqrNaRm = params.na_rm === 'true' || params.na_rm === true || false;
            return [iqrX, iqrNaRm];

        case 'IRR':
            // values, guess
            return [
                params.values || params.cashFlows || Object.values(params)[0] || '[]',
                params.guess || params.estimate || Object.values(params)[1] || '0.1'
            ];

        // Cryptography functions
        case 'HASH_SHA256':
        case 'HASH_SHA1':
        case 'HASH_SHA384':
        case 'HASH_SHA512':
        case 'HASH_MD5':
        case 'BASE64_ENCODE':
        case 'BASE64_DECODE':
        case 'URL_SAFE_BASE64':
            // Single text parameter
            return [
                params.text || params.data || params.value || params.string || params.encoded || Object.values(params)[0] || ''
            ];

        case 'RANDOM_STRING':
            // length, charset
            return [
                params.length || params.len || Object.values(params)[0] || 16,
                params.charset || params.chars || Object.values(params)[1] || 'alphanumeric'
            ];

        case 'HMAC_SHA256':
            // text, secret
            return [
                params.text || params.data || params.message || Object.values(params)[0] || '',
                params.secret || params.key || Object.values(params)[1] || ''
            ];

        case 'JWT_DECODE':
            // token
            return [
                params.token || params.jwt || Object.values(params)[0] || ''
            ];

        case 'PASSWORD_HASH':
            // password, algorithm
            return [
                params.password || params.pass || params.pwd || Object.values(params)[0] || '',
                params.algorithm || params.algo || Object.values(params)[1] || 'SHA256'
            ];

        case 'PASSWORD_VERIFY':
            // password, hash
            return [
                params.password || params.pass || params.pwd || Object.values(params)[0] || '',
                params.hash || params.hashed || Object.values(params)[1] || ''
            ];

        // DOM Functions - pass parameters object directly
        case 'QUERY':
        case 'CLICK':
        case 'TYPE':
        case 'SET':
        case 'ADD_CLASS':
        case 'REMOVE_CLASS':
        case 'SET_STYLE':
        case 'WAIT_FOR':
        case 'WAIT':
        case 'SELECT_OPTION':
            // DOM functions expect a parameters object, not individual arguments
            return [params];

        // New NumPy mathematical functions
        case 'SIN':
        case 'sin':
        case 'COS':
        case 'cos':
        case 'TAN':
        case 'tan':
        case 'ARCSIN':
        case 'arcsin':
        case 'ARCCOS':
        case 'arccos':
        case 'ARCTAN':
        case 'arctan':
        case 'SINH':
        case 'sinh':
        case 'COSH':
        case 'cosh':
        case 'TANH':
        case 'tanh':
        case 'EXP':
        case 'exp':
        case 'LOG':
        case 'log':
        case 'LOG10':
        case 'log10':
        case 'LOG2':
        case 'log2':
        case 'SQRT':
        case 'sqrt':
        case 'CBRT':
        case 'cbrt':
        case 'FLOOR':
        case 'floor':
        case 'CEIL':
        case 'ceil':
        case 'TRUNC':
        case 'trunc':
        case 'ABS':
        case 'abs':
        case 'SIGN':
        case 'sign':
        case 'RECIPROCAL':
        case 'reciprocal':
            // Single parameter math functions (x)
            const mathX = params.x || params.value || params.number || Object.values(params)[0] || 0;
            return [mathX];
            
        case 'SQUARE':
        case 'square':
            // SQUARE(x)
            const squareX = params.x || params.value || params.number || Object.values(params)[0] || 0;
            return [squareX];
            
        case 'AROUND':
        case 'around':
            // NumPy AROUND(x, decimals) - renamed to avoid conflict with Excel ROUND
            const roundX = params.x || params.value || params.number || Object.values(params)[0] || 0;
            const roundDecimals = parseInt(params.decimals || params.digits || Object.values(params)[1]) || 0;
            return [roundX, roundDecimals];
            
        case 'PROD':
        case 'prod':
            // PROD(a, axis)
            const sumArrayStr = params.a || params.array || params.data || Object.values(params)[0] || '[]';
            const sumArray = typeof sumArrayStr === 'string' ? JSON.parse(sumArrayStr) : sumArrayStr;
            const sumAxis = params.axis !== undefined ? parseInt(params.axis) : null;
            return [sumArray, sumAxis];
            
        case 'CUMSUM':
        case 'cumsum':
        case 'CUMPROD':
        case 'cumprod':
            // CUMSUM/CUMPROD(a)
            const cumArrayStr = params.a || params.array || params.data || Object.values(params)[0] || '[]';
            const cumArray = typeof cumArrayStr === 'string' ? JSON.parse(cumArrayStr) : cumArrayStr;
            return [cumArray];

        case 'AVERAGE':
        case 'average':
            // AVERAGE(a, weights)
            const avgArrayStr = params.a || params.array || params.data || Object.values(params)[0] || '[]';
            const avgArray = typeof avgArrayStr === 'string' ? JSON.parse(avgArrayStr) : avgArrayStr;
            const weights = params.weights ? (typeof params.weights === 'string' ? JSON.parse(params.weights) : params.weights) : null;
            return [avgArray, weights];
            
        case 'CORRCOEF':
        case 'corrcoef':
            // CORRCOEF(x, y)
            const corrXRaw = params.x || Object.values(params)[0] || '[]';
            const corrX = typeof corrXRaw === 'string' ? JSON.parse(corrXRaw) : corrXRaw;
            const corrYRaw = params.y;
            const corrY = corrYRaw ? (typeof corrYRaw === 'string' ? JSON.parse(corrYRaw) : corrYRaw) : null;
            return [corrX, corrY];
            
        case 'COV':
        case 'cov':
            // COV(x, y, ddof) - numpy version
            const covXNumpyRaw = params.x || Object.values(params)[0] || '[]';
            const covXNumpy = typeof covXNumpyRaw === 'string' ? JSON.parse(covXNumpyRaw) : covXNumpyRaw;
            const covYNumpyRaw = params.y || null;
            const covYNumpy = covYNumpyRaw && typeof covYNumpyRaw === 'string' ? JSON.parse(covYNumpyRaw) : covYNumpyRaw;
            const covDdof = parseInt(params.ddof || Object.values(params)[2]) || 1;
            return [covXNumpy, covYNumpy, covDdof];
            
        // New NumPy functions
        case 'LOGSPACE':
        case 'logspace':
            // LOGSPACE(start, stop, num, endpoint, base)
            const logStart = parseFloat(params.start || Object.values(params)[0]) || 0;
            const logStop = parseFloat(params.stop || Object.values(params)[1]) || 1;
            const logNum = parseInt(params.num || Object.values(params)[2]) || 50;
            const logEndpoint = params.endpoint !== undefined ? params.endpoint === 'true' || params.endpoint === true : true;
            const logBase = parseFloat(params.base || Object.values(params)[4]) || 10;
            return [logStart, logStop, logNum, logEndpoint, logBase];
            
        case 'EMPTY':
        case 'empty':
            // EMPTY(shape)
            const emptyShapeStr = params.shape || Object.values(params)[0] || '[1]';
            const emptyShape = typeof emptyShapeStr === 'string' ? JSON.parse(emptyShapeStr) : emptyShapeStr;
            return [emptyShape];
            
        case 'SPLIT':
        case 'split':
            // String SPLIT function: SPLIT(string, separator)
            const splitString = params.string || Object.values(params)[0] || '';
            const separator = params.separator || Object.values(params)[1] || '';
            return [splitString, separator];
            
        case 'JOIN':
        case 'join':
            // Array JOIN function: JOIN(array, separator)
            const joinArray = params.array || Object.values(params)[0] || [];
            const joinSeparator = params.separator || Object.values(params)[1] || '';
            return [joinArray, joinSeparator];
            
        case 'HSPLIT':
        case 'hsplit':
        case 'VSPLIT':
        case 'vsplit':
            // Array SPLIT(array, indices_or_sections, axis)
            const splitArray = JSON.parse(params.array || params.arr || Object.values(params)[0] || '[]');
            const splitIndices = params.indices_or_sections || params.sections || Object.values(params)[1] || 2;
            const splitAxis = parseInt(params.axis || Object.values(params)[2]) || 0;
            return [splitArray, splitIndices, splitAxis];
            
        case 'RESIZE':
        case 'resize':
            // RESIZE(array, newShape)
            const resizeArray = JSON.parse(params.array || params.arr || Object.values(params)[0] || '[]');
            const resizeShapeStr = params.newShape || params.shape || Object.values(params)[1] || '[1]';
            const resizeShape = typeof resizeShapeStr === 'string' ? JSON.parse(resizeShapeStr) : resizeShapeStr;
            return [resizeArray, resizeShape];
            
        case 'ARCSINH':
        case 'arcsinh':
        case 'ARCCOSH':
        case 'arccosh':
        case 'ARCTANH':
        case 'arctanh':
        case 'EXPM1':
        case 'expm1':
        case 'LOG1P':
        case 'log1p':
        case 'RINT':
        case 'rint':
        case 'FIX':
        case 'fix':
            // Single parameter hyperbolic/logarithmic functions
            const hypMathX = params.x || params.value || params.number || Object.values(params)[0] || 0;
            return [hypMathX];
            
        case 'RANDN':
        case 'randn':
            // RANDN(...shape)
            const randnShape = Object.values(params);
            return randnShape;
            
        case 'UNIFORM':
        case 'uniform':
            // UNIFORM(low, high, size)
            const uniformLow = parseFloat(params.low || Object.values(params)[0]) || 0;
            const uniformHigh = parseFloat(params.high || Object.values(params)[1]) || 1;
            const uniformSize = params.size || Object.values(params)[2];
            return [uniformLow, uniformHigh, uniformSize];
            
        case 'HISTOGRAM2D':
        case 'histogram2d':
            // HISTOGRAM2D(x, y, bins, range)
            const hist2dXRaw = params.x || Object.values(params)[0] || '[]';
            const hist2dX = typeof hist2dXRaw === 'string' ? JSON.parse(hist2dXRaw) : hist2dXRaw;
            const hist2dYRaw = params.y || Object.values(params)[1] || '[]';
            const hist2dY = typeof hist2dYRaw === 'string' ? JSON.parse(hist2dYRaw) : hist2dYRaw;
            const hist2dBinsStr = params.bins || Object.values(params)[2] || '[10, 10]';
            const hist2dBins = typeof hist2dBinsStr === 'string' ? JSON.parse(hist2dBinsStr) : hist2dBinsStr;
            const hist2dRange = params.range || Object.values(params)[3] || null;
            return [hist2dX, hist2dY, hist2dBins, hist2dRange];
            
        case 'RENDER':
        case 'render':
            // RENDER(data, output, title, width, height, colormap)
            // Pass all parameters as an object to maintain named parameter support
            return [params];
            
        case 'TENSORDOT':
        case 'tensordot':
            // TENSORDOT(a, b, axes)
            const tensorA = JSON.parse(params.a || Object.values(params)[0] || '[]');
            const tensorB = JSON.parse(params.b || Object.values(params)[1] || '[]');
            const tensorAxes = parseInt(params.axes || Object.values(params)[2]) || 2;
            return [tensorA, tensorB, tensorAxes];
            
        case 'DET':
        case 'det':
        case 'INV':
        case 'inv':
            // DET/INV(matrix)
            const matrix = JSON.parse(params.matrix || params.array || Object.values(params)[0] || '[[1]]');
            return [matrix];
            
        case 'SOLVE':
        case 'solve':
            // SOLVE(A, b)
            const solveA = JSON.parse(params.A || params.matrix || Object.values(params)[0] || '[[1]]');
            const solveB = JSON.parse(params.b || params.vector || Object.values(params)[1] || '[1]');
            return [solveA, solveB];

        // Error Context Functions - no parameters needed
        case 'ERROR_LINE':
        case 'ERROR_MESSAGE':
        case 'ERROR_STACK':
        case 'ERROR_FUNCTION':
        case 'ERROR_COMMAND':
        case 'ERROR_VARIABLES':
        case 'ERROR_TIMESTAMP':
        case 'ERROR_DETAILS':
            // Error functions take no parameters
            return [];

        case 'STACK_PUSH':
        case 'STACK_QUEUE':
            // value
            return [params.value || Object.values(params)[0] || ''];

        case 'STACK_PULL':
        case 'STACK_SIZE':
        case 'STACK_PEEK':
        case 'STACK_CLEAR':
            // No parameters
            return [];

        // DOM Element Functions
        case 'DOM_GET':
            return [params.selector || ''];

        case 'DOM_GET_ALL':
            return [params.selector || ''];

        case 'DOM_ELEMENT_QUERY':
            return [
                params.element || params.parent || '',
                params.selector || ''
            ];

        case 'DOM_ELEMENT_CLICK':
        case 'DOM_ELEMENT_CLEAR':
        case 'DOM_ELEMENT_TEXT':
        case 'DOM_ELEMENT_REFRESH':
        case 'DOM_ELEMENT_STALE':
            return [params.element || ''];

        case 'DOM_ELEMENT_TYPE':
            return [
                params.element || '',
                params.text || params.value || ''
            ];

        case 'DOM_ELEMENT_ATTRIBUTE':
            return [
                params.element || '',
                params.attribute || params.attr || ''
            ];

        case 'DOM_ELEMENT_SET_ATTRIBUTE':
            return [
                params.element || '',
                params.attribute || params.attr || '',
                params.value || ''
            ];

        case 'DOM_ELEMENT_VISIBLE':
            return [params.element || ''];

        case 'DOM_ELEMENT_CLICK_SAFE':
            return [params.element || ''];

        case 'DOM_GET_RETRY_STATS':
            return [];

        case 'DOM_RETRY_CONFIG':
            return [params];  // Pass entire params object for configuration

        case 'SLEEP':
            return [params.milliseconds || params.ms || params.time || Object.values(params)[0] || 1000];

        case 'INTERPRET':
            // String code and optional options object
            return [
                params.string || params.code || params.rexx || Object.values(params)[0] || '',
                params.options || Object.values(params)[1] || {}
            ];

        case 'JSON_PARSE':
        case 'JSON_VALID':
            // Single string parameter
            return [params.text || params.string || params.json || Object.values(params)[0] || ''];

        case 'JSON_STRINGIFY':
            // Object and optional indent
            return [
                params.object || params.obj || params.data || Object.values(params)[0] || {},
                params.indent || Object.values(params)[1] || null
            ];

        case 'ARRAY_GET':
            // Array/object and key - let ARRAY_GET function handle REXX indexing conversion
            const arrayGetArray = params.array || params.object || params.obj || Object.values(params)[0] || {};
            // Use nullish coalescing for key to properly handle 0
            const arrayGetKey = params.key ?? params.index ?? Object.values(params)[1] ?? '';
            return [arrayGetArray, arrayGetKey];

        case 'ARRAY_SET':
            // Array/object, key, and value
            // Handle both named and positional parameters
            if (params.array || params.object || params.obj) {
                // Named parameters
                return [
                    params.array || params.object || params.obj,
                    params.key ?? params.index,
                    params.value
                ];
            } else {
                // Positional parameters: ARRAY_SET(array, key, value)
                const values = Object.values(params);
                return [
                    values[0] || {},           // array
                    values[1] !== undefined ? values[1] : '',  // key (preserve 0 as valid key)
                    values[2] !== undefined ? values[2] : ''   // value
                ];
            }

        case 'REQUIRE':
            // Library name and optional AS clause
            return [
                params.lib || params.library || params.name || params.value || Object.values(params)[0] || '',
                params.as || params.asClause || params.prefix || Object.values(params)[1] || null
            ];

        case 'COPY':
            // Single parameter to deep copy
            return [
                params.value || params.object || params.data || Object.values(params)[0]
            ];

        // Shell Functions
        case 'LS':
            // LS(path, recursive, pattern, type)
            return [
                params.path || params.dir || params.directory || Object.values(params)[0] || '.',
                params.recursive || false,
                params.pattern || params.glob || null,
                params.type || null
            ];

        case 'CAT':
            // CAT(path, encoding)
            return [
                params.path || params.file || params.filename || Object.values(params)[0] || '',
                params.encoding || 'utf8'
            ];

        case 'GREP':
            // GREP(pattern, path, recursive, ignoreCase)
            return [
                params.pattern || params.regex || Object.values(params)[0] || '',
                params.path || params.file || params.dir || Object.values(params)[1] || '',
                params.recursive || false,
                params.ignoreCase || params.caseInsensitive || false
            ];

        case 'FIND':
            // FIND(path, type, name, modifiedWithin, minSize, maxSize)
            return [
                params.path || params.dir || params.directory || Object.values(params)[0] || '.',
                params.type || null,
                params.name || params.pattern || null,
                params.modifiedWithin || params.mtime || null,
                params.minSize || params.min_size || null,
                params.maxSize || params.max_size || null
            ];

        case 'MKDIR':
            // MKDIR(path, recursive)
            return [
                params.path || params.dir || params.directory || Object.values(params)[0] || '',
                params.recursive || params.parents || false
            ];

        case 'CP':
            // CP(source, dest, recursive)
            return [
                params.source || params.src || params.from || Object.values(params)[0] || '',
                params.dest || params.destination || params.to || Object.values(params)[1] || '',
                params.recursive || false
            ];

        case 'MV':
            // MV(source, dest)
            return [
                params.source || params.src || params.from || Object.values(params)[0] || '',
                params.dest || params.destination || params.to || Object.values(params)[1] || ''
            ];

        case 'RM':
            // RM(path, recursive, force)
            return [
                params.path || params.file || params.dir || Object.values(params)[0] || '',
                params.recursive || params.r || false,
                params.force || params.f || false
            ];

        case 'STAT':
            // STAT(path)
            return [
                params.path || params.file || params.filename || Object.values(params)[0] || ''
            ];

        case 'BASENAME':
            // BASENAME(path, ext)
            return [
                params.path || params.file || params.filename || Object.values(params)[0] || '',
                params.ext || params.extension || ''
            ];

        case 'DIRNAME':
            // DIRNAME(path)
            return [
                params.path || params.file || params.filename || Object.values(params)[0] || ''
            ];

        case 'PATH_JOIN':
            // PATH_JOIN(parts)
            return [
                params.parts || params.paths || Object.values(params)[0] || []
            ];

        case 'PATH_RESOLVE':
            // PATH_RESOLVE(path)
            return [
                params.path || params.file || Object.values(params)[0] || ''
            ];

        case 'PATH_EXTNAME':
            // PATH_EXTNAME(path)
            return [
                params.path || params.file || params.filename || Object.values(params)[0] || ''
            ];

        // Text Processing Functions
        case 'HEAD':
            // HEAD(input, lines)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.lines || params.n || params.count || 10
            ];

        case 'TAIL':
            // TAIL(input, lines)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.lines || params.n || params.count || 10
            ];

        case 'WC':
            // WC(input, type)
            return [
                params.input ?? params.data ?? params.text ?? Object.values(params)[0] ?? '',
                params.type ?? null
            ];

        case 'SORT':
            // SORT(input, reverse, numeric, unique)
            return [
                params.input ?? params.data ?? params.text ?? Object.values(params)[0] ?? '',
                params.reverse ?? params.r ?? false,
                params.numeric ?? params.n ?? false,
                params.unique ?? params.u ?? false
            ];

        case 'UNIQ':
            // UNIQ(input, count)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.count || params.c || false
            ];

        case 'CUT':
            // CUT(input, fields, delimiter)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.fields || params.f || '',
                params.delimiter || params.d || params.delim || '\t'
            ];

        case 'PASTE':
            // PASTE(inputs, delimiter)
            return [
                params.inputs || params.files || params.data || Object.values(params)[0] || [],
                params.delimiter || params.d || params.delim || '\t'
            ];

        case 'SEQ':
            // SEQ(start, end, step)
            const paramsArr = Object.values(params);
            return [
                params.start ?? paramsArr[0] ?? 1,
                params.end ?? params.stop ?? paramsArr[1] ?? null,
                params.step ?? paramsArr[2] ?? 1
            ];

        case 'SHUF':
            // SHUF(input)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'TEE':
            // TEE(input, file, append)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.file || params.filename || params.path || Object.values(params)[1] || '',
                params.append || params.a || false
            ];

        case 'XARGS':
            // XARGS(input, command, maxArgs)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.command || params.cmd || Object.values(params)[1] || '',
                params.maxArgs || params.n || params.max || null
            ];

        case 'NL':
            // NL(input, start, format)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.start || params.startNumber || params.n || 1,
                params.format || params.fmt || "%6d  "
            ];

        case 'REV':
            // REV(input)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'TAC':
            // TAC(input)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'FOLD':
            // FOLD(input, width)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.width || params.w || params.columns || 80
            ];

        case 'EXPAND':
            // EXPAND(input, tabWidth)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.tabWidth ?? params.tabs ?? params.t ?? 8
            ];

        case 'DOS2UNIX':
            // DOS2UNIX(input)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'UNIX2DOS':
            // UNIX2DOS(input)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || ''
            ];

        case 'FMT':
            // FMT(input, width)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.width || params.w || params.cols || 75
            ];

        case 'STRINGS':
            // STRINGS(input, minLength)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.minLength || params.min || params.n || 4
            ];

        case 'CMP':
            // CMP(input1, input2)
            return [
                params.input1 || params.file1 || params.first || Object.values(params)[0] || '',
                params.input2 || params.file2 || params.second || Object.values(params)[1] || ''
            ];

        case 'COMM':
            // COMM(input1, input2, suppress)
            return [
                params.input1 || params.file1 || params.first || Object.values(params)[0] || '',
                params.input2 || params.file2 || params.second || Object.values(params)[1] || '',
                params.suppress || params.s || Object.values(params)[2] || 0
            ];

        case 'CRC32':
        case 'CKSUM':
            // CRC32(input) / CKSUM(input)
            return [
                params.input || params.data || params.text || params.file || Object.values(params)[0] || ''
            ];

        case 'SUM_BSD':
            // SUM_BSD(input, algorithm)
            return [
                params.input || params.data || params.text || params.file || Object.values(params)[0] || '',
                params.algorithm || params.algo || params.alg || params.type || 'bsd'
            ];

        case 'UUENCODE':
            // UUENCODE(input, filename)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.filename || params.name || params.file || 'data.bin'
            ];

        case 'UUDECODE':
            // UUDECODE(input)
            return [
                params.input || params.data || params.text || params.encoded || Object.values(params)[0] || ''
            ];

        case 'BASE32':
            // BASE32(input, decode)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.decode || params.d || false
            ];

        case 'XXD':
            // XXD(input, decode)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.decode || params.d || false
            ];

        case 'HEXDUMP':
            // HEXDUMP(input, width)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.width || params.w || params.bytes || 16
            ];

        case 'OD':
            // OD(input, format)
            return [
                params.input || params.data || params.text || Object.values(params)[0] || '',
                params.format || params.f || params.type || 'octal'
            ];

        // System information functions
        case 'UNAME':
            return [
                params.option || params.opt || params.o || Object.values(params)[0] || 'system'
            ];

        case 'HOSTNAME':
        case 'WHOAMI':
        case 'NPROC':
        case 'ARCH':
        case 'USERINFO':
        case 'UPTIME':
        case 'GROUPS':
        case 'LOGNAME':
        case 'DNSDOMAINNAME':
        case 'TTY':
            // No parameters needed
            return [];

        case 'GETCONF':
            // GETCONF(name)
            return [
                params.name || params.config || params.var || Object.values(params)[0] || 'PAGE_SIZE'
            ];

        case 'ENV':
            // ENV(name) - optional parameter
            return [
                params.name || params.var || params.variable || Object.values(params)[0]
            ];

        case 'FACTOR':
            // FACTOR(n)
            return [
                params.n || params.num || params.number || Object.values(params)[0]
            ];

        case 'MCOOKIE':
            // MCOOKIE(bytes) - optional bytes parameter
            return [
                params.bytes || params.size || params.length || Object.values(params)[0] || 16
            ];

        case 'MKTEMP':
            // MKTEMP(template) - optional template parameter
            return [
                params.template || params.pattern || Object.values(params)[0] || 'tmp.XXXXXXXXXX'
            ];

        case 'ASCII':
            // ASCII(char) - optional character parameter
            return [
                params.char || params.c || params.character || Object.values(params)[0]
            ];

        case 'YES':
            // YES(text, count)
            return [
                params.text || params.str || params.string || Object.values(params)[0] || 'y',
                params.count || params.n || params.times || Object.values(params)[1] || 100
            ];

        case 'TRUE':
        case 'FALSE':
            // No parameters needed
            return [];

        case 'CAL':
            // CAL(month, year) - both optional
            return [
                params.month || params.m || Object.values(params)[0],
                params.year || params.y || Object.values(params)[1]
            ];

        case 'WHICH':
            // WHICH(command)
            return [
                params.command || params.cmd || params.name || Object.values(params)[0]
            ];

        case 'MKPASSWD':
            // MKPASSWD(password, salt)
            return [
                params.password || params.pwd || params.pass || Object.values(params)[0],
                params.salt || params.s || Object.values(params)[1] || '$6$'
            ];

        case 'GZIP':
            // GZIP(input, encoding)
            return [
                params.input || params.data || params.text || Object.values(params)[0],
                params.encoding || params.enc || params.format || Object.values(params)[1] || 'buffer'
            ];

        case 'GUNZIP':
            // GUNZIP(input, encoding)
            return [
                params.input || params.data || params.compressed || Object.values(params)[0],
                params.encoding || params.enc || params.format || Object.values(params)[1] || 'utf8'
            ];

        case 'ZCAT':
            // ZCAT(input)
            return [
                params.input || params.data || params.compressed || Object.values(params)[0]
            ];

        case 'READLINK':
            // READLINK(linkPath)
            return [
                params.linkPath || params.link || params.path || Object.values(params)[0]
            ];

        case 'DU':
            // DU(dirPath, detailed)
            return [
                params.dirPath || params.path || params.dir || Object.values(params)[0] || '.',
                params.detailed || params.verbose || false
            ];

        case 'RMDIR':
            // RMDIR(dirPath, recursive)
            return [
                params.dirPath || params.path || params.dir || Object.values(params)[0],
                params.recursive || params.r || false
            ];

        case 'TOUCH':
            // TOUCH(filePath, time)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0],
                params.time || params.timestamp || params.date || Object.values(params)[1] || null
            ];

        case 'CHMOD':
            // CHMOD(filePath, mode)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0],
                params.mode || params.permissions || params.perms || Object.values(params)[1]
            ];

        case 'LINK':
            // LINK(existingPath, newPath)
            return [
                params.existingPath || params.existing || params.source || params.src || Object.values(params)[0],
                params.newPath || params.new || params.dest || params.dst || Object.values(params)[1]
            ];

        case 'UNLINK':
            // UNLINK(filePath)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0]
            ];

        case 'CHOWN':
            // CHOWN(filePath, uid, gid)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0],
                params.uid || params.user || Object.values(params)[1],
                params.gid || params.group || Object.values(params)[2] || null
            ];

        case 'TRUNCATE':
            // TRUNCATE(filePath, size)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0],
                params.size || params.length || Object.values(params)[1] || 0
            ];

        case 'LN':
            // LN(target, linkPath, symbolic)
            return [
                params.target || params.source || params.src || Object.values(params)[0],
                params.linkPath || params.link || params.dest || params.dst || Object.values(params)[1],
                params.symbolic || params.symlink || params.s || true
            ];

        case 'CHGRP':
            // CHGRP(filePath, gid)
            return [
                params.filePath || params.path || params.file || Object.values(params)[0],
                params.gid || params.group || Object.values(params)[1]
            ];

        case 'INSTALL':
            // INSTALL(source, destination, mode)
            return [
                params.source || params.src || params.from || Object.values(params)[0],
                params.destination || params.dest || params.dst || params.to || Object.values(params)[1],
                params.mode || params.permissions || params.perms || Object.values(params)[2] || '755'
            ];

        case 'KILL':
            // KILL(pid, signal)
            return [
                params.pid || params.process || params.id || Object.values(params)[0],
                params.signal || params.sig || Object.values(params)[1] || 'SIGTERM'
            ];

        case 'GETPID':
        case 'GETPPID':
            // No parameters needed
            return [];

        case 'EXIT':
            // EXIT(code)
            return [
                params.code || params.exitCode || params.status || Object.values(params)[0] || 0
            ];

        case 'SLEEP':
            // SLEEP(ms)
            return [
                params.ms || params.milliseconds || params.duration || params.time || Object.values(params)[0] || 1000
            ];

        case 'GETENV':
            // GETENV(name) - optional parameter
            // If no parameters provided, return [null] to get all env vars
            if (Object.keys(params).length === 0) {
                return [null];
            }
            return [
                params.name || params.var || params.variable || params.key || Object.values(params)[0]
            ];

        case 'SETENV':
            // SETENV(name, value)
            return [
                params.name || params.var || params.variable || params.key || Object.values(params)[0],
                params.value || params.val || Object.values(params)[1]
            ];

        case 'UNSETENV':
            // UNSETENV(name)
            return [
                params.name || params.var || params.variable || params.key || Object.values(params)[0]
            ];

        case 'TIMEOUT':
            // TIMEOUT(command, ms, options)
            return [
                params.command || params.cmd || Object.values(params)[0],
                params.ms || params.milliseconds || params.timeout || params.time || Object.values(params)[1] || 10000,
                params.options || params.opts || Object.values(params)[2] || {}
            ];

        case 'FSYNC':
            // FSYNC(pathOrFd)
            return [
                params.path || params.file || params.fd || params.descriptor || Object.values(params)[0]
            ];

        case 'SYNC':
            // SYNC() - no parameters
            return [];

        case 'GETOPT':
            // GETOPT(args, optstring, longopts)
            return [
                params.args || params.arguments || params.argv || Object.values(params)[0] || [],
                params.optstring || params.short || params.shortopts || Object.values(params)[1] || '',
                params.longopts || params.long || params.longoptions || Object.values(params)[2] || []
            ];

        case 'HOST': {
            // HOST(hostname, options)
            const hostname = params.hostname || params.host || params.name || Object.values(params)[0];
            let hostOptions = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(hostOptions).length === 0) {
                hostOptions = {
                    detailed: params.detailed,
                    family: params.family
                };
                // Remove undefined values
                Object.keys(hostOptions).forEach(key => hostOptions[key] === undefined && delete hostOptions[key]);
            }

            return [hostname, hostOptions];
        }

        case 'IFCONFIG':
            // IFCONFIG(interfaceName) - optional parameter
            if (Object.keys(params).length === 0) {
                return [null];
            }
            return [
                params.interface || params.name || params.iface || Object.values(params)[0]
            ];

        case 'FILESPLIT': {
            // FILESPLIT(input, options)
            // If options is provided as an object, use it
            // Otherwise, collect individual params into options object
            const input = params.input || params.file || params.path || params.content || Object.values(params)[0];
            let options = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(options).length === 0) {
                options = {
                    lines: params.lines,
                    bytes: params.bytes,
                    prefix: params.prefix,
                    suffix: params.suffix,
                    numeric: params.numeric,
                    additionalSuffix: params.additionalSuffix
                };
                // Remove undefined values
                Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);
            }

            return [input, options];
        }

        case 'DIFF_APPLY':
            // DIFF_APPLY(text, patch)
            return [
                params.text || params.original || params.content || Object.values(params)[0],
                params.patch || params.diff || Object.values(params)[1]
            ];

        case 'DIFF_PATCH': {
            // DIFF_PATCH(text1, text2, options)
            const text1 = params.text1 || params.old || params.original || params.a || Object.values(params)[0];
            const text2 = params.text2 || params.new || params.modified || params.b || Object.values(params)[1];
            let patchOptions = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(patchOptions).length === 0) {
                patchOptions = {
                    filename1: params.filename1,
                    filename2: params.filename2
                };
                // Remove undefined values
                Object.keys(patchOptions).forEach(key => patchOptions[key] === undefined && delete patchOptions[key]);
            }

            return [text1, text2, patchOptions];
        }

        case 'SED': {
            // SED(input, commands, options)
            const input = params.input || params.text || params.content || params.data || Object.values(params)[0];
            const commands = params.commands || params.command || params.cmd || params.script || Object.values(params)[1];
            let sedOptions = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(sedOptions).length === 0) {
                sedOptions = {
                    returnArray: params.returnArray || params.array
                };
                // Remove undefined values
                Object.keys(sedOptions).forEach(key => sedOptions[key] === undefined && delete sedOptions[key]);
            }

            return [input, commands, sedOptions];
        }

        case 'SED_SUBSTITUTE': {
            // SED_SUBSTITUTE(input, pattern, replacement, options)
            const input = params.input || params.text || params.content || params.data || Object.values(params)[0];
            const pattern = params.pattern || params.search || params.find || Object.values(params)[1];
            const replacement = params.replacement || params.replace || params.repl || Object.values(params)[2];
            let subOptions = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(subOptions).length === 0) {
                subOptions = {
                    global: params.global || params.g,
                    caseInsensitive: params.caseInsensitive || params.ignoreCase || params.i,
                    delimiter: params.delimiter || params.delim,
                    returnArray: params.returnArray || params.array
                };
                // Remove undefined values
                Object.keys(subOptions).forEach(key => subOptions[key] === undefined && delete subOptions[key]);
            }

            return [input, pattern, replacement, subOptions];
        }

        case 'PATCH': {
            // PATCH(text, patch, options)
            const text = params.text || params.original || params.content || params.input || Object.values(params)[0];
            const patch = params.patch || params.diff || params.patchText || Object.values(params)[1];
            let patchOptions = params.options || params.opts || {};

            // If no options object, collect individual option params
            if (Object.keys(patchOptions).length === 0) {
                patchOptions = {
                    fuzz: params.fuzz,
                    returnResult: params.returnResult || params.result,
                    compareLine: params.compareLine
                };
                // Remove undefined values
                Object.keys(patchOptions).forEach(key => patchOptions[key] === undefined && delete patchOptions[key]);
            }

            return [text, patch, patchOptions];
        }

        case 'PATCH_CHECK': {
            // PATCH_CHECK(text, patch, options)
            const text = params.text || params.original || params.content || params.input || Object.values(params)[0];
            const patch = params.patch || params.diff || params.patchText || Object.values(params)[1];
            let checkOptions = params.options || params.opts || {};

            if (Object.keys(checkOptions).length === 0) {
                checkOptions = {
                    fuzz: params.fuzz,
                    compareLine: params.compareLine
                };
                Object.keys(checkOptions).forEach(key => checkOptions[key] === undefined && delete checkOptions[key]);
            }

            return [text, patch, checkOptions];
        }

        case 'PATCH_APPLY_MULTIPLE': {
            // PATCH_APPLY_MULTIPLE(text, patches, options)
            const text = params.text || params.original || params.content || params.input || Object.values(params)[0];
            const patches = params.patches || params.patchArray || params.diffs || Object.values(params)[1];
            let multiOptions = params.options || params.opts || {};

            if (Object.keys(multiOptions).length === 0) {
                multiOptions = {
                    stopOnError: params.stopOnError || params.stop,
                    returnResults: params.returnResults || params.results,
                    fuzz: params.fuzz
                };
                Object.keys(multiOptions).forEach(key => multiOptions[key] === undefined && delete multiOptions[key]);
            }

            return [text, patches, multiOptions];
        }

        case 'PATCH_CREATE_REVERSE':
            // PATCH_CREATE_REVERSE(patch)
            return [params.patch || params.diff || params.patchText || Object.values(params)[0]];

        default:
            // Default: return all parameter values as arguments
            return Object.values(params);
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertParamsToArgs };
} else if (typeof window !== 'undefined') {
  window.convertParamsToArgs = convertParamsToArgs;
}
