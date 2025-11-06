# Math Functions

Advanced mathematical computations, statistical operations, and geometric calculations for data processing and automation workflows.

## Basic Mathematical Operations

### Absolute Values and Rounding
```rexx
LET absoluteValue = MATH_ABS value="-42.5"        -- 42.5
LET absolute = ABS value=-42                      -- 42 (legacy form)

LET ceiledValue = MATH_CEIL value="3.14"         -- 4
LET flooredValue = MATH_FLOOR value="3.89"       -- 3
LET roundedValue = MATH_ROUND value="3.14159" precision="2"  -- 3.14
```

### Aggregate Operations
```rexx
LET maxValue = MATH_MAX a="10" b="25" c="15" d="8"       -- 25
LET maximum = MAX x=10 y=25 z=15                         -- 25 (legacy form)

LET minValue = MATH_MIN a="10" b="25" c="15" d="8"       -- 8
LET minimum = MIN a=3 b=7 c=2                            -- 2 (legacy form)

LET sumValue = MATH_SUM a="10" b="25" c="15" d="8"       -- 58
LET avgValue = MATH_AVERAGE a="10" b="20" c="30" d="40"  -- 25
```

## Advanced Mathematical Functions

### Power and Root Operations
```rexx
LET powerValue = MATH_POWER base="2" exponent="10"       -- 1024
LET squareRoot = MATH_SQRT value="64"                    -- 8
```

### Logarithmic Functions
```rexx
LET logBase10 = MATH_LOG value="1000" base="10"         -- 3
LET naturalLog = MATH_LOG value="2.718"                 -- ~1
```

### Factorial
```rexx
LET factorial8 = MATH_FACTORIAL value="8"               -- 40320
```

## Trigonometric Functions

### Basic Trigonometry
```rexx
-- Degrees
LET sin90 = MATH_SIN value="90" unit="degrees"          -- 1
LET cos0 = MATH_COS value="0" unit="degrees"            -- 1
LET tan45 = MATH_TAN value="45" unit="degrees"          -- 1

-- Radians  
LET sinPi2 = MATH_SIN value="1.5708" unit="radians"     -- 1
```

## Statistical and Utility Functions

### Clamping and Percentages
```rexx
LET clampedValue = MATH_CLAMP value="150" min="0" max="100"  -- 100
LET percentValue = MATH_PERCENTAGE value="75" total="300"    -- 25
```

### Random Number Generation
```rexx
LET randomFloat = MATH_RANDOM min="1.0" max="10.0"       -- e.g., 7.234
LET randomInt = MATH_RANDOM_INT min="1" max="100"        -- e.g., 42
```

## Number Theory Functions

### Greatest Common Divisor and Least Common Multiple
```rexx
LET gcdResult = MATH_GCD a="48" b="18"                   -- 6
LET lcmResult = MATH_LCM a="12" b="8"                    -- 24
```

## 2D Geometry Functions

### Distance and Angles
```rexx
LET distance = MATH_DISTANCE_2D x1="0" y1="0" x2="3" y2="4"     -- 5
LET angleDegrees = MATH_ANGLE_2D x1="0" y1="0" x2="1" y2="1" unit="degrees"  -- 45
LET angleRadians = MATH_ANGLE_2D x1="0" y1="0" x2="1" y2="0" unit="radians"  -- 0
```

## Practical Examples

### Data Analysis
```rexx
-- Sample dataset analysis
LET value1 = 23.5
LET value2 = 18.2  
LET value3 = 31.7
LET value4 = 45.1
LET value5 = 29.8

-- Statistical analysis
LET dataMax = MATH_MAX a=value1 b=value2 c=value3 d=value4 e=value5
LET dataMin = MATH_MIN a=value1 b=value2 c=value3 d=value4 e=value5
LET dataSum = MATH_SUM a=value1 b=value2 c=value3 d=value4 e=value5
LET dataAvg = MATH_AVERAGE a=value1 b=value2 c=value3 d=value4 e=value5
LET dataRange = dataMax - dataMin

SAY "Dataset Analysis:"
SAY "  Maximum: " || dataMax
SAY "  Minimum: " || dataMin  
SAY "  Sum: " || dataSum
SAY "  Average: " || dataAvg
SAY "  Range: " || dataRange

-- Normalize data to 0-1 scale
LET norm1 = MATH_PERCENTAGE value=(value1-dataMin) total=dataRange
LET norm2 = MATH_PERCENTAGE value=(value2-dataMin) total=dataRange
SAY "Normalized values: " || norm1 || "%, " || norm2 || "%"
```

### Scientific Calculations
```rexx
-- Projectile motion calculation
LET velocity = 50  -- m/s
LET angle = 45     -- degrees
LET gravity = 9.81 -- m/s²

-- Calculate velocity components  
LET vx = velocity * MATH_COS value=angle unit="degrees"
LET vy = velocity * MATH_SIN value=angle unit="degrees"

-- Calculate time of flight
LET timeOfFlight = 2 * vy / gravity

-- Calculate range
LET range = vx * timeOfFlight

-- Calculate maximum height
LET maxHeight = MATH_POWER base=vy exponent="2" / (2 * gravity)

SAY "Projectile motion results:"
SAY "  Initial velocity: " || velocity || " m/s at " || angle || "°"
SAY "  Velocity components: vx=" || vx || " m/s, vy=" || vy || " m/s"
SAY "  Time of flight: " || timeOfFlight || " seconds"
SAY "  Range: " || range || " meters"
SAY "  Maximum height: " || maxHeight || " meters"
```

### Financial Calculations
```rexx
-- Compound interest calculation
LET principal = 10000  -- Initial investment
LET rate = 0.05        -- 5% annual interest
LET years = 10         -- Investment period

-- Compound interest formula: A = P(1 + r)^t
LET growthFactor = 1 + rate
LET compoundAmount = principal * MATH_POWER base=growthFactor exponent=years
LET interestEarned = compoundAmount - principal
LET effectiveRate = MATH_PERCENTAGE value=interestEarned total=principal

SAY "Investment Analysis:"
SAY "  Principal: $" || principal
SAY "  Annual rate: " || (rate * 100) || "%"  
SAY "  Final amount: $" || compoundAmount
SAY "  Interest earned: $" || interestEarned
SAY "  Effective return: " || effectiveRate || "%"
```

### Quality Control Analysis
```rexx
-- Statistical quality control
LET sample1 = 98.2
LET sample2 = 99.1
LET sample3 = 97.8
LET sample4 = 100.3
LET sample5 = 98.9

LET sampleAvg = MATH_AVERAGE a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET sampleMax = MATH_MAX a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET sampleMin = MATH_MIN a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET tolerance = 2.0
LET target = 99.0

-- Check if samples are within tolerance
LET upperLimit = target + tolerance
LET lowerLimit = target - tolerance
LET withinSpec = (sampleMax <= upperLimit) AND (sampleMin >= lowerLimit)

SAY "Quality Control Results:"
SAY "  Sample average: " || sampleAvg
SAY "  Target: " || target || " ±" || tolerance
SAY "  Range: [" || sampleMin || ", " || sampleMax || "]"
SAY "  Within specification: " || withinSpec

-- Generate control chart bounds  
LET upperControlLimit = target + (3 * tolerance / 2)
LET lowerControlLimit = target - (3 * tolerance / 2)
SAY "  Control limits: [" || lowerControlLimit || ", " || upperControlLimit || "]"
```

### Engineering Calculations
```rexx
-- Geometric calculations for engineering
LET pointA_x = 0
LET pointA_y = 0
LET pointB_x = 5
LET pointB_y = 12

-- Calculate distance between points
LET distance = MATH_DISTANCE_2D x1=pointA_x y1=pointA_y x2=pointB_x y2=pointB_y
SAY "Distance between points: " || distance || " units"

-- Calculate angle of line
LET lineAngle = MATH_ANGLE_2D x1=pointA_x y1=pointA_y x2=pointB_x y2=pointB_y unit="degrees"
SAY "Line angle: " || lineAngle || "°"

-- Calculate perpendicular angle
LET perpAngle = lineAngle + 90
IF perpAngle > 360 THEN
    LET perpAngle = perpAngle - 360
ENDIF
SAY "Perpendicular angle: " || perpAngle || "°"
```

## Advanced Statistical Functions

### REGRESSION - Statistical Regression Analysis
Performs linear and polynomial regression analysis with comprehensive metrics.

**Usage:**
```rexx
-- Linear regression
LET x_values = "[1, 2, 3, 4, 5]"
LET y_values = "[2, 4, 6, 8, 10]"
LET result = REGRESSION xValues=x_values yValues=y_values type="linear"

-- Access regression results
SAY "Slope: " || result.slope              -- 2
SAY "Intercept: " || result.intercept      -- 0  
SAY "R-squared: " || result.rSquared       -- 1.0
SAY "Equation: " || result.equation        -- "y = 2.0000x + 0.0000"

-- Polynomial regression
LET quad_y = "[1, 4, 9, 16, 25]"  -- x² relationship
LET poly_result = REGRESSION xValues=x_values yValues=quad_y type="polynomial"
SAY "Quadratic coefficient: " || poly_result.coefficients[2]  -- ~1.0
```

**Parameters:**
- `xValues` - Array of independent variable values (numbers or JSON string)
- `yValues` - Array of dependent variable values (numbers or JSON string)  
- `type` - Regression type: "linear" (default) or "polynomial"

**Returns:**
Object with regression analysis results including slope, intercept, correlation coefficient, R-squared value, equation string, and fitted predictions.

### FORECAST - Time Series Forecasting
Generates future value predictions using multiple forecasting algorithms.

**Usage:**
```rexx
-- Linear trend forecasting
LET historical = "[100, 110, 120, 130, 140]"
LET forecast = FORECAST data=historical periods=3 method="linear"

-- Access forecasting results  
SAY "Method: " || forecast.method          -- "linear"
SAY "Trend: " || forecast.trend           -- "increasing"
SAY "Confidence: " || forecast.confidence  -- 1.0

-- Display forecasted values
DO i = 0 TO ARRAY_LENGTH(array=forecast.forecasts) - 1
  LET value = ARRAY_GET array=forecast.forecasts index=i
  SAY "Period " || (i + 1) || ": " || value
END

-- Different forecasting methods
LET mean_forecast = FORECAST data=historical periods=2 method="mean"
LET exp_forecast = FORECAST data=historical periods=2 method="exponential"
LET ma_forecast = FORECAST data=historical periods=1 method="moving_average"
```

**Parameters:**
- `data` - Historical time series data (numbers or JSON string)
- `periods` - Number of periods to forecast (default: 1)
- `method` - Forecasting method: "linear", "mean", "exponential", or "moving_average"

**Methods:**
- **linear**: Trend-based forecasting using regression analysis
- **mean**: Simple average of historical data  
- **exponential**: Exponentially weighted smoothing
- **moving_average**: Average of recent values (window size 3)

**Returns:**
Object with forecasted values, method used, trend direction, confidence score, and method-specific parameters.

### Data Analysis Examples
```rexx
-- Sales trend analysis
LET monthlySales = "[45000, 48000, 52000, 55000, 58000, 61000]"
LET salesTrend = FORECAST data=monthlySales periods=3 method="linear"

IF salesTrend.trend = "increasing" THEN
    SAY "Sales trending upward - projected growth"
ELSE IF salesTrend.trend = "decreasing" THEN  
    SAY "Sales declining - intervention needed"
ELSE
    SAY "Sales stable - maintaining current levels"
ENDIF

-- Temperature correlation analysis
LET temperatures = "[20, 22, 25, 27, 30]"
LET iceCreamSales = "[100, 120, 150, 180, 200]"  
LET correlation = REGRESSION xValues=temperatures yValues=iceCreamSales

IF correlation.rSquared > 0.8 THEN
    SAY "Strong correlation between temperature and sales"
    SAY "For every 1°C increase, sales increase by " || correlation.slope || " units"
ENDIF
```

## Legacy Function Compatibility

The following traditional forms are also supported for backwards compatibility:

```rexx
-- Legacy forms (still work)
LET maximum = MAX x=10 y=25 z=8           -- Use MATH_MAX for new code
LET minimum = MIN x=10 y=25 z=8           -- Use MATH_MIN for new code  
LET absolute = ABS value=-42              -- Use MATH_ABS for new code
```

**See also:**
- [Excel Functions](14-excel-functions.md) for spreadsheet-style mathematical operations
- [Array Functions](06-array-functions.md) for mathematical operations on collections
- [Basic Syntax](01-basic-syntax.md) for using math functions in expressions