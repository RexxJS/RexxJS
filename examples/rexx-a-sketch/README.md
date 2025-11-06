# Rexx-A-Sketch

An interactive Etch-A-Sketch application powered by RexxJS, inspired by the classic Toy Story scene where Woody asks Etch to draw.

## Overview

Rexx-A-Sketch demonstrates RexxJS's ability to control web applications through scripting. This example features:

- **Interactive Dials**: Control the drawing cursor with horizontal and vertical dials (just like a real Etch-A-Sketch)
- **Canvas Drawing**: Real-time drawing on an HTML5 canvas
- **Rexx Scripting**: Automated drawing through Rexx scripts sent "over the wire"
- **Toy Story Moment**: Click "Draw Pencil!" to see Etch rapidly draw a hexagonal pencil with tip

## The Toy Story Reference

In Toy Story, Woody says:
> "Hey, Etch. Draw!" *(Etch draws a gun at a rapid pace, and makes a ding)* "Oh! Got me again. Etch, you've been working on that draw. Fastest knobs in the west."

Our version draws a hexagonal pencil instead, demonstrating the same rapid automated drawing capability through Rexx scripts.

## Features

### Drawing Commands

The Etch-A-Sketch responds to the following Rexx commands:

- `MOVE_TO x=<number> y=<number>` - Move to absolute position
- `MOVE_BY dx=<number> dy=<number>` - Move relative to current position
- `CLEAR` - Clear the canvas and reset to center
- `GET_POSITION()` - Get current cursor position
- `PEN_UP` - Lift pen (move without drawing)
- `PEN_DOWN` - Put pen down (resume drawing)

### Example Scripts

#### Draw a Hexagonal Pencil
```rexx
-- Draw a hexagonal pencil with tip
CLEAR
MOVE_TO x=150 y=225

-- Draw hexagon body
MOVE_BY dx=0 dy=-40
MOVE_BY dx=80 dy=0
MOVE_BY dx=40 dy=40
MOVE_BY dx=0 dy=80
MOVE_BY dx=-40 dy=40
MOVE_BY dx=-80 dy=0
MOVE_BY dx=-40 dy=-40
MOVE_BY dx=0 dy=-80
MOVE_BY dx=40 dy=-40

-- Draw pointed tip
MOVE_TO x=150 y=225
MOVE_BY dx=-60 dy=0
MOVE_BY dx=-30 dy=-15
MOVE_BY dx=-30 dy=15
MOVE_BY dx=30 dy=15
MOVE_BY dx=30 dy=-15

SAY "Pencil complete!"
```

#### Draw a Square
```rexx
CLEAR
MOVE_TO x=250 y=175

MOVE_BY dx=100 dy=0
MOVE_BY dx=0 dy=100
MOVE_BY dx=-100 dy=0
MOVE_BY dx=0 dy=-100

SAY "Square complete!"
```

#### Draw a Spiral
```rexx
CLEAR
MOVE_TO x=300 y=225

LET radius = 5
LET angle = 0
LET max_radius = 150

DO WHILE radius < max_radius
    LET x_offset = radius * COS(angle * 0.0174533)
    LET y_offset = radius * SIN(angle * 0.0174533)
    MOVE_TO x=(300 + x_offset) y=(225 + y_offset)

    LET angle = angle + 15
    LET radius = radius + 2
END

SAY "Spiral complete!"
```

## Running the Example

### In Browser

1. Start a local web server from the RexxJS root directory:
   ```bash
   npx http-server -p 8082 -c-1
   ```

2. Open in your browser:
   ```
   http://localhost:8082/examples/rexx-a-sketch/
   ```

3. Try the examples:
   - Click the "Draw Pencil!" button for the Toy Story moment
   - Use the dial controls to draw manually
   - Write custom Rexx scripts in the control panel
   - Click "Execute Script" to run your scripts
   - Click "Shake to Clear" to reset the canvas

## Architecture

### Components

1. **HTML5 Canvas**: Provides the drawing surface
2. **Rexx Interpreter**: Executes Rexx scripts to control the drawing
3. **RPC Client**: Handles communication between Rexx and the canvas
4. **Interactive Controls**: Dials for manual drawing, buttons for automation

### How It Works

1. User writes a Rexx script or clicks "Draw Pencil!"
2. Script is parsed by the RexxJS interpreter
3. Commands are sent via RPC to the canvas controller
4. Canvas controller moves the cursor and draws lines
5. Results are logged to the execution log

## Testing

Run the Playwright tests:

```bash
cd core
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/rexx-a-sketch.spec.js --project=chromium
```

## Technical Details

- **Canvas Size**: 600x450 pixels
- **Drawing Style**: 2px black lines with round caps
- **Starting Position**: Center of canvas (300, 225)
- **Coordinate System**: Standard canvas coordinates (0,0 at top-left)

## Future Enhancements

- Add color selection
- Add line width controls
- Save/load drawings
- More complex pre-programmed drawings
- Touch support for mobile devices
- Keyboard controls for dials

## License

MIT License - see main RexxJS LICENSE file
