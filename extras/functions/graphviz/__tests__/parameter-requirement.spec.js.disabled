/**
 * Tests for graphviz function parameter requirements
 */

describe('graphviz Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load graphviz functions
    const graphvizFunctions = await import('./src/graphviz-functions.js');
    if (graphvizFunctions.GRAPHVIZ_FUNCTIONS_MAIN) {
      const funcs = graphvizFunctions.GRAPHVIZ_FUNCTIONS_MAIN();
      Object.assign(interpreter.operations, funcs);
    }
  });

  test('GRAPHVIZ_RENDER without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_RENDER`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_RENDER function requires parameters');
  });

  test('GRAPHVIZ_DOT without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_DOT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_DOT function requires parameters');
  });

  test('GRAPHVIZ_DIGRAPH without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_DIGRAPH`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_DIGRAPH function requires parameters');
  });

  test('GRAPHVIZ_NODE without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_NODE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_NODE function requires parameters');
  });

  test('GRAPHVIZ_EDGE without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_EDGE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_EDGE function requires parameters');
  });

  test('GRAPHVIZ_SUBGRAPH without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_SUBGRAPH`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_SUBGRAPH function requires parameters');
  });

  test('GRAPHVIZ_LAYOUT without parameters should throw clear error', async () => {
    const script = `result = GRAPHVIZ_LAYOUT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('GRAPHVIZ_LAYOUT function requires parameters');
  });
});