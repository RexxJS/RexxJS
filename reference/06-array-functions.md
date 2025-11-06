# Array Functions

Comprehensive array manipulation and analysis functions for modern data processing workflows.

## Core Array Operations

### SPLIT
Splits a string into an array of substrings using a specified separator.

**Usage:**
```rexx
LET result = SPLIT("a,b,c", ",")  -- ["a", "b", "c"]
```

### MODERN_SPLIT
Similar to SPLIT but supports regular expressions as the separator.

**Usage:**
```rexx
LET result = MODERN_SPLIT("a,b,c", /,/)  -- ["a", "b", "c"]
```

### JOIN
Joins an array of strings into a single string with a specified separator.

**Usage:**
```rexx
LET result = JOIN(["a", "b", "c"], ",")  -- "a,b,c"
```

### Array Creation and Basic Operations
```rexx
-- Array Creation
LET numbers = "[1, 2, 3, 4, 5]"
LET fruits = "[\"apple\", \"banana\", \"orange\"]"
LET mixed = "[1, \"text\", true, null]"

-- Basic Properties
LET length = ARRAY_LENGTH array=numbers           -- 5
LET isEmpty = ARRAY_LENGTH(array="[]") = 0        -- true
```

### Adding and Removing Elements
```rexx
-- Add elements
LET newArray = ARRAY_PUSH array=numbers item=6       -- [1, 2, 3, 4, 5, 6]
LET withMultiple = ARRAY_PUSH array=numbers item=6 item=7 item=8  -- [1, 2, 3, 4, 5, 6, 7, 8]
LET prepended = ARRAY_UNSHIFT array=numbers item=0   -- [0, 1, 2, 3, 4, 5]

-- Remove elements
LET lastItem = ARRAY_POP array=newArray             -- 6, array becomes [1, 2, 3, 4, 5]
LET firstItem = ARRAY_SHIFT array=fruits            -- "apple", array becomes ["banana", "orange"]
```

### Array Access and Slicing
```rexx
-- Element Access
LET items = "[\"first\", \"second\", \"third\", \"fourth\"]"
LET firstElement = ARRAY_GET array=items index=0    -- "first"
LET lastElement = ARRAY_GET array=items index=-1    -- "fourth"

-- Array Slicing
LET slice = ARRAY_SLICE array=numbers start=1 end=4         -- [2, 3, 4]
LET fromStart = ARRAY_SLICE array=numbers start=0 end=2     -- [1, 2]
LET toEnd = ARRAY_SLICE array=numbers start=2               -- [3, 4, 5]
```

## Array Manipulation

### Combining and Transforming Arrays
```rexx
-- Concatenation
LET array1 = "[1, 2, 3]"
LET array2 = "[4, 5, 6]"
LET combined = ARRAY_CONCAT array1=array1 array2=array2      -- [1, 2, 3, 4, 5, 6]

-- Reversal and Sorting
LET reversed = ARRAY_REVERSE array=numbers                   -- [5, 4, 3, 2, 1]
LET sorted = ARRAY_SORT array=fruits order="asc"            -- ["apple", "banana", "orange"]
LET sortedDesc = ARRAY_SORT array=numbers order="desc"      -- [5, 4, 3, 2, 1]
```

### Advanced Processing
```rexx
-- Remove Duplicates
LET duplicates = "[1, 2, 2, 3, 3, 3, 4]"
LET unique = ARRAY_UNIQUE array=duplicates                   -- [1, 2, 3, 4]

-- Flatten Nested Arrays
LET nested = "[[1, 2], [3, 4], [5, 6]]"
LET flattened = ARRAY_FLATTEN array=nested depth=1          -- [1, 2, 3, 4, 5, 6]

-- Deep nested flattening
LET deepNested = "[[[1, 2], [3]], [[4, 5]], [6]]"
LET deepFlattened = ARRAY_FLATTEN array=deepNested depth=2  -- [1, 2, 3, 4, 5, 6]

-- Array Reduction
LET numbers = "[1, 2, 3, 4, 5]"
LET sum = ARRAY_REDUCE array=numbers expression="acc + item" initial=0        -- 15
LET product = ARRAY_REDUCE array=numbers expression="acc * item" initial=1    -- 120

-- Object Array Reduction
LET employees = '[{"name":"Alice","salary":50000},{"name":"Bob","salary":60000}]'
LET totalPayroll = ARRAY_REDUCE array=employees expression="acc + salary" initial=0  -- 110000

-- String Concatenation
LET words = '["Hello", " ", "World", "!"]'
LET sentence = ARRAY_REDUCE array=words expression="acc + item" initial=""    -- "Hello World!"
```

## Array Searching and Testing

### Finding Elements
```rexx
-- Search for elements
LET fruits = "[\"apple\", \"banana\", \"orange\", \"apple\"]"
LET hasApple = ARRAY_INCLUDES array=fruits item="apple"     -- true
LET appleIndex = ARRAY_INDEXOF array=fruits item="apple"   -- 0 (first occurrence)
LET lastAppleIndex = ARRAY_LASTINDEXOF array=fruits item="apple"  -- 3 (last occurrence)

-- Find elements
LET foundItem = ARRAY_FIND array=fruits item="banana"      -- "banana"
LET notFound = ARRAY_FIND array=fruits item="grape"        -- null/undefined
```

### Array Validation
```rexx
-- Check array properties
LET numbers = "[1, 2, 3, 4, 5]"
LET strings = "[\"a\", \"b\", \"c\"]"
LET mixed = "[1, \"text\", true]"

-- Type checking (implementation dependent)
LET allNumbers = ARRAY_EVERY array=numbers predicate="isNumber"    -- true
LET hasNumbers = ARRAY_SOME array=mixed predicate="isNumber"       -- true
```

## Mathematical Array Operations

### Statistical Functions
```rexx
-- Numeric operations on arrays
LET values = "[10, 5, 15, 3, 8, 12]"
LET minimum = ARRAY_MIN array=values                -- 3
LET maximum = ARRAY_MAX array=values                -- 15
LET sum = ARRAY_SUM array=values                    -- 53
LET average = ARRAY_AVERAGE array=values            -- 8.83
LET count = ARRAY_LENGTH array=values               -- 6

-- Range and variance
LET range = ARRAY_MAX(array=values) - ARRAY_MIN(array=values)  -- 12
```

### Array Comparison
```rexx
-- Compare arrays
LET array1 = "[1, 2, 3]"
LET array2 = "[1, 2, 3]"
LET array3 = "[3, 2, 1]"

-- Element-wise comparison (implementation specific)
LET areEqual = ARRAY_EQUALS array1=array1 array2=array2      -- true
LET areDifferent = ARRAY_EQUALS array1=array1 array2=array3  -- false
```

## Practical Array Processing Examples

### Data Processing Pipeline
```rexx
-- Process sales data
LET salesData = "[\"Jan:1000\", \"Feb:1200\", \"Mar:950\", \"Apr:1400\"]"
LET totalSales = 0
LET months = []
LET amounts = []

-- Extract data from formatted strings
DO i = 0 TO ARRAY_LENGTH(array=salesData) - 1
  LET record = ARRAY_GET array=salesData index=i
  LET parts = REGEX_SPLIT string=record pattern=":"
  LET month = ARRAY_GET array=parts index=0
  LET amount = ARRAY_GET array=parts index=1
  
  LET months = ARRAY_PUSH array=months item=month
  LET amounts = ARRAY_PUSH array=amounts item=amount
  LET totalSales = totalSales + amount
END

LET averageSales = totalSales / ARRAY_LENGTH(array=amounts)
LET bestMonth = ARRAY_GET array=months index=ARRAY_INDEXOF(array=amounts item=ARRAY_MAX(array=amounts))

SAY "Total sales: $" || totalSales
SAY "Average monthly sales: $" || averageSales
SAY "Best performing month: " || bestMonth
```

### Inventory Management
```rexx
-- Inventory tracking with arrays
LET inventory = "[\"apples:25\", \"bananas:12\", \"oranges:8\", \"grapes:30\"]"
LET lowStockItems = []
LET totalItems = 0
LET lowStockThreshold = 15

-- Check inventory levels
DO i = 0 TO ARRAY_LENGTH(array=inventory) - 1
  LET item = ARRAY_GET array=inventory index=i
  LET parts = REGEX_SPLIT string=item pattern=":"
  LET itemName = ARRAY_GET array=parts index=0
  LET quantity = ARRAY_GET array=parts index=1
  
  LET totalItems = totalItems + quantity
  
  IF quantity < lowStockThreshold THEN
    LET lowStockItems = ARRAY_PUSH array=lowStockItems item=itemName
  ENDIF
END

SAY "Total inventory: " || totalItems || " items"
SAY "Low stock items: " || ARRAY_LENGTH(array=lowStockItems)

-- Report low stock items
DO i = 0 TO ARRAY_LENGTH(array=lowStockItems) - 1
  LET item = ARRAY_GET array=lowStockItems index=i
  SAY "  - " || item || " needs restocking"
END
```

### Survey Data Analysis
```rexx
-- Analyze survey responses
LET responses = "[5, 4, 3, 5, 4, 2, 5, 3, 4, 5, 1, 4, 3, 5, 4]"
LET ratingCounts = "[0, 0, 0, 0, 0, 0]"  -- Index 0 unused, 1-5 for ratings

-- Count each rating
DO i = 0 TO ARRAY_LENGTH(array=responses) - 1
  LET rating = ARRAY_GET array=responses index=i
  LET currentCount = ARRAY_GET array=ratingCounts index=rating
  LET ratingCounts = ARRAY_SET array=ratingCounts index=rating value=(currentCount + 1)
END

-- Calculate statistics
LET totalResponses = ARRAY_LENGTH array=responses
LET averageRating = ARRAY_AVERAGE array=responses
LET highestRating = ARRAY_MAX array=responses
LET lowestRating = ARRAY_MIN array=responses

SAY "Survey Analysis:"
SAY "  Total responses: " || totalResponses
SAY "  Average rating: " || averageRating
SAY "  Rating distribution:"

DO rating = 1 TO 5
  LET count = ARRAY_GET array=ratingCounts index=rating
  LET percentage = MATH_ROUND value=(count * 100 / totalResponses) precision=1
  SAY "    " || rating || " stars: " || count || " (" || percentage || "%)"
END
```

### Shopping Cart Operations
```rexx
-- Shopping cart management
LET cart = "[]"
LET products = "[{\"id\":1,\"name\":\"Laptop\",\"price\":999},{\"id\":2,\"name\":\"Mouse\",\"price\":25}]"

-- Add items to cart
LET laptopItem = "{\"productId\":1,\"quantity\":1,\"price\":999}"
LET mouseItem = "{\"productId\":2,\"quantity\":2,\"price\":25}"

LET cart = ARRAY_PUSH array=cart item=laptopItem
LET cart = ARRAY_PUSH array=cart item=mouseItem

-- Calculate cart totals
LET subtotal = 0
LET itemCount = 0

DO i = 0 TO ARRAY_LENGTH(array=cart) - 1
  LET cartItem = ARRAY_GET array=cart index=i
  LET item = JSON_PARSE text=cartItem
  LET itemTotal = item.price * item.quantity
  
  LET subtotal = subtotal + itemTotal
  LET itemCount = itemCount + item.quantity
END

LET tax = subtotal * 0.08
LET total = subtotal + tax

SAY "Shopping Cart Summary:"
SAY "  Items: " || itemCount
SAY "  Subtotal: $" || subtotal
SAY "  Tax: $" || MATH_ROUND(value=tax precision=2)
SAY "  Total: $" || MATH_ROUND(value=total precision=2)
```

## Array Iteration Patterns

### Traditional Loops
```rexx
-- Standard array iteration
LET items = "[\"first\", \"second\", \"third\"]"

-- Forward iteration
DO i = 0 TO ARRAY_LENGTH(array=items) - 1
  LET currentItem = ARRAY_GET array=items index=i
  SAY "Item " || (i + 1) || ": " || currentItem
END

-- Reverse iteration
DO i = ARRAY_LENGTH(array=items) - 1 TO 0 BY -1
  LET currentItem = ARRAY_GET array=items index=i
  SAY "Reverse item " || (i + 1) || ": " || currentItem
END
```

### Processing with Conditions
```rexx
-- Filter and process arrays
LET numbers = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET evenNumbers = []
LET oddNumbers = []

DO i = 0 TO ARRAY_LENGTH(array=numbers) - 1
  LET number = ARRAY_GET array=numbers index=i
  
  IF number % 2 = 0 THEN
    LET evenNumbers = ARRAY_PUSH array=evenNumbers item=number
  ELSE
    LET oddNumbers = ARRAY_PUSH array=oddNumbers item=number
  ENDIF
END

SAY "Even numbers: " || ARRAY_LENGTH(array=evenNumbers)
SAY "Odd numbers: " || ARRAY_LENGTH(array=oddNumbers)
```

## Performance Considerations

- **Large arrays**: Consider memory usage for very large datasets
- **Frequent modifications**: Push/pop operations are typically more efficient than unshift/shift
- **Search operations**: Use ARRAY_INDEXOF for single searches, consider sorting for multiple searches
- **Mathematical operations**: Use built-in functions (ARRAY_SUM, ARRAY_MAX) rather than manual loops when possible

## Function Reference

### Core Operations
- `ARRAY_LENGTH(array)` - Get array length
- `ARRAY_GET(array, index)` - Get element at index
- `ARRAY_SET(array, index, value)` - Set element at index

### Modification Functions
- `ARRAY_PUSH(array, item)` - Add element to end
- `ARRAY_POP(array)` - Remove and return last element
- `ARRAY_UNSHIFT(array, item)` - Add element to beginning
- `ARRAY_SHIFT(array)` - Remove and return first element

### Transformation Functions
- `ARRAY_SLICE(array, start, end?)` - Extract portion of array
- `ARRAY_CONCAT(array1, array2)` - Combine arrays
- `ARRAY_REVERSE(array)` - Reverse array order
- `ARRAY_SORT(array, order?)` - Sort array elements
- `ARRAY_UNIQUE(array)` - Remove duplicates
- `ARRAY_FLATTEN(array, depth?)` - Flatten nested arrays
- `ARRAY_REDUCE(array, expression, initial?)` - Reduce array to single value

### Search Functions
- `ARRAY_INCLUDES(array, item)` - Check if array contains item
- `ARRAY_INDEXOF(array, item)` - Find first index of item
- `ARRAY_LASTINDEXOF(array, item)` - Find last index of item
- `ARRAY_FIND(array, item)` - Find first matching element

### Mathematical Functions
- `ARRAY_MIN(array)` - Find minimum value
- `ARRAY_MAX(array)` - Find maximum value
- `ARRAY_SUM(array)` - Sum all numeric elements
- `ARRAY_AVERAGE(array)` - Calculate average of numeric elements

**See also:**
- [JSON Functions](08-json-functions.md) for working with JSON arrays
- [Math Functions](05-math-functions.md) for numerical processing
- [Control Flow](02-control-flow.md) for iteration patterns
- [String Functions](04-string-functions.md) for string array processing
