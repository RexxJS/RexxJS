/* Copyright (c) 2025 Paul Hammant Licensed under the MIT License */

/*
 * RENDER Function Web Environment Demo
 * Demonstrates how RENDER() would work in a web browser
 * This is a demo script showing the intended usage patterns
 * 
 * Tags: render, web, dom, demo, browser
 */

SAY "=== RENDER Function Web Environment Demo ==="
SAY ""
SAY "This demo shows how RENDER() would be used in a web browser."
SAY "The actual DOM manipulation requires a browser environment."
SAY ""

/* Load graphics functions */
REQUIRE "./r-graphics-functions.js"

/* Create sample data */
LET salesData = JSON_PARSE text="[12.5, 23.1, 28.7, 31.4, 29.8, 35.2, 41.1]"
LET months = JSON_PARSE text='["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]'

SAY "Sample data prepared:"
SAY "Sales:" JSON_STRINGIFY(value=salesData)
SAY "Months:" JSON_STRINGIFY(value=months)
SAY ""

/* Create different types of plots */
LET histogram = HIST data=salesData main="Monthly Sales Distribution" xlab="Sales ($1000s)" ylab="Frequency" col="steelblue"
LET barplot = BARPLOT heights=salesData names=months main="Sales by Month" xlab="Month" ylab="Sales ($1000s)" col="orange"
LET boxplot = BOXPLOT data=salesData main="Sales Summary Statistics" ylab="Sales ($1000s)" col="lightgreen"

SAY "Created plot objects:"
SAY "✓ Histogram with" LENGTH(histogram.bins) "bins"
SAY "✓ Barplot with" LENGTH(barplot.heights) "bars" 
SAY "✓ Boxplot with stats for" LENGTH(boxplot.data) "data points"
SAY ""

/* In a web browser, these would render to DOM elements */
SAY "=== Web Browser Usage Examples ==="
SAY ""
SAY "1. Render to specific DOM element:"
SAY '   LET result1 = RENDER plot=histogram output="#sales-chart" width=800 height=400'
SAY "   → Would create histogram in <div id='sales-chart'>"
SAY ""

SAY "2. Render to CSS selector:"
SAY '   LET result2 = RENDER plot=barplot output=".dashboard-chart[data-type='monthly']" width=600 height=400'
SAY "   → Would target elements with class 'dashboard-chart' and data-type='monthly'"
SAY ""

SAY "3. Auto-generate container:"
SAY '   LET result3 = RENDER plot=boxplot output="auto" width=500 height=600'
SAY "   → Would create new container with auto-generated ID like 'rexx-chart-1'"
SAY ""

SAY "4. Responsive design:"
SAY '   LET options = JSON_PARSE text=\'{"responsive": true, "className": "chart-responsive"}\''
SAY '   LET result4 = RENDER plot=histogram output="#main-chart" width="100%" height="300px" options=options'
SAY "   → Would create responsive chart with CSS integration"
SAY ""

SAY "5. Interactive features:"
SAY '   LET interactive = JSON_PARSE text=\'{"onclick": "handleChartClick", "hover": true}\''
SAY '   LET result5 = RENDER plot=barplot output="#interactive-chart" options=interactive'
SAY "   → Would add click handlers and hover effects"
SAY ""

/* These examples show NodeJS functionality that actually works */
SAY "=== NodeJS Environment (Actually Working) ==="
SAY ""

/* Base64 rendering example */
SAY "Generating base64 image data..."
LET base64Result = RENDER plot=histogram output="base64" width=400 height=300

IF DATATYPE(base64Result) = "CHAR" THEN DO
    IF LENGTH(base64Result) > 100 THEN DO
        SAY "✓ Base64 generation successful!"
        SAY "  Data URI length:" LENGTH(base64Result) "characters"
        SAY "  Preview:" SUBSTR(base64Result, 1, 50) "..."
    END
    ELSE DO
        SAY "✗ Base64 generation failed:" base64Result
    END
END

SAY ""
SAY "=== Environment Detection Demo ==="
SAY ""

/* Show how the function detects environment */
SAY "The RENDER() function automatically detects the environment:"
SAY "• NodeJS: Creates PNG files on filesystem"
SAY "• Web Browser: Renders to DOM elements using Canvas/SVG"
SAY "• Hybrid: Can export to clipboard, base64, etc."
SAY ""

/* Error handling examples */
SAY "=== Error Handling Examples ==="
SAY ""

LET errorResult1 = RENDER output="/tmp/test.png"
IF DATATYPE(errorResult1) = "STEM" THEN DO
    SAY "✓ Missing plot error:" errorResult1.error
END

LET errorResult2 = RENDER plot=histogram  
IF DATATYPE(errorResult2) = "STEM" THEN DO
    SAY "✓ Missing output error:" errorResult2.error
END

SAY ""
SAY "=== Summary ==="
SAY ""
SAY "The RENDER() function provides a universal interface for:"
SAY "• File output (PNG, SVG, PDF) in NodeJS"
SAY "• DOM rendering (Canvas, SVG) in browsers"  
SAY "• Base64 export for embedding"
SAY "• Responsive and interactive charts"
SAY "• Cross-platform compatibility"
SAY ""
SAY "Same RexxJS code works everywhere!"
SAY ""
SAY "Demo complete."