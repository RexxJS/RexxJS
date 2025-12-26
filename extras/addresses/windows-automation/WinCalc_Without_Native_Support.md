# Windows Calculator Automation Without Native Support

This document explores realistic automation approaches for Windows Calculator when there is **no native Rexx ADDRESS handler** - simulating the common scenario where developers must work with an application's UI automation APIs rather than semantic handlers.

## The Reality Problem

Without `ADDRESS WINCALC`, we must resort to:
1. **Image Recognition** (Sikuli-X style) - Screenshot matching, fragile, slow
2. **UI Automation Framework** (UIA/MSAA) - Object properties, more robust, complex
3. **Legacy QTP/UFT approach** - Spy tools, object repositories, descriptive programming
4. **Hybrid techniques** - Combining multiple approaches

## Approach 1: Sikuli-X Style (Image-Based Automation)

### How Sikuli-X Works
Sikuli automates based on **visual recognition** - it takes screenshots of UI elements and matches them when interacting.

### Variant A: Pre-stored Image Files (Basic)

```rexx
ADDRESS WINDOWS

-- Load Sikuli-style image automation
REQUIRE "sikuli-address"

-- Find calculator on screen and launch
LAUNCH "calc.exe"
WAIT 2000  -- Wait for window to appear

-- Click on button "7" using image
LET button_7 = FIND_IMAGE("buttons/7.png")
CLICK button_7

-- Click multiply button
LET button_multiply = FIND_IMAGE("buttons/multiply.png")
CLICK button_multiply

-- Click button "6"
LET button_6 = FIND_IMAGE("buttons/6.png")
CLICK button_6

-- Click equals
LET button_equals = FIND_IMAGE("buttons/equals.png")
CLICK button_equals

-- Capture display and verify using OCR
LET display_region = FIND_IMAGE("calc_display.png")
LET result_text = OCR_TEXT(display_region)
SAY "Result: " || result_text

IF result_text = "42" THEN
  SAY "SUCCESS"
ELSE
  SAY "FAILED"
ENDIF
```

### Variant B: Character/Visual Pattern Recognition (Advanced)

This approach uses **character recognition** rather than pre-stored images - Sikuli recognizes the visual pattern of the character itself:

```rexx
ADDRESS WINDOWS
REQUIRE "sikuli-address"

LAUNCH "calc.exe"
WAIT 2000

-- Click on button "7" by recognizing the character appearance
-- Search for white text "7" on dark blue background
LET button_7 = CLICK FIND_CHARACTER("7", color="white", bg_color="dark-blue", confidence=0.85)
WAIT 300

-- Click multiply by recognizing the × character
CLICK FIND_CHARACTER("*", color="white", bg_color="dark-blue", confidence=0.85)
WAIT 300

-- Click button "6"
CLICK FIND_CHARACTER("6", color="white", bg_color="dark-blue", confidence=0.85)
WAIT 300

-- Click equals (recognizing = symbol)
CLICK FIND_CHARACTER("=", color="white", bg_color="dark-blue", confidence=0.85)
WAIT 1000

-- Verify result
LET display = FIND_REGION("calc_display.png")
LET result = OCR_TEXT(display)
SAY "Result: " || result
```

### Even More Sophisticated: Visual Property Matching

Using Sikuli's image matching with visual properties:

```rexx
ADDRESS WINDOWS
REQUIRE "sikuli-address"

LAUNCH "calc.exe"
WAIT 2000

-- Define button appearance pattern using character picture
-- charpic(char, text_color, bg_color) creates a visual pattern matcher
LET pattern_7 = CHARPIC("7", "white", "dark-blue")
LET pattern_mult = CHARPIC("*", "white", "dark-blue")
LET pattern_6 = CHARPIC("6", "white", "dark-blue")
LET pattern_eq = CHARPIC("=", "white", "dark-blue")

-- Click using the pattern (with confidence threshold)
CLICK FIND_IMAGE(pattern_7, confidence=0.80)
WAIT 300
CLICK FIND_IMAGE(pattern_mult, confidence=0.80)
WAIT 300
CLICK FIND_IMAGE(pattern_6, confidence=0.80)
WAIT 300
CLICK FIND_IMAGE(pattern_eq, confidence=0.80)
WAIT 1000

-- Verify
LET display = FIND_REGION("display_box.png")
LET result = OCR_TEXT(display)
ASSERT result = "42"
```

### Comparison of Sikuli Variants

| Variant | Flexibility | Maintenance | Speed | Robustness |
|---------|------------|-------------|-------|-----------|
| Pre-stored Images | Low | High | Slow | Low (DPI sensitive) |
| Character Recognition | Medium | Low | Slow | Medium (fonts matter) |
| Visual Properties | High | Low | Slow | Medium-High |

**Pre-stored images:** Requires screenshot library, breaks with DPI/theme changes
**Character recognition:** Dynamically finds characters on screen, survives theme changes, still font-dependent
**Visual properties:** Explicit color/appearance matching, most adaptable but requires Sikuli's pattern matching API

### Challenges with Sikuli-X Approach

**Pros:**
- Works with any application (no need for native support)
- Requires no knowledge of internal application structure
- Visual = what you see is what you automate

**Cons:**
- **Fragile to UI changes** - Different Windows 10/11/Server versions have different button layouts
- **Slow** - Image matching takes time
- **Resolution dependent** - 1920x1080 vs 4K screens break coordinates
- **Language/locale dependent** - Different language Windows has different labels
- **DPI scaling issues** - Button sizes change at different DPI settings
- **OCR unreliable** - Especially with fonts, small text, styled text
- **Difficult to maintain** - Screenshot libraries become stale
- **Non-deterministic** - Image matching quality varies

### Real-World Sikuli Example

```rexx
-- More realistic Sikuli approach with error handling
ADDRESS WINDOWS
REQUIRE "sikuli-address"

LET max_retries = 5
LET retry_count = 0

DO WHILE retry_count < max_retries
  TRY
    LAUNCH "calc.exe"
    WAIT_UNTIL_VISIBLE("calc_window.png", timeout=10000)

    CLICK FIND_IMAGE("buttons/7.png", confidence=0.8)
    WAIT 500

    CLICK FIND_IMAGE("buttons/multiply.png", confidence=0.8)
    WAIT 500

    CLICK FIND_IMAGE("buttons/6.png", confidence=0.8)
    WAIT 500

    CLICK FIND_IMAGE("buttons/equals.png", confidence=0.8)
    WAIT 1000

    LET display = OCR_TEXT(FIND_IMAGE("display_area.png"))

    IF NUMERIC(display) THEN
      SAY "Result: " || display
      EXIT DO
    ELSE
      retry_count = retry_count + 1
    ENDIF

  CATCH error
    SAY "Error: " || error
    retry_count = retry_count + 1
  END
END
```

## Approach 2: UI Automation Framework (UIA/MSAA)

### Windows UI Automation Concept

Windows provides **UI Automation** APIs (IAccessible/UIA) that expose application structure through an object model. Modern apps implement this; it's more reliable than images but requires understanding application hierarchy.

### REXX Implementation

```rexx
ADDRESS WINDOWS
REQUIRE "uia-automation"

-- Get calculator window by name
LET calc_window = FIND_WINDOW("Calculator")
IF calc_window = EMPTY THEN DO
  LAUNCH "calc.exe"
  LET calc_window = FIND_WINDOW("Calculator", timeout=5000)
END

-- Get button element by automation ID or name
LET button_7 = GET_CHILD_ELEMENT(calc_window, type="Button", name="Seven")
IF button_7 != EMPTY THEN
  CLICK button_7
ELSE
  SAY "ERROR: Could not find button 7"
END

-- Click multiply
LET button_mult = GET_CHILD_ELEMENT(calc_window, type="Button", name="Multiply")
CLICK button_mult

-- Click 6
LET button_6 = GET_CHILD_ELEMENT(calc_window, type="Button", name="Six")
CLICK button_6

-- Click equals
LET button_eq = GET_CHILD_ELEMENT(calc_window, type="Button", name="Equals")
CLICK button_eq

-- Get display value via automation
LET display_element = GET_CHILD_ELEMENT(calc_window, type="Text", automation_id="CalculatorResults")
LET display_value = GET_ELEMENT_VALUE(display_element)

SAY "Display shows: " || display_value
IF display_value = "42" THEN
  SAY "SUCCESS"
ELSE
  SAY "FAILED: Expected 42, got " || display_value
ENDIF
```

### UIA Inspection

```rexx
-- Inspect element hierarchy (debugging tool)
ADDRESS WINDOWS
REQUIRE "uia-automation"

LAUNCH "calc.exe"
LET calc_window = FIND_WINDOW("Calculator")

-- Dump entire element tree
INSPECT_ELEMENT_TREE(calc_window, output_file="calculator_hierarchy.txt")

-- Find elements matching patterns
LET all_buttons = FIND_ELEMENTS(calc_window, type="Button")
DO i = 1 TO ARRAY_LENGTH(all_buttons)
  SAY all_buttons.i.name || " (ID: " || all_buttons.i.automation_id || ")"
END
```

### UIA Advantages and Limitations

**Pros:**
- More reliable than image matching
- Works across different themes/DPI
- Access to actual property values (not estimated)
- Language/locale independent (uses IDs, not text)
- Consistent across Windows versions

**Cons:**
- Requires application to implement UI Automation (older apps don't)
- Learning curve for element hierarchy
- Automation IDs can change between versions
- Still slower than native API
- Requires debugging tools to inspect elements

## Approach 3: QTP/UFT Style (Descriptive Programming)

### QTP Concept

QuickTest Professional (now Micro Focus UFT) uses **object repositories** and **descriptive programming** - defining application objects by their properties rather than recording clicks.

### REXX Implementation (QTP-like)

```rexx
ADDRESS WINDOWS
REQUIRE "qtp-style-automation"

-- Define objects using descriptive properties
LET calculator = DEFINE_WINDOW(
  class="ApplicationFrameWindow",
  title="Calculator",
  process="ApplicationFrameHost"
)

LET button_7 = DEFINE_BUTTON(
  parent=calculator,
  automation_id="num7Button",
  type="Button"
)

LET button_multiply = DEFINE_BUTTON(
  parent=calculator,
  automation_id="multiplyButton"
)

LET button_6 = DEFINE_BUTTON(
  parent=calculator,
  automation_id="num6Button"
)

LET button_equals = DEFINE_BUTTON(
  parent=calculator,
  automation_id="equalButton"
)

LET display = DEFINE_TEXT_BOX(
  parent=calculator,
  automation_id="CalculatorResults",
  class="TextBlock"
)

-- Object repository (XML-like definition)
LET object_repo = <<OBJECTS
<ObjectRepository>
  <Window>
    <Name>Calculator</Name>
    <Property name="title" value="Calculator"/>
    <Property name="process" value="ApplicationFrameHost.exe"/>

    <Button>
      <Name>Button_7</Name>
      <Property name="automationId" value="num7Button"/>
      <Property name="controlType" value="Button"/>
    </Button>

    <Button>
      <Name>Button_Multiply</Name>
      <Property name="automationId" value="multiplyButton"/>
    </Button>

    <TextBox>
      <Name>Display</Name>
      <Property name="automationId" value="CalculatorResults"/>
      <Property name="controlType" value="Text"/>
    </TextBox>
  </Window>
</ObjectRepository>
OBJECTS

-- Use objects from repository
LET calc = FIND_OBJECT(object_repo, "Calculator")
IF NOT EXIST(calc) THEN
  LAUNCH "calc.exe"
  LET calc = FIND_OBJECT(object_repo, "Calculator")
END

CLICK FIND_OBJECT(object_repo, "Button_7")
WAIT 300
CLICK FIND_OBJECT(object_repo, "Button_Multiply")
WAIT 300
CLICK FIND_OBJECT(object_repo, "Button_6")
WAIT 300
CLICK FIND_OBJECT(object_repo, "Button_Equals")
WAIT 1000

LET display_value = GET_VALUE(FIND_OBJECT(object_repo, "Display"))
SAY "Result: " || display_value

IF display_value = "42" THEN
  SAY "PASS"
ELSE
  SAY "FAIL"
ENDIF
```

### QTP Advantages

**Pros:**
- Centralized object definitions (reuse across tests)
- Maintainable - change object properties once, affects all tests
- Type checking possible
- Good for regression testing suites
- Works well with version control (XML repositories)

**Cons:**
- Requires maintaining object repositories
- High initial investment in object modeling
- Complex for one-off scripts
- Can become bloated with edge cases
- Still fragile to major UI redesigns

## Approach 4: Hybrid Approach (Practical Reality)

Most real-world test automation combines techniques:

```rexx
ADDRESS WINDOWS
REQUIRE "hybrid-automation"

-- Start with UIA for robustness
LET try_uia = 1

TRY
  LET calc_window = FIND_WINDOW("Calculator")
  LET button_7 = GET_CHILD_ELEMENT(calc_window, automation_id="num7Button")

  IF button_7 != EMPTY THEN
    CLICK button_7
  ELSE
    LET try_uia = 0
  END

CATCH error
  -- UIA failed, fall back to image recognition
  LET try_uia = 0
END

IF try_uia = 0 THEN DO
  -- Fallback to Sikuli image recognition
  SAY "UIA failed, falling back to image recognition"

  CLICK FIND_IMAGE("buttons/7.png", confidence=0.85)
  WAIT 200
  CLICK FIND_IMAGE("buttons/multiply.png", confidence=0.85)
END

-- Continue with more reliable operations
CLICK FIND_IMAGE("buttons/6.png")
CLICK FIND_IMAGE("buttons/equals.png")

-- Verify result with multiple methods
LET result_via_uia = ""
LET result_via_ocr = ""

TRY
  LET display_element = GET_CHILD_ELEMENT(calc_window, automation_id="CalculatorResults")
  LET result_via_uia = GET_ELEMENT_VALUE(display_element)
END

TRY
  LET display_region = FIND_IMAGE("calc_display.png")
  LET result_via_ocr = OCR_TEXT(display_region)
END

-- Use whichever worked
IF result_via_uia != EMPTY THEN
  LET result = result_via_uia
ELSE IF result_via_ocr != EMPTY THEN
  LET result = result_via_ocr
ELSE
  SAY "ERROR: Could not get result"
END

SAY "Final result: " || result
```

## Comparison Matrix

| Approach | Speed | Reliability | Maintainability | Learning Curve | Cross-Version | Language Support |
|----------|-------|-------------|-----------------|----------------|---------------|-----------------|
| **Sikuli-X (Image)** | Slow | Low | Poor | Easy | Bad | Good |
| **UIA Framework** | Medium | Medium-High | Good | Medium | Medium | Good |
| **QTP/UFT Style** | Medium | High | Excellent | Hard | Medium | Good |
| **Hybrid** | Medium | High | Good | Hard | Good | Good |
| **Native Handler** | Fast | Very High | Excellent | Easy | Excellent | Perfect |

## Real-World Challenges Not in Ideal Examples

### 1. Timing and Synchronization
```rexx
-- Problem: Button click might not register immediately
CLICK button_7
-- Button might still be processing...

-- Solution: Wait for element state
WAIT_FOR_ELEMENT_STATE(button_7, "ready", timeout=5000)

-- Or use intelligent waits
WAIT_UNTIL(
  condition="DISPLAY_VALUE() = '7'",
  timeout=5000,
  check_interval=100
)
```

### 2. DPI and Resolution Scaling
```rexx
-- Image coordinates must be scaled
LET dpi = GET_DPI()
LET scaled_x = (button_x * dpi) / 96  -- 96 is standard DPI
LET scaled_y = (button_y * dpi) / 96

CLICK AT scaled_x, scaled_y
```

### 3. Multi-Window Handling
```rexx
-- Different Windows versions open calc differently
-- Windows 10: UWP app (ApplicationFrameHost)
-- Windows 7: Classic Win32 app (calc.exe)

IF WINDOWS_VERSION() = "10" OR "11" THEN
  LET calc_class = "ApplicationFrameWindow"
ELSE
  LET calc_class = "CalcFrame"
END

LET calc = FIND_WINDOW(class=calc_class)
```

### 4. Accessibility Issues
```rexx
-- Some elements not accessible via UIA
-- Must fall back to direct WinAPI calls
REQUIRE "winapi-direct"

-- Direct SendMessage to window
SEND_MESSAGE(
  hwnd=calc_window,
  message=WM_KEYDOWN,
  wparam=VK_7,
  lparam=0
)

SEND_MESSAGE(calc_window, WM_KEYUP, VK_7, 0)
```

## Why This is Bad (Why You Want Native Support)

Imagine maintaining this vs. native handler:

```rexx
-- WITHOUT native support (fragile, brittle, slow):
ADDRESS WINDOWS
LAUNCH "calc.exe"
WAIT 2000
CLICK FIND_IMAGE("buttons/7.png", confidence=0.8)
WAIT 300
CLICK FIND_IMAGE("buttons/multiply.png", confidence=0.8)
... 20 more lines of fragility ...

-- WITH native support (clean, fast, maintainable):
ADDRESS WINCALC
LAUNCH
WITH calculator
  PRESS 7
  PRESS "*"
  PRESS 6
  PRESS "="
  ASSERT display = "42"
END
```

## Conclusion

Without native support, you're forced into:
1. **Image matching** - Visual but fragile
2. **UI Automation** - More robust but complex
3. **Object repositories** - Professional but heavyweight
4. **Hybrid approaches** - Practical but complicated

This is why having a **native ADDRESS handler** (like `ADDRESS WINCALC` would be) is so valuable:
- **Semantic** - Code expresses intent, not implementation
- **Reliable** - No OCR failures, DPI issues, or timing problems
- **Fast** - Direct API calls, no image processing
- **Maintainable** - One handler update fixes all tests
- **Elegant** - REXX code reads like natural language

The trade-off is that the application developers must build that handler. Since most won't, test automation without native support remains a pain point in QA engineering.
