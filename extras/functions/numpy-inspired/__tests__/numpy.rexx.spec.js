const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the function module for direct registration  
const numpyFunctions = require('../numpy');

describe('NumPy-inspired Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    // Register NumPy functions directly with the interpreter
    // This verifies that functions are properly "hooked up" for REXX use
    Object.keys(numpyFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = numpyFunctions[funcName];
    });
  });

  test('should handle NUMPY_MAIN detection function', async () => {
    const rexxCode = `
      LET result = NUMPY_MAIN
      SAY "Detection function result: " || result.loaded
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('library_info');
    expect(result.loaded).toBe(true);
    expect(result.name).toBe('NumPy-inspired Functions');
  });

  test('should handle zeros function through Rexx interpreter', async () => {
    const rexxCode = `
      LET shape = "[2, 3]"
      LET result = zeros shape=shape
      SAY "Zeros result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].length).toBe(3);
    expect(result[0][0]).toBe(0);
  });

  test('should handle ones function through Rexx interpreter', async () => {
    const rexxCode = `
      LET shape = "3"
      LET result = ones shape=shape
      SAY "Ones result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(1);
  });

  test('should handle arange function through Rexx interpreter', async () => {
    const rexxCode = `
      LET start = "1"
      LET stop = "5"
      LET result = arange start=start stop=stop
      SAY "Arange result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  test('should handle array statistical functions', async () => {
    const rexxCode = `
      LET data = "[1, 5, 3, 9, 2]"
      LET minResult = amin a=data
      LET maxResult = amax a=data
      LET meanResult = mean a=data
      SAY "Min: " || minResult || ", Max: " || maxResult || ", Mean: " || meanResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('minResult')).toBe(1);
    expect(interpreter.variables.get('maxResult')).toBe(9);
    expect(interpreter.variables.get('meanResult')).toBe(4);
  });

  test('should handle mathematical operations', async () => {
    const rexxCode = `
      LET vector1 = "[1, 2, 3]"
      LET vector2 = "[4, 5, 6]"
      LET dotResult = dot a=vector1 b=vector2
      SAY "Dot product result: " || dotResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('dotResult');
    expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
  });

  test('should handle new mathematical functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET pi = 3.14159265359
      LET sinResult = SIN x=pi
      LET cosResult = COS x=0
      LET sqrtResult = SQRT x=16
      LET expResult = EXP x=0
      LET logResult = LOG10 x=100
      LET floorResult = FLOOR x=3.7
      LET ceilResult = CEIL x=3.2
      LET absResult = ABS x=-5.5
      SAY "Math results: sin=" || sinResult || " cos=" || cosResult || " sqrt=" || sqrtResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(Math.abs(interpreter.variables.get('sinResult'))).toBeLessThan(0.1); // sin(π) ≈ 0
    expect(interpreter.variables.get('cosResult')).toBe(1); // cos(0) = 1
    expect(interpreter.variables.get('sqrtResult')).toBe(4); // sqrt(16) = 4
    expect(interpreter.variables.get('expResult')).toBe(1); // exp(0) = 1
    expect(interpreter.variables.get('logResult')).toBe(2); // log10(100) = 2
    expect(interpreter.variables.get('floorResult')).toBe(3); // floor(3.7) = 3
    expect(interpreter.variables.get('ceilResult')).toBe(4); // ceil(3.2) = 4
    expect(interpreter.variables.get('absResult')).toBe(5.5); // abs(-5.5) = 5.5
  });

  test('should handle array operations through Rexx interpreter', async () => {
    const rexxCode = `
      LET data = JSON_PARSE text="[1, 2, 3, 4, 5]"
      LET sumResult = SUM a=data
      LET prodResult = PROD a=data
      LET cumsumResult = CUMSUM a=data
      SAY "Array ops: sum=" || sumResult || " prod=" || prodResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('sumResult')).toBe(15); // 1+2+3+4+5 = 15
    expect(interpreter.variables.get('prodResult')).toBe(120); // 1*2*3*4*5 = 120
    expect(Array.isArray(interpreter.variables.get('cumsumResult'))).toBe(true);
    expect(interpreter.variables.get('cumsumResult')).toEqual([1, 3, 6, 10, 15]); // cumulative sum
  });

  test('should handle correlation and covariance through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[1, 2, 3, 4, 5]"
      LET y = "[2, 4, 6, 8, 10]"
      LET corrResult = CORRCOEF x=x y=y
      LET covResult = COV x=x y=y ddof=1
      SAY "Stats: correlation=" || corrResult || " covariance=" || covResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const correlation = interpreter.variables.get('corrResult');
    const covariance = interpreter.variables.get('covResult');
    
    expect(correlation).toBeCloseTo(1, 5); // Perfect positive correlation
    expect(covariance).toBeGreaterThan(0); // Positive covariance
  });

  test('should handle new array creation functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET logResult = LOGSPACE start=1 stop=3 num=3
      LET emptyResult = EMPTY shape="[2, 2]"
      SAY "Array creation: logspace=" || logResult
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const logResult = interpreter.variables.get('logResult');
    const emptyResult = interpreter.variables.get('emptyResult');
    
    expect(Array.isArray(logResult)).toBe(true);
    expect(logResult.length).toBe(3);
    expect(logResult[0]).toBeCloseTo(10, 1); // 10^1 = 10
    expect(logResult[2]).toBeCloseTo(1000, 1); // 10^3 = 1000
    expect(Array.isArray(emptyResult)).toBe(true);
    expect(emptyResult.length).toBe(2);
  });

  test('should handle new mathematical functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET arcsinhResult = ARCSINH x=1
      LET expm1Result = EXPM1 x=1
      LET log1pResult = LOG1P x=1
      LET rintResult = RINT x=3.7
      LET fixResult = FIX x=-3.7
      SAY "Advanced math: arcsinh=" || arcsinhResult || " expm1=" || expm1Result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    expect(interpreter.variables.get('arcsinhResult')).toBeCloseTo(Math.asinh(1), 5);
    expect(interpreter.variables.get('expm1Result')).toBeCloseTo(Math.expm1(1), 5);
    expect(interpreter.variables.get('log1pResult')).toBeCloseTo(Math.log1p(1), 5);
    expect(interpreter.variables.get('rintResult')).toBe(4); // round to nearest integer
    expect(interpreter.variables.get('fixResult')).toBe(-3); // truncate toward zero
  });

  test('should handle new random functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET randnResult = RANDN 5
      LET uniformResult = UNIFORM low=0 high=10 size=3
      SAY "Random: randn length=" || LENGTH(randnResult) || " uniform length=" || LENGTH(uniformResult)
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const randnResult = interpreter.variables.get('randnResult');
    const uniformResult = interpreter.variables.get('uniformResult');
    
    expect(Array.isArray(randnResult)).toBe(true);
    expect(randnResult.length).toBe(5);
    expect(Array.isArray(uniformResult)).toBe(true);
    expect(uniformResult.length).toBe(3);
    // Check uniform values are in range
    uniformResult.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    });
  });

  test('should handle array manipulation functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET data = "[1, 2, 3, 4, 5, 6]"
      LET splitResult = SPLIT array=data sections=3
      LET resizeResult = RESIZE array=data newShape="[2, 3]"
      SAY "Manipulation: split parts=" || LENGTH(splitResult) || " resize shape=" || LENGTH(resizeResult)
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const splitResult = interpreter.variables.get('splitResult');
    const resizeResult = interpreter.variables.get('resizeResult');
    
    expect(Array.isArray(splitResult)).toBe(true);
    expect(splitResult.length).toBe(3); // 3 sections
    expect(Array.isArray(resizeResult)).toBe(true);
    expect(resizeResult.length).toBe(2); // 2 rows
    expect(resizeResult[0].length).toBe(3); // 3 columns
  });

  test('should handle linear algebra functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET matrix = "[[2, 1], [1, 2]]"
      LET vector = "[3, 4]"
      LET detResult = DET matrix=matrix
      LET solveResult = SOLVE A=matrix b=vector
      SAY "Linalg: det=" || detResult || " solve length=" || LENGTH(solveResult)
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const detResult = interpreter.variables.get('detResult');
    const solveResult = interpreter.variables.get('solveResult');
    
    expect(detResult).toBeCloseTo(3, 5); // det([[2,1],[1,2]]) = 4-1 = 3
    expect(Array.isArray(solveResult)).toBe(true);
    expect(solveResult.length).toBe(2);
    // Verify solution: 2x + y = 3, x + 2y = 4 => x = 2/3, y = 5/3
    expect(solveResult[0]).toBeCloseTo(2/3, 3);
    expect(solveResult[1]).toBeCloseTo(5/3, 3);
  });

  test('should handle histogram functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[1, 2, 3, 4, 5]"
      LET y = "[2, 4, 6, 8, 10]"
      LET hist2dResult = HISTOGRAM2D x=x y=y bins="[3, 3]"
      SAY "Histogram2D computed successfully"
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const hist2dResult = interpreter.variables.get('hist2dResult');
    
    expect(typeof hist2dResult).toBe('object');
    expect(hist2dResult.hist).toBeDefined();
    expect(Array.isArray(hist2dResult.hist)).toBe(true);
    expect(hist2dResult.xEdges).toBeDefined();
    expect(hist2dResult.yEdges).toBeDefined();
  });

  test('should handle advanced linear algebra functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET matrix = "[[4, 2], [1, 3]]"
      LET slogResult = SLOGDET matrix=matrix
      LET eigResult = EIG matrix=matrix
      LET eigvalsResult = EIGVALS matrix=matrix
      SAY "Advanced linalg: slogdet computed, eigenvalues found"
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const slogResult = interpreter.variables.get('slogResult');
    const eigResult = interpreter.variables.get('eigResult');
    const eigvalsResult = interpreter.variables.get('eigvalsResult');
    
    expect(typeof slogResult).toBe('object');
    expect(slogResult.sign).toBeDefined();
    expect(slogResult.logdet).toBeDefined();
    expect(typeof eigResult).toBe('object');
    expect(eigResult.eigenvalues).toBeDefined();
    expect(eigResult.eigenvectors).toBeDefined();
    expect(Array.isArray(eigvalsResult)).toBe(true);
  });

  test('should handle symmetric matrix eigenvalue decomposition through Rexx interpreter', async () => {
    const rexxCode = `
      LET symMatrix = "[[2, 1], [1, 2]]"
      LET eihResult = EIGH matrix=symMatrix
      SAY "Symmetric eigendecomposition completed"
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const eihResult = interpreter.variables.get('eihResult');
    
    expect(typeof eihResult).toBe('object');
    expect(eihResult.eigenvalues).toBeDefined();
    expect(eihResult.eigenvectors).toBeDefined();
    expect(Array.isArray(eihResult.eigenvalues)).toBe(true);
    expect(Array.isArray(eihResult.eigenvectors)).toBe(true);
  });

  test('should handle pseudo-inverse and least squares through Rexx interpreter', async () => {
    const rexxCode = `
      LET A = "[[1, 2], [3, 4], [5, 6]]"
      LET b = "[1, 2, 3]"
      LET pinvResult = PINV matrix=A
      LET lstsqResult = LSTSQ A=A b=b
      SAY "Pseudo-inverse and least squares computed"
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const pinvResult = interpreter.variables.get('pinvResult');
    const lstsqResult = interpreter.variables.get('lstsqResult');
    
    expect(Array.isArray(pinvResult)).toBe(true);
    expect(pinvResult.length).toBe(2); // 2 columns in original matrix
    expect(typeof lstsqResult).toBe('object');
    expect(lstsqResult.x).toBeDefined();
    expect(Array.isArray(lstsqResult.x)).toBe(true);
  });

  test('should handle matrix condition and rank analysis through direct calls', () => {
    // Test advanced linear algebra functions directly
    const matrix = [[4, 2], [1, 3]];
    
    const slogResult = interpreter.builtInFunctions.slogdet(matrix);
    expect(slogResult.sign).toBeDefined();
    expect(typeof slogResult.logdet).toBe('number');
    
    const eigResult = interpreter.builtInFunctions.eig(matrix);
    expect(Array.isArray(eigResult.eigenvalues)).toBe(true);
    expect(Array.isArray(eigResult.eigenvectors)).toBe(true);
    expect(eigResult.eigenvalues.length).toBeGreaterThan(0);
    
    const eigvalsOnly = interpreter.builtInFunctions.eigvals(matrix);
    expect(Array.isArray(eigvalsOnly)).toBe(true);
    expect(eigvalsOnly.length).toBe(eigResult.eigenvalues.length);
  });

  test('should handle rectangular matrices with pseudo-inverse', () => {
    // Test pseudo-inverse on rectangular matrix
    const rectMatrix = [[1, 2], [3, 4], [5, 6]]; // 3x2 matrix
    const pinvResult = interpreter.builtInFunctions.pinv(rectMatrix);
    
    expect(Array.isArray(pinvResult)).toBe(true);
    expect(pinvResult.length).toBe(2); // Should be 2x3 (transpose dimensions)
    expect(pinvResult[0].length).toBe(3);
  });

  test('should handle least squares for overdetermined systems', () => {
    // Test least squares solution
    const A = [[1, 1], [1, 2], [1, 3]]; // 3x2 overdetermined system
    const b = [6, 8, 10];
    
    const result = interpreter.builtInFunctions.lstsq(A, b);
    
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.x)).toBe(true);
    expect(result.x.length).toBe(2);
    expect(Array.isArray(result.residuals)).toBe(true);
    expect(typeof result.rank).toBe('number');
  });
});

// Additional test suite for mathematical edge cases
describe('NumPy Linear Algebra Edge Cases', () => {
  let interpreter;
  const numpyFunctions = require('../numpy');
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    Object.keys(numpyFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = numpyFunctions[funcName];
    });
  });

  test('should handle singular matrices in slogdet', () => {
    const singularMatrix = [[1, 2], [2, 4]]; // rank-deficient
    const result = interpreter.builtInFunctions.slogdet(singularMatrix);
    
    expect(result.sign).toBe(0);
    expect(result.logdet).toBe(-Infinity);
  });

  test('should handle identity matrix eigendecomposition', () => {
    const identity = [[1, 0], [0, 1]];
    const result = interpreter.builtInFunctions.eig(identity);
    
    expect(result.eigenvalues.length).toBe(2);
    // For identity matrix, eigenvalues should be close to 1
    result.eigenvalues.forEach(val => {
      expect(Math.abs(val - 1)).toBeLessThan(0.1);
    });
  });

  test('should handle symmetric matrix with eigh', () => {
    const symmetric = [[3, 1], [1, 3]];
    const result = interpreter.builtInFunctions.eigh(symmetric);
    
    expect(result.eigenvalues.length).toBe(2);
    expect(result.eigenvectors.length).toBe(2);
    
    // Eigenvalues of this matrix should be 2 and 4
    const sortedEigenvals = result.eigenvalues.slice().sort((a, b) => a - b);
    expect(sortedEigenvals[0]).toBeCloseTo(2, 1);
    expect(sortedEigenvals[1]).toBeCloseTo(4, 1);
  });

  test('should reject non-symmetric matrix in eigh', () => {
    const nonsymmetric = [[1, 2], [3, 4]];
    expect(() => {
      interpreter.builtInFunctions.eigh(nonsymmetric);
    }).toThrow('matrix must be symmetric');
  });

  test('should handle minimum norm solution for underdetermined systems', () => {
    const A = [[1, 2, 3]]; // 1x3 underdetermined system
    const b = [6];
    
    const result = interpreter.builtInFunctions.lstsq(A, b);
    
    expect(Array.isArray(result.x)).toBe(true);
    expect(result.x.length).toBe(3);
    expect(result.residuals.length).toBe(0); // No residuals for underdetermined
  });

  describe('New numpy functions - RexxJS integration', () => {
    test('should handle UNIQUE function in RexxJS', async () => {
      const rexxCode = `
        LET data = [1, 2, 2, 3, 3, 3, 4]
        LET unique_vals = UNIQUE data=data
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('unique_vals');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    test('should handle UNIQUE with return_counts in RexxJS', async () => {
      const rexxCode = `
        LET data = [1, 2, 2, 3, 3, 3]
        LET result = UNIQUE data=data return_counts=true
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('result');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.values).toBeDefined();
      expect(result.counts).toBeDefined();
      expect(Array.isArray(result.values)).toBe(true);
      expect(Array.isArray(result.counts)).toBe(true);
      expect(result.values.length).toBe(3);
      expect(result.values).toEqual([1, 2, 3]);
      expect(result.counts).toEqual([1, 2, 3]);
    });

    test('should handle SORT function in RexxJS', async () => {
      const rexxCode = `
        LET data = [3, 1, 4, 1, 5]
        LET sorted = SORT arr=data
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('sorted');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result).toEqual([1, 1, 3, 4, 5]);
    });

    test('should handle ARGSORT function in RexxJS', async () => {
      const rexxCode = `
        LET data = [30, 10, 40]
        LET indices = ARGSORT arr=data
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('indices');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result).toEqual([1, 0, 2]); // indices that would sort [30, 10, 40] to [10, 30, 40]
    });

    test('should handle WHERE function in RexxJS', async () => {
      const rexxCode = `
        LET condition = [true, false, true]
        LET indices = WHERE condition=condition
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('indices');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result).toEqual([0, 2]);
    });

    test('should handle WHERE with conditional selection in RexxJS', async () => {
      const rexxCode = `
        LET condition = [true, false, true]
        LET x = [10, 20, 30]
        LET y = [100, 200, 300]
        LET result = WHERE condition=condition x=x y=y
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('result');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result).toEqual([10, 200, 30]); // true->x[0], false->y[1], true->x[2]
    });

    test('should handle CLIP function in RexxJS', async () => {
      const rexxCode = `
        LET data = [1, 5, 10, 15, 20]
        LET clipped = CLIP arr=data min_val=5 max_val=15
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('clipped');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result).toEqual([5, 5, 10, 15, 15]);
    });

    test('should handle CONVOLVE function in RexxJS', async () => {
      const rexxCode = `
        LET a = [1, 2, 3]
        LET v = [1, 1]
        LET result = CONVOLVE a=a v=v mode="valid"
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const result = interpreter.variables.get('result');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result).toEqual([3, 5]); // valid convolution of [1,2,3] with [1,1]
    });

    test('should integrate new functions with existing ones in RexxJS', async () => {
      const rexxCode = `
        LET raw_data = [1, 1, 2, 2, 2, 3, 3, 3, 3, 10, 20, 5]
        LET clipped = CLIP arr=raw_data min_val=1 max_val=8
        LET unique_result = UNIQUE data=clipped return_counts=true
        LET mean_val = MEAN data=clipped
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);
      
      const clipped = interpreter.variables.get('clipped');
      const unique_result = interpreter.variables.get('unique_result');
      const mean_val = interpreter.variables.get('mean_val');
      
      expect(clipped).toBeDefined();
      expect(unique_result).toBeDefined();
      expect(mean_val).toBeDefined();
      
      // Verify clipping worked (10, 20, 5 should be clipped to 8, 8, 5)
      expect(clipped).toEqual([1, 1, 2, 2, 2, 3, 3, 3, 3, 8, 8, 5]);
      
      // Verify unique counts
      expect(unique_result.values).toEqual([1, 2, 3, 5, 8]);
      expect(unique_result.counts).toEqual([2, 3, 4, 1, 2]);
      
      // Verify mean calculation 
      expect(mean_val).toBeCloseTo((1*2 + 2*3 + 3*4 + 5*1 + 8*2) / 12);
    });
  });
});