# Excel Functions

Comprehensive Excel/Google Sheets-compatible functions for spreadsheet-like data analysis, calculations, and automation workflows.

## Logical Functions

### IF Function - Conditional Logic
```rexx
-- Basic conditional logic
LET result = IF condition=true trueValue="Yes" falseValue="No"
LET grade = IF condition=(score>90) trueValue="A" falseValue="B"
LET status = IF condition=(age>=18) trueValue="Adult" falseValue="Minor"

-- Nested conditions
LET temperature = 75
LET weather = IF condition=(temperature>80) trueValue="Hot" falseValue=IF(condition=(temperature>60) trueValue="Warm" falseValue="Cold")

SAY "Weather assessment: " || weather
```

### AND Function - Multiple Conditions
```rexx
-- Multiple condition AND logic
LET allTrue = AND a=true b=true c=true
LET qualified = AND age>=18 hasLicense=true experience>=2

-- Complex qualification check
LET age = 25
LET hasLicense = true
LET experience = 3
LET backgroundCheck = true

LET driverQualified = AND age>=21 hasLicense=true experience>=1 backgroundCheck=true

SAY "Driver qualified: " || driverQualified

-- Using in conditional statements
IF AND age>=18 hasLicense=true experience>=2 THEN
    SAY "Eligible for premium insurance rates"
ELSE
    SAY "Standard insurance rates apply"
ENDIF
```

### OR Function - Alternative Conditions
```rexx
-- Multiple condition OR logic
LET anyTrue = OR a=false b=true c=false
LET eligible = OR premium=true loyalty>=5 referral=true

-- Membership benefits eligibility
LET isPremium = false
LET loyaltyYears = 6
LET hasReferral = true

LET getsBenefits = OR premium=isPremium loyalty>=loyaltyYears referral=hasReferral

SAY "Eligible for benefits: " || getsBenefits

-- Emergency contact validation
LET hasPhone = true
LET hasEmail = false
LET hasAddress = true

LET canContact = OR phone=hasPhone email=hasEmail address=hasAddress
SAY "Can contact customer: " || canContact
```

### NOT Function - Logical Negation
```rexx
-- Logical negation
LET opposite = NOT value=true
LET inactive = NOT status="active"

-- Status validation
LET accountActive = true
LET accountSuspended = NOT active=accountActive
LET maintenanceMode = false
LET systemAvailable = NOT maintenance=maintenanceMode

SAY "Account suspended: " || accountSuspended
SAY "System available: " || systemAvailable
```

## Statistical Functions

### Basic Statistics
```rexx
-- Calculate averages
LET average = AVERAGE a=10 b=20 c=30 d=40
LET salesAverage = AVERAGE q1=50000 q2=60000 q3=55000 q4=75000

-- Array-based calculations
LET testScores = "[85, 92, 78, 96, 88, 91]"
LET mean = AVERAGE values=testScores

SAY "Sales average: $" || salesAverage
SAY "Test score average: " || mean

-- Find median value  
LET median = MEDIAN a=1 b=2 c=3 d=4 e=5
LET salaryMedian = MEDIAN low=45000 mid1=52000 mid2=58000 mid3=61000 high=75000

SAY "Salary median: $" || salaryMedian
```

### Advanced Statistics
```rexx
-- Standard deviation and variance
LET testData = "[2, 4, 4, 4, 5, 5, 7, 9]"
LET stdev = STDEV a=2 b=4 c=4 d=4 e=5 f=5 g=7 h=9
LET variance = VAR sample=testData

SAY "Standard deviation: " || stdev
SAY "Variance: " || variance

-- Mode calculation (most frequent value)
LET mostFrequent = MODE a=1 b=2 c=2 d=3 e=2
LET commonScore = MODE dataset="[85, 88, 88, 91, 88, 94]"

SAY "Most common score: " || commonScore

-- Percentile calculations
LET scores = "[65, 70, 75, 80, 85, 90, 95]"
LET percentile75 = PERCENTILE array=scores k=0.75
LET percentile25 = PERCENTILE array=scores k=0.25

SAY "75th percentile: " || percentile75
SAY "25th percentile: " || percentile25
```

## Lookup Functions

### VLOOKUP - Vertical Lookup
```rexx
-- Basic vertical lookup
LET employeeTable = '[["John", 50000], ["Alice", 60000], ["Bob", 55000], ["Carol", 62000]]'
LET johnSalary = VLOOKUP lookupValue="John" tableArray=employeeTable columnIndex=2

SAY "John's salary: $" || johnSalary

-- Product pricing lookup
LET priceTable = '[["Basic", 99], ["Standard", 199], ["Premium", 399], ["Enterprise", 999]]'
LET customerTier = "Premium"
LET basePrice = VLOOKUP lookupValue=customerTier tableArray=priceTable columnIndex=2

SAY "Base price for " || customerTier || ": $" || basePrice

-- Tax bracket lookup
LET taxBrackets = '[["0-25000", 0.10], ["25001-50000", 0.15], ["50001-100000", 0.22], ["100001+", 0.24]]'
LET income = 75000

-- Find appropriate bracket (simplified)
LET taxRate = VLOOKUP lookupValue="50001-100000" tableArray=taxBrackets columnIndex=2
SAY "Tax rate for $" || income || ": " || (taxRate * 100) || "%"
```

### HLOOKUP - Horizontal Lookup
```rexx
-- Horizontal lookup in tables
LET quarterlyData = '[["Q1", "Q2", "Q3", "Q4"], [15000, 18000, 22000, 25000]]'
LET q3Revenue = HLOOKUP lookupValue="Q3" tableArray=quarterlyData rowIndex=2

SAY "Q3 Revenue: $" || q3Revenue

-- Monthly performance lookup
LET monthlyPerf = '[["Jan", "Feb", "Mar", "Apr"], [95, 87, 92, 98]]'
LET marchScore = HLOOKUP lookupValue="Mar" tableArray=monthlyPerf rowIndex=2

SAY "March performance: " || marchScore || "%"
```

### INDEX and MATCH Functions
```rexx
-- Direct array indexing
LET salesData = "[10000, 15000, 12000, 18000, 20000]"
LET thirdMonth = INDEX array=salesData row=3

SAY "Third month sales: $" || thirdMonth

-- Find position of value
LET targetSales = 18000
LET position = MATCH lookupValue=targetSales lookupArray=salesData

IF position > 0 THEN
    SAY "Target sales achieved in month: " || position
ELSE
    SAY "Target sales not found"
ENDIF

-- Combined INDEX/MATCH for flexible lookup
LET productNames = "[\"Widget A\", \"Widget B\", \"Widget C\", \"Widget D\"]"
LET productPrices = "[25.99, 45.50, 12.75, 89.00]"
LET searchProduct = "Widget C"

LET productIndex = MATCH lookupValue=searchProduct lookupArray=productNames
LET productPrice = INDEX array=productPrices row=productIndex

SAY searchProduct || " costs: $" || productPrice
```

## Text Functions

### String Manipulation
```rexx
-- Concatenate strings
LET firstName = "John"
LET lastName = "Doe"
LET fullName = CONCATENATE firstName=firstName separator=" " lastName=lastName

SAY "Full name: " || fullName

-- Multiple concatenation
LET address = CONCATENATE street="123 Main St" separator=", " city="Anytown" separator2=", " state="ST" separator3=" " zip="12345"
SAY "Address: " || address

-- Extract substrings
LET text = "Hello World Excel"
LET leftPart = LEFT text=text numChars=5        -- "Hello"
LET rightPart = RIGHT text=text numChars=5      -- "Excel"  
LET midPart = MID text=text startNum=7 numChars=5  -- "World"

SAY "Left: " || leftPart
SAY "Right: " || rightPart
SAY "Middle: " || midPart
```

### String Formatting
```rexx
-- String length and case conversion
LET sampleText = "Hello World"
LET textLength = LEN text=sampleText

SAY "Text length: " || textLength

-- Case conversions
LET upperText = EXCEL_UPPER text="hello world"
LET lowerText = EXCEL_LOWER text="HELLO WORLD"  
LET properText = PROPER text="hello world"

SAY "Upper: " || upperText
SAY "Lower: " || lowerText
SAY "Proper: " || properText

-- Trim whitespace
LET spacedText = "  spaced text  "
LET trimmed = EXCEL_TRIM text=spacedText

SAY "Original: [" || spacedText || "]"
SAY "Trimmed: [" || trimmed || "]"
```

### String Replacement
```rexx
-- Text substitution
LET original = "Hello World"
LET replaced = SUBSTITUTE text=original oldText="World" newText="Excel"

SAY "Original: " || original
SAY "Replaced: " || replaced

-- Multiple replacements
LET phoneNumber = "123-456-7890"
LET formatted = SUBSTITUTE text=phoneNumber oldText="-" newText="."

SAY "Phone formatted: " || formatted

-- Data cleaning
LET rawData = "abc-def-ghi"
LET cleaned = SUBSTITUTE text=rawData oldText="-" newText="_"

SAY "Cleaned data: " || cleaned
```

## Date Functions

### Current Date Functions
```rexx
-- Current date and time
LET today = TODAY
LET currentDateTime = EXCEL_NOW

SAY "Today: " || today
SAY "Current date/time: " || currentDateTime

-- Date component extraction
LET currentYear = YEAR date=today
LET currentMonth = MONTH date=today  
LET currentDay = DAY date=today
LET dayOfWeek = WEEKDAY date=today

SAY "Year: " || currentYear
SAY "Month: " || currentMonth
SAY "Day: " || currentDay
SAY "Day of week: " || dayOfWeek
```

## Financial Functions

### Loan Calculations
```rexx
-- Monthly payment calculation
LET principal = 200000      -- Loan amount
LET annualRate = 0.06       -- 6% annual rate
LET monthlyRate = annualRate / 12
LET years = 30
LET totalPayments = years * 12

LET monthlyPayment = PMT rate=monthlyRate nper=totalPayments pv=principal

SAY "Loan Analysis:"
SAY "  Principal: $" || principal
SAY "  Rate: " || (annualRate * 100) || "%"
SAY "  Term: " || years || " years"
SAY "  Monthly Payment: $" || MATH_ROUND(value=monthlyPayment precision=2)

-- Total interest calculation
LET totalPaid = monthlyPayment * totalPayments
LET totalInterest = totalPaid - principal
SAY "  Total Interest: $" || MATH_ROUND(value=totalInterest precision=2)
```

### Investment Calculations
```rexx
-- Future value calculation
LET monthlyInvestment = 1000
LET annualReturn = 0.08
LET monthlyReturn = annualReturn / 12
LET investmentYears = 10
LET investmentPeriods = investmentYears * 12

LET futureValue = FV rate=monthlyReturn nper=investmentPeriods pmt=monthlyInvestment

SAY "Investment Projection:"
SAY "  Monthly Investment: $" || monthlyInvestment
SAY "  Annual Return: " || (annualReturn * 100) || "%"
SAY "  Investment Period: " || investmentYears || " years"
SAY "  Future Value: $" || MATH_ROUND(value=futureValue precision=2)

-- Present value calculation
LET targetAmount = 100000
LET requiredPV = PV rate=monthlyReturn nper=investmentPeriods fv=targetAmount

SAY "  Present value for $" || targetAmount || " target: $" || MATH_ROUND(value=requiredPV precision=2)
```

### Advanced Financial Analysis
```rexx
-- Net Present Value calculation
LET initialInvestment = -50000
LET year1 = 15000
LET year2 = 18000
LET year3 = 22000
LET year4 = 25000
LET discountRate = 0.10

LET npvResult = NPV rate=discountRate a=initialInvestment b=year1 c=year2 d=year3 e=year4

SAY "Investment NPV Analysis:"
SAY "  Initial Investment: $" || initialInvestment
SAY "  Discount Rate: " || (discountRate * 100) || "%"
SAY "  NPV: $" || MATH_ROUND(value=npvResult precision=2)

IF npvResult > 0 THEN
    SAY "  Decision: Accept project (positive NPV)"
ELSE
    SAY "  Decision: Reject project (negative NPV)"
ENDIF

-- Internal Rate of Return
LET cashFlows = "[-50000, 15000, 18000, 22000, 25000]"
LET irrResult = IRR values=cashFlows guess=0.1

SAY "  IRR: " || MATH_ROUND(value=(irrResult * 100) precision=2) || "%"
```

## Practical Excel Examples

### Sales Performance Analysis
```rexx
-- Quarterly sales analysis
LET q1Sales = 50000
LET q2Sales = 60000
LET q3Sales = 55000
LET q4Sales = 75000

LET salesAverage = AVERAGE q1=q1Sales q2=q2Sales q3=q3Sales q4=q4Sales
LET salesStdev = STDEV q1=q1Sales q2=q2Sales q3=q3Sales q4=q4Sales
LET salesVariance = VAR q1=q1Sales q2=q2Sales q3=q3Sales q4=q4Sales

-- Performance assessment
LET q4Performance = IF condition=(q4Sales > salesAverage) trueValue="Exceeded Average" falseValue="Below Average"
LET consistency = IF condition=(salesStdev < (salesAverage * 0.1)) trueValue="Consistent" falseValue="Variable"

SAY "Sales Analysis Results:"
SAY "  Q1: $" || q1Sales
SAY "  Q2: $" || q2Sales
SAY "  Q3: $" || q3Sales
SAY "  Q4: $" || q4Sales
SAY "  Average: $" || MATH_ROUND(value=salesAverage precision=2)
SAY "  Standard Deviation: $" || MATH_ROUND(value=salesStdev precision=2)
SAY "  Q4 Performance: " || q4Performance
SAY "  Sales Pattern: " || consistency
```

### Product Pricing Strategy
```rexx
-- Dynamic pricing based on market data
LET priceTable = '[["Basic", 99], ["Standard", 199], ["Premium", 399], ["Enterprise", 999]]'
LET customerTier = "Premium"
LET quantity = 150

-- Base price lookup
LET basePrice = VLOOKUP lookupValue=customerTier tableArray=priceTable columnIndex=2

-- Volume discount calculation
LET volumeDiscount = IF condition=(quantity >= 100) trueValue=0.15 falseValue=IF(condition=(quantity >= 50) trueValue=0.10 falseValue=0.05)
LET discountAmount = basePrice * volumeDiscount
LET finalPrice = basePrice - discountAmount

-- Loyalty bonus
LET loyaltyYears = 3
LET loyaltyBonus = IF condition=(loyaltyYears >= 2) trueValue=0.05 falseValue=0
LET finalPriceWithLoyalty = finalPrice * (1 - loyaltyBonus)

SAY "Pricing Analysis:"
SAY "  Customer Tier: " || customerTier
SAY "  Base Price: $" || basePrice
SAY "  Quantity: " || quantity
SAY "  Volume Discount: " || (volumeDiscount * 100) || "%"
SAY "  Price after Volume Discount: $" || MATH_ROUND(value=finalPrice precision=2)
SAY "  Loyalty Bonus: " || (loyaltyBonus * 100) || "%"
SAY "  Final Price: $" || MATH_ROUND(value=finalPriceWithLoyalty precision=2)
SAY "  Total Savings: $" || MATH_ROUND(value=(basePrice - finalPriceWithLoyalty) precision=2)
```

### Employee Performance Dashboard
```rexx
-- Employee performance analysis
LET employeeScores = "[87, 92, 78, 96, 84, 91, 89]"
LET performanceAvg = AVERAGE values=employeeScores
LET performanceMedian = MEDIAN values=employeeScores
LET performanceStdev = STDEV values=employeeScores

-- Performance categories
LET excellentThreshold = 90
LET goodThreshold = 80
LET needsImprovementThreshold = 70

LET excellentCount = 0
LET goodCount = 0
LET needsImprovementCount = 0

-- Count performance levels (simplified - would normally loop through array)
LET scoreArray = JSON_PARSE text=employeeScores
LET scoreCount = ARRAY_LENGTH array=scoreArray

DO i = 0 TO scoreCount - 1
    LET score = ARRAY_GET array=scoreArray index=i
    
    IF score >= excellentThreshold THEN
        LET excellentCount = excellentCount + 1
    ELSE IF score >= goodThreshold THEN
        LET goodCount = goodCount + 1
    ELSE IF score >= needsImprovementThreshold THEN
        LET needsImprovementCount = needsImprovementCount + 1
    ENDIF
END

SAY "Performance Dashboard:"
SAY "  Team Average: " || MATH_ROUND(value=performanceAvg precision=1)
SAY "  Team Median: " || performanceMedian
SAY "  Performance Consistency: " || MATH_ROUND(value=performanceStdev precision=1)
SAY "  Excellent (90+): " || excellentCount || " employees"
SAY "  Good (80-89): " || goodCount || " employees"  
SAY "  Needs Improvement (<80): " || needsImprovementCount || " employees"
```

### Budget Planning and Analysis
```rexx
-- Budget vs Actual analysis
LET budgetRevenue = 500000
LET actualRevenue = 485000
LET budgetExpenses = 350000
LET actualExpenses = 342000

-- Calculate variances
LET revenueVariance = actualRevenue - budgetRevenue
LET expenseVariance = budgetExpenses - actualExpenses  -- Positive is good for expenses
LET revenueVariancePercent = (revenueVariance / budgetRevenue) * 100
LET expenseVariancePercent = (expenseVariance / budgetExpenses) * 100

-- Performance indicators
LET revenueStatus = IF condition=(revenueVariance >= 0) trueValue="Above Budget" falseValue="Below Budget"
LET expenseStatus = IF condition=(expenseVariance >= 0) trueValue="Under Budget" falseValue="Over Budget"

-- Profit analysis
LET budgetProfit = budgetRevenue - budgetExpenses
LET actualProfit = actualRevenue - actualExpenses
LET profitVariance = actualProfit - budgetProfit

SAY "Budget Analysis:"
SAY "  Revenue:"
SAY "    Budget: $" || budgetRevenue
SAY "    Actual: $" || actualRevenue
SAY "    Variance: $" || revenueVariance || " (" || MATH_ROUND(value=revenueVariancePercent precision=1) || "%)"
SAY "    Status: " || revenueStatus
SAY ""
SAY "  Expenses:"
SAY "    Budget: $" || budgetExpenses
SAY "    Actual: $" || actualExpenses
SAY "    Variance: $" || expenseVariance || " (" || MATH_ROUND(value=expenseVariancePercent precision=1) || "%)"
SAY "    Status: " || expenseStatus
SAY ""
SAY "  Profit:"
SAY "    Budget: $" || budgetProfit
SAY "    Actual: $" || actualProfit
SAY "    Variance: $" || profitVariance
```

## Error Handling

Excel functions include comprehensive error handling for invalid inputs, division by zero, and missing parameters. Functions return appropriate defaults or error indicators when issues occur.

## Function Reference

### Logical Functions
- `IF(condition, trueValue, falseValue)` - Conditional logic
- `AND(a, b, c, ...)` - Multiple condition AND
- `OR(a, b, c, ...)` - Multiple condition OR  
- `NOT(value)` - Logical negation

### Statistical Functions
- `AVERAGE(a, b, c, ...)` - Calculate mean
- `MEDIAN(a, b, c, ...)` - Find median value
- `STDEV(a, b, c, ...)` - Standard deviation
- `VAR(a, b, c, ...)` - Variance calculation
- `MODE(a, b, c, ...)` - Most frequent value
- `PERCENTILE(array, k)` - Percentile calculation

### Lookup Functions
- `VLOOKUP(lookupValue, tableArray, columnIndex)` - Vertical lookup
- `HLOOKUP(lookupValue, tableArray, rowIndex)` - Horizontal lookup  
- `INDEX(array, row)` - Get value at index
- `MATCH(lookupValue, lookupArray)` - Find position of value

### Text Functions
- `CONCATENATE(a, separator, b, ...)` - Join strings
- `LEFT(text, numChars)` - Extract left characters
- `RIGHT(text, numChars)` - Extract right characters
- `MID(text, startNum, numChars)` - Extract middle characters
- `LEN(text)` - String length
- `EXCEL_UPPER(text)` - Convert to uppercase
- `EXCEL_LOWER(text)` - Convert to lowercase
- `PROPER(text)` - Title case conversion
- `EXCEL_TRIM(text)` - Remove whitespace
- `SUBSTITUTE(text, oldText, newText)` - Replace text

### Date Functions
- `TODAY()` - Current date
- `EXCEL_NOW()` - Current date and time
- `YEAR(date)` - Extract year
- `MONTH(date)` - Extract month  
- `DAY(date)` - Extract day
- `WEEKDAY(date)` - Get day of week

### Financial Functions
- `PMT(rate, nper, pv)` - Payment calculation
- `FV(rate, nper, pmt)` - Future value
- `PV(rate, nper, pmt, fv?)` - Present value
- `NPV(rate, a, b, c, ...)` - Net present value
- `IRR(values, guess?)` - Internal rate of return

**See also:**
- [Math Functions](05-math-functions.md) for additional calculations
- [Array Functions](06-array-functions.md) for data processing
- [Date/Time Functions](07-datetime-functions.md) for date operations
- [String Functions](04-string-functions.md) for text processing