# String Functions

## Overview

RexxJS provides a comprehensive set of string manipulation functions, combining classic REXX string functions with modern JavaScript string operations.

## Classic REXX String Functions

### UPPER(string) → string

Convert string to uppercase.

```rexx
LET result = UPPER("hello")  -- "HELLO"
LET result = UPPER("Hello World")  -- "HELLO WORLD"
```

### LOWER(string) → string

Convert string to lowercase.

```rexx
LET result = LOWER("HELLO")  -- "hello"
LET result = LOWER("Hello World")  -- "hello world"
```

### LENGTH(string) → number

Return the length of a string. Also works with arrays (returns element count) and objects (returns property count).

```rexx
LET len = LENGTH("hello")  -- 5
LET len = LENGTH("")  -- 0
LET len = LENGTH([1, 2, 3])  -- 3 (array length)
LET len = LENGTH({name: "Alice", age: 25})  -- 2 (property count)
```

### SUBSTR(string, start [, length]) → string

Extract a substring. Uses 1-based indexing (REXX standard).

```rexx
LET result = SUBSTR("hello world", 7)  -- "world"
LET result = SUBSTR("hello world", 1, 5)  -- "hello"
LET result = SUBSTR("hello world", 7, 3)  -- "wor"
```

Parameters:
- **string**: The source string
- **start**: Starting position (1-based, 1 = first character)
- **length**: Number of characters to extract (optional, omit for "to end")

### POS(haystack, needle [, start]) → number

Find the position of a substring. Returns 0 if not found (REXX convention). Uses 1-based indexing.

```rexx
LET pos = POS("hello world", "world")  -- 7
LET pos = POS("hello world", "o")  -- 5 (first occurrence)
LET pos = POS("hello world", "o", 6)  -- 8 (search from position 6)
LET pos = POS("hello world", "xyz")  -- 0 (not found)
```

Parameters:
- **haystack**: The string to search in
- **needle**: The string to search for
- **start**: Starting position for search (optional, default: 1)

### WORD(string, n) → string

Extract the nth word from a string. Words are separated by whitespace. Uses 1-based indexing.

```rexx
LET word = WORD("hello world foo", 1)  -- "hello"
LET word = WORD("hello world foo", 2)  -- "world"
LET word = WORD("hello world foo", 3)  -- "foo"
LET word = WORD("hello world foo", 4)  -- "" (no 4th word)
```

### WORDS(string) → number

Count the number of words in a string.

```rexx
LET count = WORDS("hello world")  -- 2
LET count = WORDS("one two three four")  -- 4
LET count = WORDS("")  -- 0
LET count = WORDS("   spaces   everywhere   ")  -- 2
```

### WORDPOS(haystack, phrase [, start]) → number

Find the word position of a phrase. Returns 0 if not found.

```rexx
LET pos = WORDPOS("the quick brown fox", "brown")  -- 3
LET pos = WORDPOS("the quick brown fox", "quick brown")  -- 2
LET pos = WORDPOS("the quick brown fox", "slow")  -- 0 (not found)
LET pos = WORDPOS("foo bar foo baz", "foo", 2)  -- 3 (search from word 2)
```

### DELWORD(string, start [, length]) → string

Delete words from a string.

```rexx
LET result = DELWORD("one two three four", 2, 2)  -- "one four"
LET result = DELWORD("one two three four", 3)  -- "one two" (delete to end)
LET result = DELWORD("one two three", 1, 1)  -- "two three"
```

Parameters:
- **string**: Source string
- **start**: Starting word position (1-based)
- **length**: Number of words to delete (optional, omit for "to end")

### SUBWORD(string, start [, length]) → string

Extract words from a string.

```rexx
LET result = SUBWORD("one two three four", 2, 2)  -- "two three"
LET result = SUBWORD("one two three four", 3)  -- "three four" (to end)
LET result = SUBWORD("one two three", 1, 1)  -- "one"
```

### LEFT(string, length [, pad]) → string

Return the leftmost characters, padding if necessary.

```rexx
LET result = LEFT("hello", 3)  -- "hel"
LET result = LEFT("hi", 5)  -- "hi   " (padded with spaces)
LET result = LEFT("hi", 5, "*")  -- "hi***" (padded with *)
```

### RIGHT(string, length [, pad]) → string

Return the rightmost characters, padding if necessary.

```rexx
LET result = RIGHT("hello", 3)  -- "llo"
LET result = RIGHT("hi", 5)  -- "   hi" (left-padded with spaces)
LET result = RIGHT("hi", 5, "*")  -- "***hi" (left-padded with *)
```

### CENTER(string, length [, pad]) → string

Center a string within a field of specified length.

```rexx
LET result = CENTER("hi", 6)  -- "  hi  " (centered with spaces)
LET result = CENTER("hello", 9, "*")  -- "**hello**" (centered with *)
```

### COPIES(string, count) → string

Repeat a string N times.

```rexx
LET result = COPIES("*", 5)  -- "*****"
LET result = COPIES("ab", 3)  -- "ababab"
LET result = COPIES("X", 0)  -- ""
```

### SPACE(string [, n] [, pad]) → string

Normalize spaces between words.

```rexx
LET result = SPACE("hello   world")  -- "hello world" (single space)
LET result = SPACE("a  b  c", 2)  -- "a  b  c" (2 spaces between words)
LET result = SPACE("foo bar", 3, "*")  -- "foo***bar" (3 * between words)
LET result = SPACE("a b c", 0)  -- "abc" (no spaces)
```

Parameters:
- **string**: Source string
- **n**: Number of spaces between words (default: 1)
- **pad**: Padding character (default: space)

### STRIP(string [, option] [, character]) → string

Remove leading/trailing characters.

```rexx
LET result = STRIP("  hello  ")  -- "hello"
LET result = STRIP("***hello***", "BOTH", "*")  -- "hello"
LET result = STRIP("***hello***", "LEADING", "*")  -- "hello***"
LET result = STRIP("***hello***", "TRAILING", "*")  -- "***hello"
```

Options: `'BOTH'` (default), `'LEADING'`, `'TRAILING'`, `'L'`, `'T'`, `'B'`

### VERIFY(string, reference [, option] [, start]) → number

Verify that string contains only characters from reference set.

```rexx
-- Check if string contains only valid characters
LET pos = VERIFY("abc123", "0123456789")  -- 1 (first invalid char at position 1)
LET pos = VERIFY("123", "0123456789")  -- 0 (all valid)

-- Find first valid character (MATCH option)
LET pos = VERIFY("abc123", "0123456789", "MATCH")  -- 4 (first digit at position 4)
```

Options: `'NOMATCH'` (default - find first invalid), `'MATCH'` (find first valid)

### TRANSLATE(string [, outputTable] [, inputTable]) → string

Translate characters using translation tables.

```rexx
-- Simple case conversion (default: uppercase)
LET result = TRANSLATE("hello")  -- "HELLO"

-- Custom translation
LET result = TRANSLATE("hello", "AEIOU", "aeiou")  -- "hEllO"

-- Cipher (ROT13-style)
LET result = TRANSLATE("abc", "def", "abc")  -- "def"
```

### REVERSE(string) → string

Reverse a string.

```rexx
LET result = REVERSE("hello")  -- "olleh"
LET result = REVERSE("racecar")  -- "racecar" (palindrome)
```

## Modern String Functions (RexxJS Extensions)

### TRIM(string) → string

Remove leading and trailing whitespace (modern alias for STRIP).

```rexx
LET result = TRIM("  hello  ")  -- "hello"
LET result = TRIM("\n\t hello \r\n")  -- "hello"
```

### TRIM_START(string) → string

Remove leading whitespace.

```rexx
LET result = TRIM_START("  hello")  -- "hello"
```

### TRIM_END(string) → string

Remove trailing whitespace.

```rexx
LET result = TRIM_END("hello  ")  -- "hello"
```

### REPEAT(string, count) → string

Repeat a string (alias for COPIES).

```rexx
LET result = REPEAT("-", 10)  -- "----------"
LET result = REPEAT("Na", 8) || " Batman!"  -- "NaNaNaNaNaNaNaNa Batman!"
```

### PAD_START(string, targetLength [, padString]) → string

Pad string at the start to reach target length.

```rexx
LET result = PAD_START("5", 3, "0")  -- "005"
LET result = PAD_START("hello", 10)  -- "     hello"
```

### PAD_END(string, targetLength [, padString]) → string

Pad string at the end to reach target length.

```rexx
LET result = PAD_END("5", 3, "0")  -- "500"
LET result = PAD_END("hello", 10)  -- "hello     "
```

### STARTS_WITH(string, searchString) → boolean

Check if string starts with searchString.

```rexx
LET result = STARTS_WITH("hello world", "hello")  -- true
LET result = STARTS_WITH("hello world", "world")  -- false
```

### ENDS_WITH(string, searchString) → boolean

Check if string ends with searchString.

```rexx
LET result = ENDS_WITH("hello world", "world")  -- true
LET result = ENDS_WITH("hello world", "hello")  -- false
```

### INCLUDES(string, searchString) → boolean

Check if string contains searchString.

```rexx
LET result = INCLUDES("hello world", "llo")  -- true
LET result = INCLUDES("hello world", "xyz")  -- false
```

### INDEXOF(string, searchString [, fromIndex]) → number

Find the index of a substring (0-based, JavaScript convention). Returns -1 if not found.

```rexx
LET pos = INDEXOF("hello world", "world")  -- 6
LET pos = INDEXOF("hello world", "o")  -- 4 (first occurrence)
LET pos = INDEXOF("hello world", "o", 5)  -- 7 (search from index 5)
LET pos = INDEXOF("hello world", "xyz")  -- -1 (not found)
```

Note: Unlike POS (1-based, returns 0 for not found), INDEXOF uses JavaScript conventions (0-based, returns -1 for not found).

### SUBSTRING(string, start [, length]) → string

Extract substring using 0-based indexing (JavaScript convention).

```rexx
LET result = SUBSTRING("hello world", 6)  -- "world"
LET result = SUBSTRING("hello world", 0, 5)  -- "hello"
```

Note: Unlike SUBSTR (1-based), SUBSTRING uses 0-based indexing like JavaScript.

## String Comparison

Strings are compared case-insensitively in REXX:

```rexx
IF "hello" = "HELLO" THEN
  SAY "Equal"  -- This executes

-- Exact comparison using JavaScript functions
IF EXACT_COMPARE("hello", "HELLO") THEN
  SAY "Equal"  -- This does NOT execute
```

## String Concatenation

Use the `||` operator:

```rexx
LET full = "hello" || " " || "world"  -- "hello world"
LET path = "/home/" || user || "/documents"
```

## Template Literals (String Interpolation)

Use HEREDOC with interpolation:

```rexx
LET name = "Alice"
LET age = 25
LET message = <<TEXT
Hello, {name}!
You are {age} years old.
TEXT

SAY message
-- Output:
-- Hello, Alice!
-- You are 25 years old.
```

See [HEREDOC documentation](08-heredoc.md) for more details.

## Regular Expressions

For regex operations, see [Regex Functions](23-regex-functions.md).

## Common Patterns

### Extract File Extension

```rexx
LET filename = "document.pdf"
LET pos = POS(filename, ".")
IF pos > 0 THEN
  LET ext = SUBSTR(filename, pos + 1)  -- "pdf"
```

### Split String into Words

```rexx
LET text = "one two three"
LET count = WORDS(text)
LET words = []
DO i = 1 TO count
  words[i-1] = WORD(text, i)
END
```

### Join Array into String

```rexx
LET items = ["apple", "banana", "cherry"]
LET result = ""
DO i = 0 TO LENGTH(items) - 1
  IF i > 0 THEN result = result || ", "
  result = result || items[i]
END
-- result: "apple, banana, cherry"
```

### Truncate with Ellipsis

```rexx
LET text = "This is a very long string that needs truncation"
LET max_len = 20
LET truncated = IF LENGTH(text) > max_len THEN LEFT(text, max_len - 3) || "..." ELSE text
-- "This is a very lo..."
```

### Remove All Spaces

```rexx
LET text = "h e l l o  w o r l d"
LET result = SPACE(text, 0)  -- "helloworld"
```

### Pad Number with Zeros

```rexx
LET num = 42
LET padded = PAD_START(num, 5, "0")  -- "00042"
```

### Title Case Conversion

```rexx
LET text = "hello world"
LET words_count = WORDS(text)
LET result = ""
DO i = 1 TO words_count
  LET word = WORD(text, i)
  LET first = UPPER(SUBSTR(word, 1, 1))
  LET rest = LOWER(SUBSTR(word, 2))
  LET title_word = first || rest
  result = result || title_word
  IF i < words_count THEN result = result || " "
END
-- result: "Hello World"
```

### Check for Valid Identifier

```rexx
LET name = "my_variable_123"
LET valid_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"
LET first_invalid = VERIFY(name, valid_chars)
IF first_invalid = 0 THEN
  SAY "Valid identifier"
ELSE
  SAY "Invalid character at position " || first_invalid
```

## Performance Tips

1. **Avoid repeated concatenation in loops**: Build arrays and join once
2. **Use SPACE() for normalization**: More efficient than manual processing
3. **Use appropriate function**: WORD() is faster than SUBSTR() for word extraction
4. **Cache LENGTH() results**: Don't recalculate in loops

```rexx
-- Inefficient
LET result = ""
DO i = 1 TO 1000
  result = result || "x"  -- Creates 1000 intermediate strings
END

-- Efficient
LET result = COPIES("x", 1000)  -- Creates string once
```

## Next Steps

- [Array Functions](13-array-functions.md)
- [Regex Functions](23-regex-functions.md)
- [HEREDOC with Interpolation](08-heredoc.md)
- [JSON Functions](14-json-functions.md)
