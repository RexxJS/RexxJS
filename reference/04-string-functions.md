# String Functions

Comprehensive string manipulation and processing functions for text operations.

## Basic String Operations

### Case Conversion

### SUBSTR
Extracts a substring from a string starting at a specified position and optionally for a specified length.

**Usage:**
```rexx
LET result = SUBSTR("Hello, World", 1, 5)  -- "Hello"
```
```rexx
LET upper = UPPER string="hello world"           -- "HELLO WORLD"
LET lower = LOWER string="HELLO WORLD"           -- "hello world" 
LET proper = PROPER string="hello world"         -- "Hello World"
```

### String Properties
```rexx
LET length = LENGTH string="Hello"               -- 5
LET reversed = REVERSE string="hello"            -- "olleh"

-- Enhanced LENGTH: works with arrays and objects  
LET arrayLen = LENGTH [1, 2, 3, 4]               -- 4 (array length)
LET objectLen = LENGTH {"a": 1, "b": 2}          -- 2 (object property count)
```

### String Cleaning
```rexx
LET trimmed = STRIP string="  text  "            -- "text"
LET leading = STRIP string="...data..." option="LEADING" character="."  -- "data..."
LET spaced = SPACE string="  a   b   c  "        -- "a b c"
LET doubled = SPACE string="  a   b   c  " n=2   -- "a  b  c"
```

### String Generation
```rexx
LET border = COPIES string="-" count=20          -- "--------------------"
LET repeated = REPEAT string="Hi! " count=3      -- "Hi! Hi! Hi! "
```

## Advanced String Processing

### String Translation
```rexx
LET caps = TRANSLATE string="hello"              -- "HELLO" (default to uppercase)
LET cipher = TRANSLATE string="abc" outputTable="123" inputTable="abc"  -- "123"
```

### String Validation
```rexx
LET valid = VERIFY string="12345" reference="0123456789"      -- 0 (all digits valid)
LET invalid = VERIFY string="123a5" reference="0123456789"    -- 4 (position of 'a')
```

### Word Processing
```rexx
LET first = WORD string="hello world test" n=1   -- "hello"
LET third = WORD string="hello world test" n=3   -- "test"
LET count = WORDS string="hello world test"      -- 3
LET empty_count = WORDS string=""                -- 0

LET pos1 = WORDPOS phrase="world" string="hello world test"        -- 2
LET pos2 = WORDPOS phrase="not found" string="hello world test"    -- 0

LET del1 = DELWORD string="one two three four" start=2 length=2    -- "one four"
LET del2 = DELWORD string="one two three four" start=3             -- "one two"

LET sub1 = SUBWORD string="one two three four" start=2 length=2    -- "two three"
LET sub2 = SUBWORD string="one two three four" start=3             -- "three four"
```

## Regular Expression Functions

### Pattern Testing
```rexx
LET email = "user@example.com"
LET isValid = REGEX_TEST string=email pattern="^[^@]+@[^@]+\\.[^@]+$"  -- true
```

### Pattern Matching
```rexx
LET email = "user@example.com"
LET username = REGEX_MATCH string=email pattern="^[^@]+"  -- "user"
```

### Pattern Replacement
```rexx
LET cleaned = REGEX_REPLACE string="Hello   World" pattern="\\s+" replacement=" "  -- "Hello World"
```

### String Splitting
```rexx
LET words = REGEX_SPLIT string="apple,banana,orange" pattern=","  -- ["apple", "banana", "orange"]
LET sentence = JOIN array=words separator=" and "  -- "apple and banana and orange"
```

## Enhanced String Manipulation

### Trimming Operations
```rexx
LET text = "  Hello World  "
LET trimmed = TRIM string=text          -- "Hello World"
LET leftTrimmed = TRIM_START string=text -- "Hello World  "
LET rightTrimmed = TRIM_END string=text  -- "  Hello World"
```

### Substring Operations
```rexx
LET part = SUBSTRING string="Hello World" start=6 length=5  -- "World"
LET index = INDEXOF string="Hello World" substring="World"  -- 6
LET hasWorld = INCLUDES string="Hello World" substring="World"  -- true
```

### String Testing
```rexx
LET startsWithHello = STARTS_WITH string="Hello World" prefix="Hello"  -- true
LET endsWithWorld = ENDS_WITH string="Hello World" suffix="World"      -- true
```

### String Padding
```rexx
LET padded = PAD_START string="42" length=5 padString="0"    -- "00042"
LET rightPad = PAD_END string="abc" length=6 padString="*"   -- "abc***"
```

### URL-friendly Operations
```rexx
LET title = "My Blog Post Title!"
LET slug = SLUG string=title  -- "my-blog-post-title"
```

## String Content Validation

### Character Type Testing
```rexx
LET isAlpha = IS_ALPHA text="HelloWorld"        -- true
LET isNumeric = IS_NUMERIC text="12345"         -- true
LET isAlphaNum = IS_ALPHANUMERIC text="Hello123" -- true
LET isLowercase = IS_LOWERCASE text="hello world" -- true
LET isUppercase = IS_UPPERCASE text="HELLO WORLD" -- true
```

### Pattern Matching
```rexx
LET matchesPattern = MATCHES_PATTERN text="abc123" pattern="^[a-z]+[0-9]+$"  -- true
LET phonePattern = MATCHES_PATTERN text="555-1234" pattern="[0-9]{3}-[0-9]{4}"  -- true
```

### Empty String Testing
```rexx
LET isEmpty = IS_EMPTY value=""         -- true
LET isNotEmpty = IS_NOT_EMPTY value="data"  -- true
```

## Practical Examples

### Email Processing
```rexx
LET email = "John.Doe@COMPANY.COM"
LET cleaned = LOWER string=email
LET isValid = REGEX_TEST string=cleaned pattern="^[^@]+@[^@]+\\.[^@]+$"
LET domain = REGEX_EXTRACT string=cleaned pattern="@(.+)$" group=1

SAY "Cleaned email: " || cleaned
SAY "Valid: " || isValid
SAY "Domain: " || domain
```

### Data Cleaning Pipeline
```rexx
LET rawData = "  JOHN   DOE  ,  SOFTWARE   ENGINEER  "
LET cleaned = TRIM string=rawData
LET spaced = SPACE string=cleaned
LET proper = PROPER string=spaced
LET parts = REGEX_SPLIT string=proper pattern=","

SAY "Original: '" || rawData || "'"
SAY "Cleaned: '" || proper || "'"
SAY "Parts: " || parts
```

### Text Analysis
```rexx
LET document = "The quick brown fox jumps over the lazy dog"
LET wordCount = WORDS string=document
LET charCount = LENGTH string=document
LET hasQuick = INCLUDES string=document substring="quick"
LET quickPos = INDEXOF string=document substring="quick"

SAY "Document analysis:"
SAY "  Words: " || wordCount
SAY "  Characters: " || charCount  
SAY "  Contains 'quick': " || hasQuick
SAY "  'Quick' at position: " || quickPos
```

### String Formatting
```rexx
LET price = "42.50"
LET formatted = "$" || PAD_START(string=price length=8 padString=" ")
LET productCode = PAD_START string="123" length=6 padString="0"

SAY "Price: '" || formatted || "'"
SAY "Product code: " || productCode
```

**See also:** 
- [Validation Functions](11-validation-functions.md) for email, phone, and format validation
- [Basic Syntax](01-basic-syntax.md) for string interpolation
- [JSON Functions](08-json-functions.md) for string-based data processing
