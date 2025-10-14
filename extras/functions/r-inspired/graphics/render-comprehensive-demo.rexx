/* Copyright (c) 2025 Paul Hammant Licensed under the MIT License */

/*
 * RENDER Function Comprehensive Demo
 * Shows all the capabilities of the new RENDER() function
 * 
 * Tags: render, comprehensive, demo, graphics, png, histogram, scatter, barplot
 */

SAY "========================================"
SAY "🎨 RENDER() Function Comprehensive Demo"
SAY "========================================"
SAY ""

/* Load the r-graphics library with RENDER function */
SAY "Loading r-graphics functions..."
REQUIRE "./r-graphics-functions.js"
SAY "✅ Library loaded successfully"
SAY ""

/* Demo 1: Basic Histogram with RENDER */
SAY "📊 Demo 1: Basic Histogram Rendering"
SAY "------------------------------------"

LET salesData = JSON_PARSE text="[12.5, 23.1, 28.7, 31.4, 29.8, 35.2, 41.1, 38.9, 42.3, 45.1]"
SAY "Sample sales data: [12.5, 23.1, 28.7, 31.4, 29.8, 35.2, 41.1, 38.9, 42.3, 45.1]"

LET histogram = HIST data=salesData breaks=5 main="Monthly Sales Distribution" xlab="Sales ($1000s)" ylab="Frequency" col="steelblue"
SAY "✅ Histogram created with" LENGTH(histogram.bins) "bins"

/* Test base64 rendering */
LET base64Result = RENDER plot=histogram output="base64" width=800 height=600
SAY "✅ Base64 rendering successful, length:" LENGTH(base64Result) "characters"
SAY ""

/* Demo 2: Bar Plot */
SAY "📊 Demo 2: Bar Plot Rendering"  
SAY "------------------------------"

LET months = JSON_PARSE text='["Jan", "Feb", "Mar", "Apr", "May"]'
LET revenues = JSON_PARSE text="[25.3, 31.2, 28.7, 35.1, 29.8]"
SAY "Monthly revenues: [25.3, 31.2, 28.7, 35.1, 29.8]"

LET barplot = BARPLOT heights=revenues names=months main="Monthly Revenue" xlab="Month" ylab="Revenue ($1000s)" col="orange"
SAY "✅ Barplot created with" LENGTH(barplot.heights) "bars"

LET barBase64 = RENDER plot=barplot output="base64" width=1000 height=600  
SAY "✅ Barplot base64 rendering successful, length:" LENGTH(barBase64) "characters"
SAY ""

/* Demo 3: Scatter Plot */
SAY "📊 Demo 3: Scatter Plot Rendering"
SAY "----------------------------------"

LET xValues = JSON_PARSE text="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
LET yValues = JSON_PARSE text="[2.1, 3.9, 6.2, 7.8, 10.1, 11.9, 14.2, 15.8, 18.1, 20.2]"
SAY "X values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
SAY "Y values: [2.1, 3.9, 6.2, 7.8, 10.1, 11.9, 14.2, 15.8, 18.1, 20.2]"

LET scatter = SCATTER x=xValues y=yValues main="Linear Relationship" xlab="Time (months)" ylab="Growth Rate (%)" col="red"
SAY "✅ Scatter plot created with" LENGTH(scatter.x) "data points"

LET scatterBase64 = RENDER plot=scatter output="base64" width=800 height=600
SAY "✅ Scatter plot base64 rendering successful, length:" LENGTH(scatterBase64) "characters"
SAY ""

/* Demo 4: Box Plot */
SAY "📊 Demo 4: Box Plot Rendering"
SAY "------------------------------"

LET boxData = JSON_PARSE text="[15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 60, 75]"
SAY "Box plot data: [15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 60, 75]"

LET boxplot = BOXPLOT data=boxData main="Sales Distribution Summary" ylab="Sales Amount ($1000s)" col="lightgreen"
SAY "✅ Box plot created for" LENGTH(boxplot.data) "data points"

LET boxBase64 = RENDER plot=boxplot output="base64" width=600 height=800
SAY "✅ Box plot base64 rendering successful, length:" LENGTH(boxBase64) "characters"
SAY ""

/* Demo 5: High-Resolution Rendering */
SAY "📊 Demo 5: High-Resolution & Custom Options"
SAY "--------------------------------------------"

LET customMargins = JSON_PARSE text='{"top": 100, "right": 80, "bottom": 120, "left": 100}'
SAY "Using custom margins: top=100, right=80, bottom=120, left=100"

LET hiresBase64 = RENDER plot=histogram output="base64" width=1600 height=1200 margin=customMargins
SAY "✅ High-resolution rendering (1600x1200) successful, length:" LENGTH(hiresBase64) "characters"
SAY ""

/* Demo 6: Error Handling */
SAY "⚠️  Demo 6: Error Handling"
SAY "--------------------------"

LET error1 = RENDER output="test.png"
SAY "Missing plot parameter error:" error1.error

LET error2 = RENDER plot=histogram
SAY "Missing output parameter error:" error2.error
SAY ""

/* Demo 7: Multiple Charts Demo */
SAY "📊 Demo 7: Multiple Chart Types Summary"
SAY "---------------------------------------"

SAY "Successfully demonstrated RENDER() function with:"
SAY "  ✅ Histogram - distribution analysis"
SAY "  ✅ Bar Plot - categorical data comparison"  
SAY "  ✅ Scatter Plot - correlation analysis"
SAY "  ✅ Box Plot - statistical summary"
SAY "  ✅ High-resolution output (1600x1200)"
SAY "  ✅ Custom margins and styling"
SAY "  ✅ Base64 encoding for web integration"
SAY "  ✅ Error handling and validation"
SAY ""

/* Web Environment Usage Examples */
SAY "🌐 Web Environment Usage Examples"
SAY "----------------------------------" 
SAY ""
SAY "In a web browser, the same RexxJS code would work:"
SAY ""
SAY '1. Render to DOM element:'
SAY '   LET result = RENDER plot=histogram output="#chart-div" width=800 height=600'
SAY ""
SAY '2. Auto-generate container:'  
SAY '   LET result = RENDER plot=barplot output="auto" width=600 height=400'
SAY ""
SAY '3. Responsive design:'
SAY '   LET options = JSON_PARSE text=\'{"responsive": true}\''
SAY '   LET result = RENDER plot=scatter output="#main-chart" width="100%" options=options'
SAY ""

/* Summary */
SAY "🎉 RENDER() Function Features Summary"
SAY "====================================="
SAY ""
SAY "✨ Universal Rendering:"
SAY "   • NodeJS: Creates PNG files on filesystem"
SAY "   • Web: Renders to DOM elements (Canvas/SVG)"
SAY "   • Cross-platform: Same code works everywhere"
SAY ""
SAY "📊 Supported Plot Types:"
SAY "   • Histograms (HIST)"
SAY "   • Bar plots (BARPLOT)"  
SAY "   • Scatter plots (SCATTER)"
SAY "   • Box plots (BOXPLOT)"
SAY "   • Pie charts (PIE)"
SAY "   • Density plots (DENSITY_PLOT)"
SAY "   • Q-Q plots (QQPLOT)"
SAY "   • Heatmaps (HEATMAP)"
SAY "   • And more..."
SAY ""
SAY "🎛️  Output Options:"
SAY "   • PNG files (NodeJS)"
SAY "   • Base64 data URIs (both)"
SAY "   • DOM elements (Web)"
SAY "   • Custom dimensions and styling"
SAY ""
SAY "🔧 Advanced Features:"
SAY "   • Custom margins and spacing"
SAY "   • High-resolution output"
SAY "   • Responsive design (Web)"
SAY "   • Interactive features (Web)"
SAY "   • Error handling and validation"
SAY ""
SAY "Demo complete! 🚀"
SAY ""
SAY "The RENDER() function makes RexxJS a powerful platform for data visualization,"
SAY "bridging the gap between server-side analysis and web-based presentation!"