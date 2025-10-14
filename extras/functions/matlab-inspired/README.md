# MATLAB-inspired Functions Library for RexxJS

A functions library that provides MATLAB-inspired array manipulation, matrix operations, and plotting capabilities directly within RexxJS.

## Usage

### REXX Code

```rexx
-- Load the MATLAB-inspired functions library
REQUIRE "matlab-functions"

-- Generate linearly spaced vector
LET x = LINSPACE(0, 10, 5)  -- [0, 2.5, 5, 7.5, 10]

-- Create arrays
LET zeros_array = ZEROS(3)      -- [0, 0, 0]
LET ones_matrix = ONES(2, 3)    -- [[1, 1, 1], [1, 1, 1]]
LET identity = EYE(3)           -- 3×3 identity matrix

-- Matrix operations
LET matrix = [[1, 2, 3], [4, 5, 6]]
LET transposed = TRANSPOSE(matrix)
LET reshaped = RESHAPE([1, 2, 3, 4, 5, 6], 2, 3)

-- Array inspection
LET dims = SIZE(matrix)         -- [2, 3]
LET len = LENGTH(matrix)        -- 3 (largest dimension)
LET count = NUMEL(matrix)       -- 6 (total elements)

-- Plotting
LET my_data = '[1, 5, 3, 8, 2]'
LET svg_output = PLOT(my_data)
SAY "SVG Output Length: " svg_output.length
```

## Available Functions

### Vector Generation

#### `LINSPACE(start, end, [n=100])`

Generate linearly spaced vector between start and end.

-   **`start`**: Starting value
-   **`end`**: Ending value
-   **`n`** (optional): Number of points (default: 100)
-   **Returns**: Array of n evenly spaced values

```rexx
LET x = LINSPACE(0, 10, 5)  -- [0, 2.5, 5, 7.5, 10]
```

#### `LOGSPACE(start, end, [n=50])`

Generate logarithmically spaced vector between 10^start and 10^end.

-   **`start`**: Starting exponent
-   **`end`**: Ending exponent
-   **`n`** (optional): Number of points (default: 50)
-   **Returns**: Array of n logarithmically spaced values

```rexx
LET x = LOGSPACE(0, 2, 3)  -- [1, 10, 100]
```

### Array Creation

#### `ZEROS(rows, [cols])`

Create array of zeros.

-   **`rows`**: Number of rows
-   **`cols`** (optional): Number of columns (if omitted, creates 1D array)
-   **Returns**: 1D or 2D array filled with zeros

```rexx
LET z1 = ZEROS(5)      -- [0, 0, 0, 0, 0]
LET z2 = ZEROS(2, 3)   -- [[0, 0, 0], [0, 0, 0]]
```

#### `ONES(rows, [cols])`

Create array of ones.

-   **`rows`**: Number of rows
-   **`cols`** (optional): Number of columns (if omitted, creates 1D array)
-   **Returns**: 1D or 2D array filled with ones

```rexx
LET o1 = ONES(4)       -- [1, 1, 1, 1]
LET o2 = ONES(2, 3)    -- [[1, 1, 1], [1, 1, 1]]
```

#### `EYE(n, [m])`

Create identity matrix.

-   **`n`**: Number of rows
-   **`m`** (optional): Number of columns (if omitted, creates square n×n matrix)
-   **Returns**: Identity matrix of size n×m

```rexx
LET i1 = EYE(3)        -- [[1,0,0], [0,1,0], [0,0,1]]
LET i2 = EYE(2, 4)     -- [[1,0,0,0], [0,1,0,0]]
```

### Matrix Operations

#### `DIAG(input)`

Extract diagonal or create diagonal matrix.

-   **`input`**: Vector (to create diagonal matrix) or matrix (to extract diagonal)
-   **Returns**: Vector (if input is matrix) or diagonal matrix (if input is vector)

```rexx
LET matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
LET diag_vec = DIAG(matrix)        -- [1, 5, 9]
LET diag_mat = DIAG([1, 2, 3])     -- [[1,0,0], [0,2,0], [0,0,3]]
```

#### `RESHAPE(array, rows, cols)`

Reshape array to specified dimensions.

-   **`array`**: Input array (1D or 2D)
-   **`rows`**: Target number of rows
-   **`cols`**: Target number of columns
-   **Returns**: Reshaped 2D array

```rexx
LET arr = [1, 2, 3, 4, 5, 6]
LET mat = RESHAPE(arr, 2, 3)       -- [[1, 2, 3], [4, 5, 6]]
```

#### `TRANSPOSE(matrix)`

Transpose a matrix.

-   **`matrix`**: Input 2D array
-   **Returns**: Transposed matrix

```rexx
LET mat = [[1, 2, 3], [4, 5, 6]]
LET t = TRANSPOSE(mat)             -- [[1, 4], [2, 5], [3, 6]]
```

### Array Inspection

#### `SIZE(array, [dim])`

Return dimensions of array.

-   **`array`**: Input array
-   **`dim`** (optional): Specific dimension to query (1 or 2)
-   **Returns**: Array of dimensions or single dimension if dim specified

```rexx
LET arr = [[1, 2, 3], [4, 5, 6]]
LET dims = SIZE(arr)               -- [2, 3]
LET rows = SIZE(arr, 1)            -- 2
LET cols = SIZE(arr, 2)            -- 3
```

#### `LENGTH(array)`

Return length of largest dimension.

-   **`array`**: Input array
-   **Returns**: Length of largest dimension

```rexx
LET arr = [[1, 2, 3], [4, 5, 6]]
LET len = LENGTH(arr)              -- 3
```

#### `NUMEL(array)`

Return total number of elements.

-   **`array`**: Input array
-   **Returns**: Total number of elements

```rexx
LET arr = [[1, 2, 3], [4, 5, 6]]
LET count = NUMEL(arr)             -- 6
```

### Plotting

#### `PLOT(data, [options])`

Renders a plot of the given data.

-   **`data`**: A Rexx array (or a string that can be interpreted as one) with the data to plot.
-   **`options`** (optional): A Rexx object (or a string that can be interpreted as one) with rendering options. (Currently unused)
-   **Returns**: The rendered plot as an SVG string

## Dependencies

This module currently has no external dependencies.

## Build & Test

```bash
# From within this directory (extras/functions/matlab-inspired)
npm install
npm test
```
