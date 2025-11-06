# Function Reference

Comprehensive cross-reference catalog of all 400+ functions available in the Rexx interpreter, organized by category with implementation status and availability.

## Function Resolution Order

When a function is called, the interpreter resolves it using this priority order:

1. **Built-in REXX functions** (LENGTH, SUBSTR, POS, etc.) - Always available regardless of ADDRESS context
2. **External functions** from REQUIRE'd libraries
3. **ADDRESS handler custom methods** - Only checked if not a built-in function
4. **Browser functions** (executeBrowserStringFunction)
5. **RPC/fallback** handler

This ensures:
- Standard REXX functions like `LENGTH()`, `SUBSTR()`, `POS()` always work, even when inside an ADDRESS context
- ADDRESS handlers can define custom methods without conflicting with built-in functions
- DOM functions use `DOM_` prefix (`DOM_QUERY`, `DOM_CLICK`, etc.) to avoid naming conflicts with ADDRESS handler methods

## Legend

### Status
- ✅ **Pure JS**: Works anywhere JavaScript runs
- 🟡 **Environment-dependent**: Works in specific environments or has limitations  
- 🔴 **External required**: Needs RPC, APIs, file system, or external services

### Execution Mode
- **Autonomous Web**: Direct browser execution, self-contained
- **Controlled Web**: Director/Worker iframe architecture with postMessage
- **Command-line**: Server or desktop command-line execution with file system access (Node.js dependency)
- **All modes**: Language is the same but not all features and integrations available everywhere
- **External**: Requires external services or RPC connections

## Function Categories

### Core Language Functions

**[String Functions](04-string-functions.md)** - 25+ functions
- Basic operations: `LENGTH`, `UPPER`, `LOWER`, `SUBSTRING`, `INDEXOF`
- Advanced processing: `SPLIT`, `JOIN`, `REPLACE`, `TRIM`, `PADLEFT`
- Text manipulation: `CAPITALIZE`, `TITLECASE`, `SWAPCASE`, `REVERSE`
- Status: ✅ Pure JS, All modes

**[Mathematical Functions](05-math-functions.md)** - 25+ functions  
- Basic arithmetic: `ABS`, `SQRT`, `POWER`, `MAX`, `MIN`
- Trigonometry: `SIN`, `COS`, `TAN`, `ASIN`, `ACOS`, `ATAN`, `ATAN2`
- Logarithms: `LOG`, `LOG10`, `EXP`
- Rounding: `FLOOR`, `CEIL`, `ROUND`, `TRUNC`, `SIGN`
- Statistics: `REGRESSION`, `FORECAST`
- Status: ✅ Pure JS, All modes

**[Array Functions](06-array-functions.md)** - 18+ functions
- Creation/modification: `ARRAY_CREATE`, `ARRAY_PUSH`, `ARRAY_POP`, `ARRAY_SHIFT`
- Processing: `ARRAY_MAP`, `ARRAY_FILTER`, `ARRAY_REDUCE`, `ARRAY_SORT`
- Searching: `ARRAY_INCLUDES`, `ARRAY_INDEXOF`, `ARRAY_FIND`, `ARRAY_UNIQUE`
- Utilities: `ARRAY_FLATTEN`
- Status: ✅ Pure JS, Both environments

**[JSON Functions](08-json-functions.md)** - 21+ functions
- Core operations: `JSON_PARSE`, `JSON_STRINGIFY`, `JSON_GET`, `JSON_SET`
- Advanced processing: `JSON_PATH`, `JSON_FLATTEN`, `JSON_MERGE`, `JSON_CLONE`
- Validation: `JSON_VALIDATE`, `JSON_SCHEMA_VALIDATE`, `JSON_DIFF`, `JSON_PATCH`
- Status: ✅ Pure JS, Both environments

### Data Processing Functions

**[Date/Time Functions](07-datetime-functions.md)** - 17+ functions
- Current values: `DATE`, `TIME`, `NOW`, `TIMESTAMP`
- Formatting: `DATEFORMAT`, `DATEPARSE`, `DAYNAME`, `MONTHNAME`
- Calculations: `DATEADD`, `DATEDIFF`, `QUARTER`, `WEEKOFYEAR`
- Status: ✅ Pure JS, Both environments

**[Validation Functions](11-validation-functions.md)** - 29+ functions
- Format validation: `IS_EMAIL`, `IS_URL`, `IS_PHONE`, `IS_CREDIT_CARD`
- Type checking: `IS_NUMBER`, `IS_INTEGER`, `IS_BOOLEAN`, `IS_DATE`
- Network validation: `IS_IP`, `IS_MAC`, `IS_UUID`
- Content validation: `IS_ALPHA`, `IS_ALPHANUMERIC`, `IS_EMPTY`, `IS_JSON`
- Advanced validation: `VALIDATE_SCHEMA`, `CHECK_TYPES`
- Status: ✅ Pure JS, Both environments

**[Regular Expression Functions](17-regex-functions.md)** - 4+ functions
- Pattern matching: `REGEX_MATCH`, `REGEX_EXTRACT`, `REGEX_REPLACE`, `REGEX_SPLIT`
- Full JavaScript regex engine support with flags and capture groups
- Status: ✅ Pure JS, Both environments

### Statistical and Scientific Functions

**[R-Language Functions](15-r-functions.md)** - 150+ functions
- **Summary functions**: `R_MAX`, `R_MIN`, `R_SUM`, `R_MEAN`, `R_MEDIAN`, `R_VAR`, `R_SD`
- **Mathematical functions**: `R_SQRT`, `R_LOG`, `R_EXP`, `R_SIN`, `R_COS`, `R_TAN`
- **Matrix operations**: `R_MATRIX`, `R_CBIND`, `R_RBIND`, `R_T`, `R_DET`, `R_SOLVE`, `R_EIGEN`
- **Data manipulation**: `R_C`, `R_REP`, `R_SEQ`, `R_SORT`, `R_UNIQUE`, `R_WHICH`
- **Apply functions**: `R_APPLY`, `R_LAPPLY`, `R_SAPPLY`, `R_MAPPLY`
- **String functions**: `R_PASTE`, `R_NCHAR`, `R_SUBSTR`, `R_STRSPLIT`
- **Factor functions**: `R_FACTOR`, `R_LEVELS`, `R_NLEVELS`
- **DataFrame functions**: `R_DATA_FRAME`, `R_HEAD`, `R_TAIL`, `R_SUMMARY`
- **Time series**: `R_TS`, `R_LAG`, `R_DIFF`, `R_ACF`, `R_DECOMPOSE`
- **Graphics**: `R_HIST`, `R_BOXPLOT`, `R_SCATTER`, `R_LINE`, `R_DENSITY`
- **Machine learning**: `R_LM`, `R_PREDICT`, `R_KMEANS`, `R_PCA`
- Status: ✅ Pure JS (data), 🟡 Canvas dependent (rendering), Both environments

**[SciPy Interpolation Functions](16-scipy-functions.md)** - 16+ functions  
- **1D interpolation**: `SP_INTERP1D`, `SP_PCHIP`, `SP_AKIMA1D`
- **2D interpolation**: `SP_INTERP2D`, `SP_GRIDDATA`, `SP_REGULARGRID`
- **Spline functions**: `SP_SPLREP`, `SP_SPLEV`, `SP_CUBIC_SPLINE`, `SP_LSQ_SPLINE`
- **Scattered data**: `SP_RBF`, `SP_BARYCENTRIC`, `SP_KROGH`
- **Advanced methods**: `SP_UNISPLINE`, `SP_SPLPREP`, `SP_PPOLY`
- Status: ✅ Pure JS, Both environments

**Probability Functions** - 22+ functions
- **Distributions**: `PROB_NORMAL`, `PROB_BINOMIAL`, `PROB_POISSON`, `PROB_EXPONENTIAL`
- **Random generation**: `RANDOM_NORMAL`, `RANDOM_BINOMIAL`, `RANDOM_UNIFORM`
- **Statistical tests**: `PROB_CHI_SQUARED`, `PROB_T`, `PROB_F`
- Status: ✅ Pure JS, Both environments

**Statistical Functions** - 5+ functions
- **Descriptive stats**: `MEAN`, `MEDIAN`, `MODE`, `STDEV`, `VARIANCE`
- Status: ✅ Pure JS, Both environments

### Excel-Compatible Functions

**[Excel Functions](14-excel-functions.md)** - 18+ functions
- **Lookup functions**: `VLOOKUP`, `HLOOKUP`, `INDEX`, `MATCH`
- **Logical functions**: `IF`, `AND`, `OR`, `NOT`
- **Text functions**: `CONCATENATE`, `LEFT`, `RIGHT`, `MID`, `FIND`, `SUBSTITUTE`
- **Conversion functions**: `TEXT`, `VALUE`
- **Testing functions**: `ISBLANK`, `ISERROR`
- Status: ✅ Pure JS, Both environments

### Web and Networking Functions

**[URL Functions](09-web-functions.md)** - 3+ functions
- **Encoding**: `URL_ENCODE`, `URL_DECODE`, `URL_PARSE`
- Status: ✅ Pure JS, Both environments

**[Security Functions](12-security-functions.md)** - 10+ functions
- **Hashing**: `HASH_MD5`, `HASH_SHA1`, `HASH_SHA256`, `HASH_SHA512`
- **Encoding**: `BASE64_ENCODE`, `BASE64_DECODE`, `HEX_ENCODE`, `HEX_DECODE`
- **Encryption**: `ENCRYPT_AES`, `DECRYPT_AES`
- Status: 🟡 Web Cryptography API dependent, Both environments

**[ID Generation Functions](10-id-functions.md)** - 2+ functions
- **Identifiers**: `UUID`, `SECURE_RANDOM`
- Status: ✅ Built-in crypto (UUID), 🟡 Web Cryptography API dependent (SECURE_RANDOM), Both environments

### System and Environment Functions

**[File System Functions](13-filesystem-functions.md)** - 10+ functions
- **File operations**: `FILE_READ`, `FILE_WRITE`, `FILE_APPEND`, `FILE_DELETE`
- **File info**: `FILE_EXISTS`, `FILE_SIZE`, `FILE_MODIFIED`, `FILE_LIST`
- **Directory operations**: `FILE_CREATE_DIR`, `FILE_REMOVE_DIR`
- Status: 🟡 Environment dependent (localStorage/OPFS browser, fs Node.js), Both environments

**[DOM Functions](18-dom-functions.md)** - 11+ functions
- **Element interaction**: `DOM_ELEMENT_CLICK`, `DOM_ELEMENT_TYPE`, `DOM_ELEMENT_TEXT`
- **Element queries**: `DOM_GET`, `DOM_ELEMENT_QUERY`, `DOM_ELEMENT_VISIBLE`
- **Page operations**: `DOM_WAIT_FOR`, `DOM_SCREENSHOT`, `DOM_SCROLL`
- **State management**: `DOM_ELEMENT_STALE`, `DOM_ELEMENT_ATTRIBUTE`
- **Utilities**: `SLEEP`
- Status: 🔴 Autonomous Web Mode, or remote browser via JSON-RPC

### Advanced Processing Functions

**Data Functions** - 6+ functions
- **Transformation**: `TRANSPOSE`, `PIVOT`, `UNPIVOT`, `GROUPBY`, `AGGREGATE`, `CROSSTAB`
- Status: ✅ Pure JS, Both environments

**Logic Functions** - 4+ functions  
- **Boolean operations**: `LOGIC_AND`, `LOGIC_OR`, `LOGIC_NOT`, `LOGIC_XOR`
- Status: ✅ Pure JS, Both environments

**Random Functions** - 3+ functions
- **Generation**: `RANDOM`, `RANDOM_INT`, `RANDOM_CHOICE`
- Status: ✅ Pure JS, Both environments

## Function Availability Summary

### By Implementation Status

| **Status** | **Count** | **Percentage** | **Categories** |
|------------|-----------|----------------|----------------|
| **✅ Pure JS** | ~330+ | ~87% | String, Math, Array, JSON, Date/Time, Validation, Regex, Statistical, R-functions (data), SciPy, Probability, Excel, Data, Logic, Random |
| **🟡 Environment-dependent** | ~10 | ~3% | Crypto functions, File operations, R-graphics (rendering) |
| **🔴 External required** | ~45 | ~11% | DOM functions, Advanced file operations |

### By Environment Support

| **Environment** | **Function Count** | **Key Categories** |
|-----------------|-------------------|-------------------|
| **Both (Browser + Node.js)** | ~350+ | All core functions, R-functions, SciPy, Statistical analysis |
| **Browser only** | ~11 | DOM manipulation and browser automation |
| **Node.js only** | ~0 | (All Node.js functions also work in browser) |

### By Functional Domain

| **Domain** | **Function Count** | **Completeness** |
|------------|-------------------|------------------|
| **Text Processing** | ~50+ | Complete - string manipulation, regex, validation |
| **Mathematical Computing** | ~70+ | Complete - basic math, advanced statistics, linear algebra |
| **Statistical Analysis** | ~150+ | Comprehensive - R-language compatibility, ML, time series |  
| **Data Manipulation** | ~80+ | Complete - JSON, arrays, transformations, Excel compatibility |
| **Scientific Computing** | ~20+ | Specialized - SciPy interpolation, probability distributions |
| **Web Development** | ~25+ | Partial - URL handling, validation, limited DOM access |
| **System Integration** | ~20+ | Environment-dependent - file I/O, crypto, browser automation |

## Cross-Reference by Use Case

### Data Analysis Workflows
- **Data loading**: JSON functions, File operations, Array creation
- **Data cleaning**: Regex functions, String functions, Validation functions
- **Statistical analysis**: R-functions (summary, mathematical, statistical)
- **Visualization**: R-graphics functions (histogram, scatter, boxplot, etc.)
- **Modeling**: R-functions (linear models, clustering, PCA)

### Text Processing Pipelines  
- **Pattern matching**: Regex functions (match, extract, replace, split)
- **String manipulation**: String functions (transform, format, analyze)
- **Validation**: Validation functions (format checking, type verification)
- **Data extraction**: Regex + JSON functions for structured data

### Scientific Computing
- **Interpolation**: SciPy functions (1D/2D, splines, scattered data)
- **Statistical distributions**: Probability functions (generation, analysis)
- **Linear algebra**: R-matrix functions (operations, decomposition)
- **Signal processing**: R-signal functions (FFT, filtering, analysis)

### Web Applications
- **Input validation**: Validation + Regex functions
- **Data processing**: JSON + Array functions  
- **User interface**: DOM functions (browser automation)
- **Security**: Security functions (hashing, encryption)

## Implementation Coverage

This Rexx interpreter provides **exceptional functional coverage** across domains:

- **~400+ total functions** spanning 32+ categories
- **~87% pure JavaScript implementation** - works offline without dependencies
- **Complete R-language statistical suite** - 150+ functions for data science
- **Advanced interpolation library** - 16 methods including scattered data and splines
- **Comprehensive text processing** - full regex engine plus 25+ string functions
- **Excel compatibility layer** - familiar spreadsheet functions
- **Modern web capabilities** - JSON, validation, security, DOM interaction

The interpreter achieves **near-complete independence** from external services while providing **research-grade statistical computing** and **production-ready text processing** capabilities in a single JavaScript environment.