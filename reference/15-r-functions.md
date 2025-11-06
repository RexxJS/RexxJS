# R-Language Functions

Comprehensive R-language statistical computing functions covering data manipulation, statistical analysis, linear algebra, and scientific visualization.

## Summary Functions

Basic statistical summaries and descriptive statistics.

**`R_MAX`** - Maximum value
```rexx
LET numbers = JSON_PARSE text="[3, 1, 4, 1, 5, 9]"
LET maximum = R_MAX data=numbers  -- Returns: 9
```

**`R_MIN`** - Minimum value  
```rexx
LET numbers = JSON_PARSE text="[3, 1, 4, 1, 5, 9]"
LET minimum = R_MIN data=numbers  -- Returns: 1
```

**`R_SUM`** - Sum of values
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET total = R_SUM data=numbers  -- Returns: 15
```

**`R_MEAN`** - Arithmetic mean
```rexx
LET numbers = JSON_PARSE text="[2, 4, 6, 8, 10]"
LET average = R_MEAN data=numbers  -- Returns: 6
```

**`R_MEDIAN`** - Median value
```rexx
LET numbers = JSON_PARSE text="[1, 3, 5, 7, 9]"
LET middle = R_MEDIAN data=numbers  -- Returns: 5
```

**`R_MODE`** - Most frequent value
```rexx
LET numbers = JSON_PARSE text="[1, 2, 2, 3, 2, 4]"
LET frequent = R_MODE data=numbers  -- Returns: 2
```

**`R_VAR`** - Variance
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET variance = R_VAR data=numbers  -- Returns: 2.5
```

**`R_SD`** - Standard deviation
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET stdev = R_SD data=numbers  -- Returns: 1.58
```

**`R_RANGE`** - Range (max - min)
```rexx
LET numbers = JSON_PARSE text="[10, 5, 8, 12, 3]"
LET range = R_RANGE data=numbers  -- Returns: 9
```

**`R_IQR`** - Interquartile range
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9]"
LET iqr = R_IQR data=numbers  -- Returns: 4
```

**`R_QUANTILE`** - Quantile values
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET q25 = R_QUANTILE data=numbers prob=0.25  -- Returns: 3.25
LET q75 = R_QUANTILE data=numbers prob=0.75  -- Returns: 7.75
```

**`R_SUMMARY`** - Five-number summary
```rexx
LET numbers = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET summary = R_SUMMARY data=numbers
-- Returns: {min: 1, q1: 3.25, median: 5.5, q3: 7.75, max: 10}
```

## Mathematical Functions

Advanced mathematical operations and functions.

**`R_SQRT`** - Square root
```rexx
LET numbers = JSON_PARSE text="[1, 4, 9, 16, 25]"  
LET roots = R_SQRT data=numbers  -- Returns: [1, 2, 3, 4, 5]
```

**`R_LOG`** - Natural logarithm
```rexx
LET numbers = JSON_PARSE text="[1, 2.718, 7.389]"
LET logs = R_LOG data=numbers  -- Returns: [0, 1, 2]
```

**`R_LOG10`** - Base-10 logarithm
```rexx
LET numbers = JSON_PARSE text="[1, 10, 100, 1000]"
LET logs = R_LOG10 data=numbers  -- Returns: [0, 1, 2, 3]
```

**`R_LOG2`** - Base-2 logarithm
```rexx
LET numbers = JSON_PARSE text="[1, 2, 4, 8, 16]"
LET logs = R_LOG2 data=numbers  -- Returns: [0, 1, 2, 3, 4]
```

**`R_EXP`** - Exponential function
```rexx
LET numbers = JSON_PARSE text="[0, 1, 2, 3]"
LET exps = R_EXP data=numbers  -- Returns: [1, 2.718, 7.389, 20.086]
```

**`R_ABS`** - Absolute value
```rexx
LET numbers = JSON_PARSE text="[-3, -1, 0, 1, 3]"
LET abs_vals = R_ABS data=numbers  -- Returns: [3, 1, 0, 1, 3]
```

**`R_ROUND`** - Round to digits
```rexx
LET numbers = JSON_PARSE text="[3.14159, 2.71828]"
LET rounded = R_ROUND data=numbers digits=2  -- Returns: [3.14, 2.72]
```

**Trigonometric Functions:**
```rexx
LET angles = JSON_PARSE text="[0, 1.57, 3.14]"  -- 0, π/2, π
LET sines = R_SIN data=angles      -- Returns: [0, 1, 0]
LET cosines = R_COS data=angles    -- Returns: [1, 0, -1]
LET tangents = R_TAN data=angles   -- Returns: [0, ∞, 0]
```

**Special Functions:**
```rexx
LET n = 5
LET factorial = R_FACTORIAL n=n             -- Returns: 120
LET gamma = R_GAMMA x=4                     -- Returns: 6 (Γ(4) = 3!)
LET choose = R_CHOOSE n=5 k=2               -- Returns: 10 (5 choose 2)
LET beta = R_BETA a=2 b=3                   -- Returns: 0.083
```

## Matrix Functions

Linear algebra operations for matrices and vectors.

**`R_MATRIX`** - Create matrix
```rexx
LET data = JSON_PARSE text="[1, 2, 3, 4, 5, 6]"
LET matrix = R_MATRIX data=data nrow=2 ncol=3
-- Creates 2x3 matrix: [[1, 2, 3], [4, 5, 6]]
```

**`R_CBIND`** - Column bind
```rexx
LET col1 = JSON_PARSE text="[1, 2, 3]"
LET col2 = JSON_PARSE text="[4, 5, 6]"
LET matrix = R_CBIND a=col1 b=col2
-- Returns: [[1, 4], [2, 5], [3, 6]]
```

**`R_RBIND`** - Row bind
```rexx
LET row1 = JSON_PARSE text="[1, 2, 3]"
LET row2 = JSON_PARSE text="[4, 5, 6]" 
LET matrix = R_RBIND a=row1 b=row2
-- Returns: [[1, 2, 3], [4, 5, 6]]
```

**`R_T`** - Matrix transpose
```rexx
LET matrix = JSON_PARSE text="[[1, 2, 3], [4, 5, 6]]"
LET transposed = R_T data=matrix
-- Returns: [[1, 4], [2, 5], [3, 6]]
```

**`R_DET`** - Matrix determinant
```rexx
LET matrix = JSON_PARSE text="[[4, 3], [2, 1]]"
LET determinant = R_DET data=matrix  -- Returns: -2
```

**`R_SOLVE`** - Solve linear system
```rexx
LET A = JSON_PARSE text="[[2, 1], [1, 3]]"
LET b = JSON_PARSE text="[5, 8]"
LET solution = R_SOLVE A=A b=b
-- Solves Ax = b, returns: [1, 3]
```

**`R_EIGEN`** - Eigenvalues and eigenvectors
```rexx
LET matrix = JSON_PARSE text="[[4, -2], [1, 1]]"
LET eigen = R_EIGEN data=matrix
-- Returns: {values: [3, 2], vectors: [[2, 1], [1, 1]]}
```

**`R_SVD`** - Singular value decomposition
```rexx
LET matrix = JSON_PARSE text="[[1, 2], [3, 4], [5, 6]]"
LET svd = R_SVD data=matrix
-- Returns: {U: matrix, D: [9.5, 0.77], V: matrix}
```

## Data Manipulation Functions

Data processing and transformation operations.

**`R_C`** - Combine values
```rexx
LET combined = R_C a=1 b=2 c=3  -- Returns: [1, 2, 3]
```

**`R_REP`** - Repeat values
```rexx
LET repeated = R_REP x=5 times=3        -- Returns: [5, 5, 5]
LET repeated2 = R_REP x="hello" times=2 -- Returns: ["hello", "hello"]
```

**`R_SEQ`** - Generate sequences  
```rexx
LET sequence = R_SEQ from=1 to=10 by=2  -- Returns: [1, 3, 5, 7, 9]
LET sequence2 = R_SEQ from=0 to=1 length=5  -- Returns: [0, 0.25, 0.5, 0.75, 1]
```

**`R_SORT`** - Sort values
```rexx
LET numbers = JSON_PARSE text="[3, 1, 4, 1, 5]"
LET sorted = R_SORT data=numbers decreasing=false  -- Returns: [1, 1, 3, 4, 5]
```

**`R_ORDER`** - Get sort indices
```rexx
LET numbers = JSON_PARSE text="[3, 1, 4, 1, 5]"
LET indices = R_ORDER data=numbers  -- Returns: [2, 4, 1, 3, 5] (1-based)
```

**`R_UNIQUE`** - Unique values
```rexx
LET numbers = JSON_PARSE text="[1, 2, 2, 3, 2, 4]"
LET unique = R_UNIQUE data=numbers  -- Returns: [1, 2, 3, 4]
```

**`R_WHICH`** - Find TRUE indices
```rexx
LET conditions = JSON_PARSE text="[true, false, true, false, true]"
LET indices = R_WHICH data=conditions  -- Returns: [1, 3, 5] (1-based)
```

## Apply Functions

Functional programming operations.

**`R_APPLY`** - Apply function over arrays
```rexx
LET matrix = JSON_PARSE text="[[1, 2, 3], [4, 5, 6]]"
LET row_sums = R_APPLY data=matrix margin=1 fun="sum"
-- Returns: [6, 15] (sum of each row)

LET col_sums = R_APPLY data=matrix margin=2 fun="sum"  
-- Returns: [5, 7, 9] (sum of each column)
```

**`R_LAPPLY`** - List apply
```rexx
LET lists = JSON_PARSE text="[[1, 2, 3], [4, 5], [6]]"
LET lengths = R_LAPPLY data=lists fun="length"
-- Returns: [3, 2, 1]
```

**`R_SAPPLY`** - Simplified apply
```rexx
LET numbers = JSON_PARSE text="[1, 4, 9, 16]"
LET roots = R_SAPPLY data=numbers fun="sqrt"
-- Returns: [1, 2, 3, 4]
```

## String Functions  

String manipulation and processing.

**`R_PASTE`** - Paste strings
```rexx
LET words = JSON_PARSE text="[\"hello\", \"world\", \"!\"]"
LET sentence = R_PASTE data=words sep=" "  -- Returns: "hello world !"
```

**`R_PASTE0`** - Paste without separator
```rexx  
LET parts = JSON_PARSE text="[\"file\", \"name\", \".txt\"]"
LET filename = R_PASTE0 data=parts  -- Returns: "filename.txt"
```

**`R_NCHAR`** - Number of characters
```rexx
LET words = JSON_PARSE text="[\"hello\", \"world\"]"
LET lengths = R_NCHAR data=words  -- Returns: [5, 5]
```

**`R_SUBSTR`** - Substring
```rexx
LET text = "Hello World"
LET sub = R_SUBSTR data=text start=7 stop=11  -- Returns: "World"
```

**`R_STRSPLIT`** - Split strings
```rexx
LET text = "apple,banana,cherry"
LET parts = R_STRSPLIT data=text pattern=","
-- Returns: ["apple", "banana", "cherry"]
```

## Factor Functions

Categorical data handling.

**`R_FACTOR`** - Create factor
```rexx
LET data = JSON_PARSE text="[\"red\", \"blue\", \"red\", \"green\", \"blue\"]"
LET factor = R_FACTOR data=data levels="[\"red\", \"green\", \"blue\"]"
-- Returns: {data: [1, 3, 1, 2, 3], levels: ["red", "green", "blue"]}
```

**`R_LEVELS`** - Get factor levels
```rexx
LET factor = R_FACTOR data="[\"A\", \"B\", \"A\", \"C\"]"
LET levels = R_LEVELS factor=factor  -- Returns: ["A", "B", "C"]
```

**`R_NLEVELS`** - Number of levels
```rexx
LET factor = R_FACTOR data="[\"X\", \"Y\", \"Z\", \"X\"]"
LET n_levels = R_NLEVELS factor=factor  -- Returns: 3
```

## DataFrame Functions

Structured data manipulation.

**`R_DATA_FRAME`** - Create data frame
```rexx
LET names = JSON_PARSE text="[\"Alice\", \"Bob\", \"Charlie\"]"
LET ages = JSON_PARSE text="[25, 30, 35]"
LET df = R_DATA_FRAME name=names age=ages
-- Returns: {name: ["Alice", "Bob", "Charlie"], age: [25, 30, 35]}
```

**`R_HEAD`** - First rows
```rexx
LET df = R_DATA_FRAME x="[1, 2, 3, 4, 5]" y="[10, 20, 30, 40, 50]"
LET first_3 = R_HEAD data=df n=3
-- Returns first 3 rows
```

**`R_SUMMARY`** - Summary statistics
```rexx
LET df = R_DATA_FRAME score="[85, 90, 78, 92, 88]"
LET summary = R_SUMMARY data=df
-- Returns summary stats for each column
```

## Time Series Functions

Time series analysis and forecasting.

**`R_TS`** - Create time series
```rexx
LET data = JSON_PARSE text="[10, 12, 13, 12, 15, 16, 18, 17, 19, 20, 22, 21]"
LET ts = R_TS data=data frequency=12 start="[2023, 1]"
-- Creates monthly time series starting January 2023
```

**`R_LAG`** - Lag series
```rexx
LET data = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET lagged = R_LAG data=data k=1  -- Returns: [NA, 1, 2, 3, 4]
```

**`R_DIFF`** - Difference series
```rexx
LET data = JSON_PARSE text="[10, 12, 15, 13, 18]"
LET differences = R_DIFF data=data  -- Returns: [2, 3, -2, 5]
```

**`R_ACF`** - Autocorrelation function
```rexx
LET ts_data = JSON_PARSE text="[1, 2, 3, 2, 1, 2, 3, 2, 1]"
LET acf = R_ACF data=ts_data lag_max=3
-- Returns autocorrelations at lags 0, 1, 2, 3
```

## Graphics Functions

Statistical visualization and plotting.

**`R_HIST`** - Histogram
```rexx
LET data = JSON_PARSE text="[1, 2, 2, 3, 3, 3, 4, 4, 5]"
LET histogram = R_HIST data=data bins=5 title="Sample Data"
-- Creates histogram with 5 bins
```

**`R_BOXPLOT`** - Box plot
```rexx
LET data = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET boxplot = R_BOXPLOT data=data title="Distribution"
-- Creates box plot showing quartiles and outliers
```

**`R_SCATTER`** - Scatter plot
```rexx
LET x = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET y = JSON_PARSE text="[2, 4, 6, 8, 10]"
LET scatter = R_SCATTER x=x y=y title="Linear Relationship"
-- Creates scatter plot of x vs y
```

**`R_LINE`** - Line plot
```rexx
LET x = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET y = JSON_PARSE text="[1, 4, 9, 16, 25]"
LET line_plot = R_LINE x=x y=y title="Quadratic Growth"
-- Creates line plot connecting points
```

**`R_DENSITY`** - Density plot
```rexx
LET data = JSON_PARSE text="[1, 2, 2, 3, 3, 3, 4, 4, 5]"
LET density = R_DENSITY data=data bandwidth=0.5
-- Creates kernel density estimate
```

## Machine Learning Functions

Statistical modeling and prediction.

**`R_LM`** - Linear model
```rexx
LET x = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET y = JSON_PARSE text="[2.1, 3.9, 6.1, 7.8, 10.2]"
LET model = R_LM x=x y=y
-- Fits y = a + b*x, returns coefficients and statistics
```

**`R_PREDICT`** - Model prediction
```rexx
LET model = R_LM x="[1, 2, 3, 4]" y="[2, 4, 6, 8]"
LET new_x = JSON_PARSE text="[5, 6]"
LET predictions = R_PREDICT model=model newdata=new_x
-- Returns: [10, 12] (predicted y values)
```

**`R_KMEANS`** - K-means clustering
```rexx
LET data = JSON_PARSE text="[[1, 2], [2, 1], [8, 9], [9, 8]]"
LET clusters = R_KMEANS data=data k=2
-- Returns cluster assignments and centers
```

**`R_PCA`** - Principal component analysis
```rexx
LET data = JSON_PARSE text="[[2.5, 2.4], [0.5, 0.7], [2.2, 2.9], [1.9, 2.2]]"
LET pca = R_PCA data=data
-- Returns principal components, loadings, and variance explained
```

## Advanced Examples

### Multi-step Data Analysis
```rexx
-- Load and prepare data
LET raw_data = JSON_PARSE text="[23, 25, 27, 29, 31, 33, 35, 37, 39, 41]"

-- Calculate summary statistics
LET mean_val = R_MEAN data=raw_data
LET sd_val = R_SD data=raw_data
LET summary = R_SUMMARY data=raw_data

-- Standardize the data
LET standardized = R_APPLY data=raw_data fun="scale" center=mean_val scale=sd_val

-- Create visualizations
LET histogram = R_HIST data=raw_data bins=5 title="Raw Data Distribution"
LET boxplot = R_BOXPLOT data=raw_data title="Data Summary"

SAY "Mean: " || mean_val
SAY "Standard Deviation: " || sd_val
SAY "Summary: " || JSON_STRINGIFY(data=summary)
```

### Matrix Operations Workflow
```rexx
-- Create matrices
LET A = R_MATRIX data="[1, 2, 3, 4]" nrow=2 ncol=2
LET B = R_MATRIX data="[5, 6, 7, 8]" nrow=2 ncol=2

-- Perform operations
LET sum_matrix = R_MATMULT A=A B=B
LET det_A = R_DET data=A
LET inv_A = R_INV data=A
LET eigenvalues = R_EIGEN data=A

SAY "Matrix A * B: " || JSON_STRINGIFY(data=sum_matrix)
SAY "Determinant of A: " || det_A
SAY "Eigenvalues of A: " || JSON_STRINGIFY(data=eigenvalues)
```

### Time Series Analysis
```rexx
-- Generate time series data
LET trend = R_SEQ from=1 to=24 by=1
LET seasonal = R_SIN data="[0.52, 1.05, 1.57, 2.09, 2.62, 3.14]"
LET noise = R_RANDOM_NORMAL n=24 mean=0 sd=0.5
LET ts_data = R_APPLY arrays="[trend, seasonal, noise]" fun="sum"

-- Create time series object
LET ts = R_TS data=ts_data frequency=12 start="[2023, 1]"

-- Analyze time series
LET acf_result = R_ACF data=ts_data lag_max=6
LET decomposed = R_DECOMPOSE data=ts type="additive"
LET forecast = R_FORECAST model=ts h=6

SAY "Autocorrelations: " || JSON_STRINGIFY(data=acf_result)
SAY "6-month forecast: " || JSON_STRINGIFY(data=forecast)
```

R-language functions provide comprehensive statistical computing capabilities, enabling sophisticated data analysis, visualization, and modeling within the Rexx environment. The functions maintain R's familiar syntax and behavior while integrating seamlessly with Rexx's control structures and variable system.