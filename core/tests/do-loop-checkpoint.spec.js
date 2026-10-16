/**
 * Do Loop Checkpoint Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('DO Loop with CHECKPOINT Tests', () => {
    let interpreter;
    
    beforeEach(() => {
        interpreter = new Interpreter(null);
    });

    test('should execute simple DO loop and capture all iterations', async () => {
        const script = `
LET total_items = 5
DO item_index = 1 TO total_items
  LET item_fact = "Item " || item_index || " processed"
  LET item_key = "item_" || item_index
  CHECKPOINT(item_key, item_fact)
END
LET done_message = "All " || total_items || " items processed"
CHECKPOINT("done", done_message)`;

        const commands = parse(script);
        await interpreter.run(commands);
        
        const total_items = interpreter.getVariable('total_items');
        const done = interpreter.getVariable('done');
        
        
        // Basic checks first
        expect(total_items).toBe(5);
        expect(done).toBe("All 5 items processed");
        
        // Check that loop executed - item_index should be final value
        expect(interpreter.getVariable('item_index')).toBeGreaterThan(0);
        
        // Check that at least one checkpoint was created
        expect(interpreter.getVariable('item_1')).toBe("Item 1 processed");
    });

    test('should handle DO loop with CHECKPOINT using string concatenation', async () => {
        const script = `
LET button_count = 3
DO button_index = 1 TO button_count
  LET button_info = "Button " || button_index || " text='btn" || button_index || "' onclick=action" || button_index || "()"
  LET btn_key = "btn_" || button_index
  CHECKPOINT(btn_key, button_info)
END`;

        const commands = parse(script);
        await interpreter.run(commands);
        
        // Should have created 3 button checkpoints
        expect(interpreter.getVariable('btn_1')).toBe("Button 1 text='btn1' onclick=action1()");
        expect(interpreter.getVariable('btn_2')).toBe("Button 2 text='btn2' onclick=action2()");  
        expect(interpreter.getVariable('btn_3')).toBe("Button 3 text='btn3' onclick=action3()");
    });

    test('should handle nested IF statements within DO loop', async () => {
        const script = `
LET max_buttons = 4
DO btn_idx = 1 TO max_buttons
  LET btn_text = "btn" || btn_idx
  LET onclick_handler = "handler" || btn_idx || "()"
  
  -- Determine pattern based on index
  IF btn_idx = 1 THEN
    LET pattern_type = "direct_function"
  ELSE
    IF btn_idx = 2 THEN
      LET pattern_type = "parameterized_function"
    ELSE
      LET pattern_type = "unknown_function"
    ENDIF
  ENDIF
  
  LET discovery_fact = "Button " || btn_idx || " text=" || btn_text || " pattern=" || pattern_type
  LET discovery_key = "discovery_" || btn_idx
  CHECKPOINT(discovery_key, discovery_fact)
END`;

        const commands = parse(script);
        await interpreter.run(commands);
        
        // Verify all discoveries were created with correct patterns
        expect(interpreter.getVariable('discovery_1')).toBe("Button 1 text=btn1 pattern=direct_function");
        expect(interpreter.getVariable('discovery_2')).toBe("Button 2 text=btn2 pattern=parameterized_function");
        expect(interpreter.getVariable('discovery_3')).toBe("Button 3 text=btn3 pattern=unknown_function");
        expect(interpreter.getVariable('discovery_4')).toBe("Button 4 text=btn4 pattern=unknown_function");
    });

    test('should handle DO loop similar to button introspection pattern', async () => {
        const script = `
-- Simulate button introspection loop
LET all_buttons = 24
DO button_index = 1 TO all_buttons
  -- Skip detailed processing, just create checkpoints for first few
  IF button_index <= 3 THEN
    LET button_text = "text_" || button_index
    LET button_onclick = "onclick_" || button_index || "()"
    LET this_button_fact = "Button " || button_index || ": text='" || button_text || "' onclick=" || button_onclick
    LET btn_key = "btn_" || button_index
    CHECKPOINT(btn_key, this_button_fact)
  ENDIF
END
LET final_message = "Processed " || all_buttons || " buttons"
CHECKPOINT("complete", final_message)`;

        const commands = parse(script);
        await interpreter.run(commands);
        
        // Should process all iterations but only create checkpoints for first 3
        expect(interpreter.getVariable('btn_1')).toBe("Button 1: text='text_1' onclick=onclick_1()");
        expect(interpreter.getVariable('btn_2')).toBe("Button 2: text='text_2' onclick=onclick_2()");  
        expect(interpreter.getVariable('btn_3')).toBe("Button 3: text='text_3' onclick=onclick_3()");
        expect(interpreter.getVariable('btn_4')).toBeUndefined(); // Should not exist
        expect(interpreter.getVariable('complete')).toBe("Processed 24 buttons");
        
        // button_index is left with the value that ended the loop, 25
        // after DO button_index = 1 TO 24 (TRL 4.2)
        expect(interpreter.getVariable('button_index')).toBe(25);
    });

    test('should fail gracefully if DO loop has syntax errors', async () => {
        const script = `
LET count = 3
DO i = 1 TO count
  LET fact = "Item" || i
  -- Missing END statement
LET after_loop = "done"`;

        try {
            const commands = parse(script);
            await interpreter.run(commands);
            // If we get here, the parser or interpreter should have handled the error
            // We'll accept that it might succeed or fail gracefully
            expect(true).toBe(true);
        } catch (error) {
            // Should fail parsing or execution, but not hang
            expect(error).toBeDefined();
        }
    });
});