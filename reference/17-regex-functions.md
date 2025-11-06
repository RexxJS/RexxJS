# Regular Expression Functions

Pattern matching and text processing using regular expressions with full JavaScript regex engine support.

## Core Pattern Matching

### REGEX_MATCH - Test Pattern Matches

Tests if a string matches a regular expression pattern.

**Basic Usage:**
```rexx
LET text = "Hello World 123"
LET has_digits = REGEX_MATCH text=text pattern="\\d+"  -- Returns: true
LET has_letters = REGEX_MATCH text=text pattern="[a-zA-Z]+"  -- Returns: true
LET is_email = REGEX_MATCH text="user@domain.com" pattern="^[^@]+@[^@]+\\.[^@]+$"  -- Returns: true
```

**Case-Insensitive Matching:**
```rexx
LET text = "Hello World"
LET matches_lower = REGEX_MATCH text=text pattern="hello" flags="i"  -- Returns: true
LET matches_exact = REGEX_MATCH text=text pattern="hello"            -- Returns: false
```

**Multiline and Global Flags:**
```rexx
LET multiline_text = "Line 1\\nLine 2\\nLine 3"
LET starts_with_line = REGEX_MATCH text=multiline_text pattern="^Line" flags="m"  -- Returns: true
LET all_lines = REGEX_MATCH text=multiline_text pattern="Line \\d" flags="g"     -- Returns: true
```

### REGEX_EXTRACT - Extract Matching Groups

Extracts matched groups from pattern matching with capture groups.

**Single Match with Groups:**
```rexx
LET email = "john.doe@example.com"
LET email_pattern = "([^@]+)@([^@]+)\\.([^@]+)"
LET parts = REGEX_EXTRACT text=email pattern=email_pattern
-- Returns: {match: "john.doe@example.com", groups: ["john.doe", "example", "com"]}
```

**Named Capture Groups:**
```rexx
LET date_text = "Today is 2024-03-15"
LET date_pattern = "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"
LET date_parts = REGEX_EXTRACT text=date_text pattern=date_pattern
-- Returns: {match: "2024-03-15", groups: ["2024", "03", "15"], named: {year: "2024", month: "03", day: "15"}}
```

**Multiple Matches:**
```rexx
LET phone_text = "Call 555-1234 or 555-5678"
LET phone_pattern = "(\\d{3})-(\\d{4})"
LET all_phones = REGEX_EXTRACT text=phone_text pattern=phone_pattern flags="g"
-- Returns: [{match: "555-1234", groups: ["555", "1234"]}, {match: "555-5678", groups: ["555", "5678"]}]
```

**Optional Groups:**
```rexx
LET url = "https://www.example.com:8080/path"
LET url_pattern = "(https?)://([^:/]+)(?:::(\\d+))?(/.*)??"
LET url_parts = REGEX_EXTRACT text=url pattern=url_pattern
-- Returns: {match: "https://www.example.com:8080/path", groups: ["https", "www.example.com", "8080", "/path"]}
```

### REGEX_REPLACE - Replace Pattern Matches

Replaces matched patterns with replacement text.

**Simple Replacement:**
```rexx
LET text = "Hello World"
LET replaced = REGEX_REPLACE text=text pattern="World" replacement="Universe"
-- Returns: "Hello Universe"
```

**Global Replacement:**
```rexx
LET text = "foo bar foo baz foo"
LET all_replaced = REGEX_REPLACE text=text pattern="foo" replacement="replaced" flags="g"
-- Returns: "replaced bar replaced baz replaced"
```

**Capture Group Replacement:**
```rexx
LET names = "John Doe, Jane Smith, Bob Johnson"
LET name_pattern = "(\\w+) (\\w+)"
LET reversed = REGEX_REPLACE text=names pattern=name_pattern replacement="$2, $1" flags="g"
-- Returns: "Doe, John, Smith, Jane, Johnson, Bob"
```

**Function-Based Replacement:**
```rexx
LET text = "Temperature is 72F and 68F today"
LET temp_pattern = "(\\d+)F"
LET celsius_fn = "function(match, temp) { return Math.round((temp - 32) * 5/9) + 'C'; }"
LET converted = REGEX_REPLACE text=text pattern=temp_pattern replacement=celsius_fn flags="g"
-- Returns: "Temperature is 22C and 20C today"
```

### REGEX_SPLIT - Split by Pattern

Splits strings using regular expression patterns as delimiters.

**Basic Splitting:**
```rexx
LET text = "apple,banana;cherry:orange"
LET fruits = REGEX_SPLIT text=text pattern="[,;:]"
-- Returns: ["apple", "banana", "cherry", "orange"]
```

**Whitespace Splitting:**
```rexx
LET text = "  word1   word2\\t\\tword3\\n\\nword4  "
LET words = REGEX_SPLIT text=text pattern="\\s+"
-- Returns: ["word1", "word2", "word3", "word4"]
```

**Limit Split Count:**
```rexx
LET text = "a-b-c-d-e"
LET limited = REGEX_SPLIT text=text pattern="-" limit=3
-- Returns: ["a", "b", "c-d-e"]
```

**Capture Groups in Split:**
```rexx
LET text = "2024-03-15"
LET date_parts = REGEX_SPLIT text=text pattern="(-)" include_delimiters=true
-- Returns: ["2024", "-", "03", "-", "15"]
```

## Advanced Pattern Matching

### Complex Email Validation
```rexx
-- Comprehensive email validation pattern
LET email_pattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

LET valid_emails = JSON_PARSE text="[\"user@domain.com\", \"first.last+tag@sub.domain.org\", \"invalid.email\"]"

DO i = 1 TO ARRAY_LENGTH(array=valid_emails)
    LET email = ARRAY_GET array=valid_emails index=i
    LET is_valid = REGEX_MATCH text=email pattern=email_pattern
    SAY email || " is " || IF(is_valid, "valid", "invalid")
END
```

### Phone Number Processing
```rexx
-- US phone number extraction and formatting
LET text = "Call me at (555) 123-4567 or 555.987.6543 or 5551112222"
LET phone_pattern = "\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})"

LET phone_matches = REGEX_EXTRACT text=text pattern=phone_pattern flags="g"

-- Format all phone numbers consistently
LET formatted_phones = ARRAY_CREATE
DO i = 1 TO ARRAY_LENGTH(array=phone_matches)
    LET match = ARRAY_GET array=phone_matches index=i
    LET groups = ARRAY_GET array=match key="groups"
    LET formatted = "(" || ARRAY_GET(array=groups index=1) || ") " || ARRAY_GET(array=groups index=2) || "-" || ARRAY_GET(array=groups index=3)
    LET formatted_phones = ARRAY_PUSH array=formatted_phones item=formatted
END

SAY "Formatted phones: " || JSON_STRINGIFY(data=formatted_phones)
```

### URL Processing
```rexx
-- URL parsing and component extraction
LET url_pattern = "^(https?)://([^/]+)(:[0-9]+)?(/.*)??(\\?.*)??(#.*)?$"
LET test_url = "https://www.example.com:8080/path/to/page?param=value#section"

LET url_parts = REGEX_EXTRACT text=test_url pattern=url_pattern

IF url_parts THEN
    LET groups = ARRAY_GET array=url_parts key="groups"
    LET protocol = ARRAY_GET array=groups index=1
    LET domain = ARRAY_GET array=groups index=2
    LET port = ARRAY_GET array=groups index=3
    LET path = ARRAY_GET array=groups index=4
    LET query = ARRAY_GET array=groups index=5
    LET fragment = ARRAY_GET array=groups index=6
    
    SAY "Protocol: " || protocol
    SAY "Domain: " || domain
    SAY "Port: " || port
    SAY "Path: " || path
    SAY "Query: " || query
    SAY "Fragment: " || fragment
ENDIF
```

### Log File Processing
```rexx
-- Apache log file parsing
LET log_line = '127.0.0.1 - - [25/Dec/2023:10:15:30 +0000] "GET /index.html HTTP/1.1" 200 1234'
LET log_pattern = '^([\\d.]+) - - \\[([^\\]]+)\\] "([A-Z]+) ([^"]*) HTTP/[\\d.]+" (\\d+) (\\d+)'

LET log_parts = REGEX_EXTRACT text=log_line pattern=log_pattern

IF log_parts THEN
    LET groups = ARRAY_GET array=log_parts key="groups"
    SAY "IP: " || ARRAY_GET(array=groups index=1)
    SAY "Timestamp: " || ARRAY_GET(array=groups index=2)
    SAY "Method: " || ARRAY_GET(array=groups index=3)
    SAY "Path: " || ARRAY_GET(array=groups index=4)
    SAY "Status: " || ARRAY_GET(array=groups index=5)
    SAY "Size: " || ARRAY_GET(array=groups index=6)
ENDIF
```

## Data Extraction and Cleaning

### CSV Data Processing
```rexx
-- CSV parsing with quoted fields
LET csv_line = 'John,"Doe, Jr.",30,"Software Engineer","""Special"" Title"'
LET csv_pattern = '(?:^|,)("(?:[^"]+|"")*"|[^,]*)'

LET fields = REGEX_EXTRACT text=csv_line pattern=csv_pattern flags="g"
LET cleaned_fields = ARRAY_CREATE

-- Clean extracted fields
DO i = 1 TO ARRAY_LENGTH(array=fields)
    LET field_match = ARRAY_GET array=fields index=i
    LET field = ARRAY_GET array=field_match key="groups"
    LET field_value = ARRAY_GET array=field index=1
    
    -- Remove surrounding quotes and unescape internal quotes
    IF STARTSWITH(text=field_value prefix='"') AND ENDSWITH(text=field_value suffix='"') THEN
        LET field_value = SUBSTRING text=field_value start=2 end=LENGTH(text=field_value)-1
        LET field_value = REGEX_REPLACE text=field_value pattern='""' replacement='"' flags="g"
    ENDIF
    
    LET cleaned_fields = ARRAY_PUSH array=cleaned_fields item=field_value
END

SAY "CSV Fields: " || JSON_STRINGIFY(data=cleaned_fields)
```

### HTML Tag Extraction
```rexx
-- Extract text content from HTML
LET html = "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>"

-- Remove HTML tags
LET text_only = REGEX_REPLACE text=html pattern="<[^>]*>" replacement="" flags="g"
SAY "Text only: " || text_only

-- Extract specific tags with content
LET tag_pattern = "<(strong|em)>([^<]*)</\\1>"
LET formatted_text = REGEX_EXTRACT text=html pattern=tag_pattern flags="g"

DO i = 1 TO ARRAY_LENGTH(array=formatted_text)
    LET match = ARRAY_GET array=formatted_text index=i
    LET groups = ARRAY_GET array=match key="groups"
    LET tag = ARRAY_GET array=groups index=1
    LET content = ARRAY_GET array=groups index=2
    SAY tag || " text: " || content
END
```

### Code Comment Extraction
```rexx
-- Extract comments from code
LET code = 'let x = 5; // This is a line comment\\n/* This is a\\n   block comment */ let y = 10;'

-- Single-line comments
LET line_comments = REGEX_EXTRACT text=code pattern="//.*?(?=\\n|$)" flags="g"

-- Multi-line comments  
LET block_comments = REGEX_EXTRACT text=code pattern="/\\*[\\s\\S]*?\\*/" flags="g"

SAY "Line comments found: " || ARRAY_LENGTH(array=line_comments)
SAY "Block comments found: " || ARRAY_LENGTH(array=block_comments)

-- Remove all comments
LET clean_code = REGEX_REPLACE text=code pattern="(//.*?(?=\\n|$))|(/\\*[\\s\\S]*?\\*/)" replacement="" flags="g"
LET clean_code = REGEX_REPLACE text=clean_code pattern="\\s+" replacement=" " flags="g"
SAY "Clean code: " || TRIM(text=clean_code)
```

## Input Validation Patterns

### Password Strength Validation
```rexx
LET password = "MyP@ssw0rd123!"

-- At least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special char
LET strength_pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
LET is_strong = REGEX_MATCH text=password pattern=strength_pattern

SAY "Password is " || IF(is_strong, "strong", "weak")

-- Check individual requirements
LET has_lower = REGEX_MATCH text=password pattern="[a-z]"
LET has_upper = REGEX_MATCH text=password pattern="[A-Z]"
LET has_digit = REGEX_MATCH text=password pattern="\\d"
LET has_special = REGEX_MATCH text=password pattern="[@$!%*?&]"
LET min_length = LENGTH(text=password) >= 8

SAY "Requirements met:"
SAY "  Lowercase: " || has_lower
SAY "  Uppercase: " || has_upper  
SAY "  Digit: " || has_digit
SAY "  Special char: " || has_special
SAY "  Min length: " || min_length
```

### Credit Card Validation
```rexx
LET card_number = "4532-1234-5678-9012"

-- Remove spaces and dashes
LET clean_number = REGEX_REPLACE text=card_number pattern="[\\s-]" replacement="" flags="g"

-- Visa pattern
LET visa_pattern = "^4[0-9]{12}(?:[0-9]{3})?$"
LET is_visa = REGEX_MATCH text=clean_number pattern=visa_pattern

-- MasterCard pattern  
LET mc_pattern = "^5[1-5][0-9]{14}$"
LET is_mastercard = REGEX_MATCH text=clean_number pattern=mc_pattern

-- American Express pattern
LET amex_pattern = "^3[47][0-9]{13}$"
LET is_amex = REGEX_MATCH text=clean_number pattern=amex_pattern

SAY "Card type: " || SELECT
    WHEN is_visa THEN "Visa"
    WHEN is_mastercard THEN "MasterCard" 
    WHEN is_amex THEN "American Express"
    OTHERWISE "Unknown"
END
```

### IP Address Validation
```rexx
LET test_ips = JSON_PARSE text='["192.168.1.1", "256.1.1.1", "::1", "2001:db8::1", "invalid"]'

-- IPv4 pattern
LET ipv4_pattern = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"

-- IPv6 pattern (simplified)
LET ipv6_pattern = "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$"

DO i = 1 TO ARRAY_LENGTH(array=test_ips)
    LET ip = ARRAY_GET array=test_ips index=i
    LET is_ipv4 = REGEX_MATCH text=ip pattern=ipv4_pattern
    LET is_ipv6 = REGEX_MATCH text=ip pattern=ipv6_pattern
    
    LET type = SELECT
        WHEN is_ipv4 THEN "IPv4"
        WHEN is_ipv6 THEN "IPv6"
        OTHERWISE "Invalid"
    END
    
    SAY ip || " is " || type
END
```

## Text Processing Utilities

### Word Count and Analysis
```rexx
LET text = "The quick brown fox jumps over the lazy dog. The dog was really lazy!"

-- Count words
LET word_pattern = "\\b\\w+\\b"
LET words = REGEX_EXTRACT text=text pattern=word_pattern flags="g"
LET word_count = ARRAY_LENGTH(array=words)

-- Count sentences  
LET sentence_pattern = "[.!?]+"
LET sentences = REGEX_SPLIT text=text pattern=sentence_pattern
LET sentence_count = ARRAY_LENGTH(array=sentences) - 1  -- Last element is empty

-- Find repeated words
LET word_freq = JSON_PARSE text="{}"
DO i = 1 TO ARRAY_LENGTH(array=words)
    LET word = LOWER(text=ARRAY_GET(array=words index=i))
    LET current_count = ARRAY_GET array=word_freq key=word default=0
    LET word_freq = JSON_SET object=word_freq path=word value=current_count+1
END

SAY "Words: " || word_count
SAY "Sentences: " || sentence_count
SAY "Word frequencies: " || JSON_STRINGIFY(data=word_freq)
```

### Title Case Conversion
```rexx
LET title = "the quick BROWN fox jumps OVER the lazy dog"

-- Convert to title case (capitalize first letter of each word)
LET title_case = REGEX_REPLACE text=LOWER(text=title) pattern="\\b\\w" replacement="function(match) { return match.toUpperCase(); }" flags="g"

SAY "Title case: " || title_case
```

### Markdown Link Processing
```rexx
LET markdown = "Check out [OpenAI](https://openai.com) and [GitHub](https://github.com) for more info."

-- Extract markdown links
LET link_pattern = "\\[([^\\]]+)\\]\\(([^)]+)\\)"
LET links = REGEX_EXTRACT text=markdown pattern=link_pattern flags="g"

SAY "Found " || ARRAY_LENGTH(array=links) || " links:"
DO i = 1 TO ARRAY_LENGTH(array=links)
    LET link = ARRAY_GET array=links index=i
    LET groups = ARRAY_GET array=link key="groups"
    LET text = ARRAY_GET array=groups index=1
    LET url = ARRAY_GET array=groups index=2
    SAY "  " || text || " -> " || url
END

-- Convert markdown links to HTML
LET html_links = REGEX_REPLACE text=markdown pattern=link_pattern replacement='<a href="$2">$1</a>' flags="g"
SAY "HTML: " || html_links
```

Regular expression functions provide powerful pattern matching capabilities for text processing, data validation, extraction, and transformation tasks, supporting the full JavaScript regular expression syntax and features.