/* Copyright (c) 2025 Paul Hammant Licensed under the MIT License */

/*
 * RENDER Function Comprehensive Test
 * Tests the universal RENDER() function for creating PNG files from plot objects
 * 
 * Tags: render, graphics, png, histogram, barplot, scatter, comprehensive
 */

SAY "=== RENDER Function Test Suite ==="
SAY ""

/* Test 1: Basic histogram rendering */
SAY "Test 1: Basic histogram rendering"
REQUIRE "./r-graphics-functions.js"

/* Create test data */
LET dataJson = "[1.2, 2.3, 2.1, 3.4, 3.8, 3.2, 4.1, 4.5, 5.0, 6.2, 2.8, 3.1, 4.3, 3.9, 2.7]"
LET data = JSON_PARSE text=dataJson

/* Create histogram */
LET histogram = HIST data=data breaks=5 main="Sales Data Distribution" xlab="Sales ($1000s)" ylab="Frequency" col="steelblue"

EXPECTATION histogram.type = "hist"
EXPECTATION LENGTH(histogram.bins) > 0
EXPECTATION histogram.options.main = "Sales Data Distribution"

/* Test rendering to PNG file */
LET tempDir = "/tmp"
LET pngFile = tempDir "/" "test-histogram.png" 
LET renderResult = RENDER plot=histogram output=pngFile width=800 height=600

EXPECTATION renderResult = pngFile
SAY "✓ Histogram rendered to:" renderResult

/* Test 2: Bar plot rendering with custom options */
SAY ""
SAY "Test 2: Bar plot rendering"

LET heightsJson = "[23.5, 31.2, 28.7, 35.1, 29.8]"
LET heights = JSON_PARSE text=heightsJson
LET namesJson = '["Q1", "Q2", "Q3", "Q4", "Q5"]'
LET names = JSON_PARSE text=namesJson

LET barplot = BARPLOT heights=heights names=names main="Quarterly Sales" xlab="Quarter" ylab="Revenue ($M)" col="orange"

EXPECTATION barplot.type = "barplot"
EXPECTATION LENGTH(barplot.heights) = 5

LET barFile = tempDir "/" "test-barplot.png"
LET barRenderResult = RENDER plot=barplot output=barFile width=1000 height=600

EXPECTATION barRenderResult = barFile
SAY "✓ Barplot rendered to:" barRenderResult

/* Test 3: Scatter plot rendering */
SAY ""
SAY "Test 3: Scatter plot rendering"

LET xJson = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET yJson = "[2.1, 3.9, 6.2, 7.8, 10.1, 11.9, 14.2, 15.8, 18.1, 20.2]"
LET xData = JSON_PARSE text=xJson
LET yData = JSON_PARSE text=yJson

LET scatter = SCATTER x=xData y=yData main="Linear Relationship" xlab="X Values" ylab="Y Values" col="red"

EXPECTATION scatter.type = "scatter"
EXPECTATION LENGTH(scatter.x) = 10
EXPECTATION LENGTH(scatter.y) = 10

LET scatterFile = tempDir "/" "test-scatter.png"
LET scatterResult = RENDER plot=scatter output=scatterFile width=800 height=600

EXPECTATION scatterResult = scatterFile
SAY "✓ Scatter plot rendered to:" scatterResult

/* Test 4: High-resolution rendering with custom margins */
SAY ""
SAY "Test 4: High-resolution rendering with custom margins"

LET marginJson = '{"top": 100, "right": 80, "bottom": 120, "left": 100}'
LET customMargin = JSON_PARSE text=marginJson

LET hiresFile = tempDir "/" "test-highres.png"
LET hiresResult = RENDER plot=histogram output=hiresFile width=1600 height=1200 margin=customMargin

EXPECTATION hiresResult = hiresFile
SAY "✓ High-resolution histogram rendered to:" hiresResult

/* Test 5: Base64 output (if supported) */
SAY ""
SAY "Test 5: Base64 output"

LET base64Result = RENDER plot=scatter output="base64" width=400 height=300

/* Base64 data URI should start with data:image/png;base64, */
LET base64Start = SUBSTR base64Result 1 22
EXPECTATION base64Start = "data:image/png;base64,"
SAY "✓ Base64 rendering successful, length:" LENGTH(base64Result)

/* Test 6: Error handling - missing plot parameter */
SAY ""
SAY "Test 6: Error handling - missing plot"

LET errorResult = RENDER output=tempDir "/" "error.png"
/* Should return error object */
EXPECTATION errorResult.type = "render"
EXPECTATION DATATYPE(errorResult.error) = "CHAR"
SAY "✓ Error handling working:" errorResult.error

/* Test 7: Error handling - missing output parameter */
SAY ""
SAY "Test 7: Error handling - missing output"

LET errorResult2 = RENDER plot=histogram
EXPECTATION errorResult2.type = "render"  
EXPECTATION DATATYPE(errorResult2.error) = "CHAR"
SAY "✓ Error handling working:" errorResult2.error

/* Test 8: Multiple plots in sequence */
SAY ""
SAY "Test 8: Multiple plots in sequence"

LET densityData = JSON_PARSE text="[1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 5, 6]"
LET density = DENSITY data=densityData main="Data Density" col="purple"

EXPECTATION density.type = "density"

LET densityFile = tempDir "/" "test-density.png"
LET densityResult = RENDER plot=density output=densityFile width=800 height=600

EXPECTATION densityResult = densityFile
SAY "✓ Density plot rendered to:" densityResult

/* Test 9: Box plot rendering */
SAY ""
SAY "Test 9: Box plot rendering"

LET boxData = JSON_PARSE text="[1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 15, 20]"
LET boxplot = BOXPLOT data=boxData main="Data Distribution" ylab="Values" col="lightgreen"

EXPECTATION boxplot.type = "boxplot"
EXPECTATION DATATYPE(boxplot.stats) = "STEM"

LET boxFile = tempDir "/" "test-boxplot.png"
LET boxResult = RENDER plot=boxplot output=boxFile width=600 height=800

EXPECTATION boxResult = boxFile
SAY "✓ Box plot rendered to:" boxResult

SAY ""
SAY "=== RENDER Function Tests Complete ==="
SAY "All tests passed successfully!"