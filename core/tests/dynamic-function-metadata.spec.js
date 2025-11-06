/**
 * Dynamic Function Metadata Registration Tests
 *
 * Tests for the dynamic metadata registry system that allows
 * functions loaded via REQUIRE to register their metadata
 * so they appear in FUNCTIONS() and INFO() results.
 */

const {
  registerFunctionMetadata,
  registerModuleMetadata,
  getFunctionInfo,
  getFunctionsByCategory,
  getFunctionsByModule,
  getFunctionCount
} = require('../src/function-metadata-registry');

describe('Dynamic Function Metadata Registration', () => {
  // Save initial count to verify cleanup
  let initialCount;

  beforeEach(() => {
    initialCount = getFunctionCount();
  });

  describe('registerFunctionMetadata()', () => {
    it('should register metadata for a single function', () => {
      const result = registerFunctionMetadata('TEST_FUNCTION', {
        module: 'test-module.js',
        category: 'Test',
        description: 'A test function',
        parameters: ['param1', 'param2'],
        returns: 'string'
      });

      expect(result).toBe(true);
      expect(getFunctionCount()).toBe(initialCount + 1);
    });

    it('should retrieve registered metadata via getFunctionInfo()', () => {
      registerFunctionMetadata('RETRIEVE_TEST', {
        module: 'test-module.js',
        category: 'Test',
        description: 'Test retrieval',
        parameters: ['x'],
        returns: 'number',
        examples: ['RETRIEVE_TEST(5) => 10']
      });

      const info = getFunctionInfo('RETRIEVE_TEST');
      expect(info).toBeDefined();
      expect(info.module).toBe('test-module.js');
      expect(info.category).toBe('Test');
      expect(info.description).toBe('Test retrieval');
      expect(info.parameters).toEqual(['x']);
      expect(info.returns).toBe('number');
      expect(info.examples).toContain('RETRIEVE_TEST(5) => 10');
    });

    it('should be case-insensitive for function names', () => {
      registerFunctionMetadata('case_insensitive_test', {
        module: 'test-module.js',
        category: 'Test',
        description: 'Case insensitive',
        parameters: [],
        returns: 'void'
      });

      const info1 = getFunctionInfo('case_insensitive_test');
      const info2 = getFunctionInfo('CASE_INSENSITIVE_TEST');
      const info3 = getFunctionInfo('Case_Insensitive_Test');

      expect(info1).toBeDefined();
      expect(info2).toBeDefined();
      expect(info3).toBeDefined();
      expect(info1).toEqual(info2);
      expect(info2).toEqual(info3);
    });

    it('should validate required metadata fields', () => {
      const missingField = registerFunctionMetadata('INVALID_FUNC', {
        module: 'test.js',
        category: 'Test'
        // Missing: description, parameters, returns
      });

      expect(missingField).toBe(false);
    });

    it('should reject invalid function names', () => {
      const result = registerFunctionMetadata(null, {
        module: 'test.js',
        category: 'Test',
        description: 'Test',
        parameters: [],
        returns: 'string'
      });

      expect(result).toBe(false);
    });

    it('should handle optional examples field', () => {
      registerFunctionMetadata('WITH_EXAMPLES', {
        module: 'test.js',
        category: 'Test',
        description: 'Has examples',
        parameters: [],
        returns: 'string',
        examples: ['Example 1', 'Example 2']
      });

      const info = getFunctionInfo('WITH_EXAMPLES');
      expect(info.examples).toContain('Example 1');
    });

    it('should handle functions without examples', () => {
      registerFunctionMetadata('NO_EXAMPLES', {
        module: 'test.js',
        category: 'Test',
        description: 'No examples',
        parameters: [],
        returns: 'string'
      });

      const info = getFunctionInfo('NO_EXAMPLES');
      expect(info.examples).toBeUndefined();
    });
  });

  describe('registerModuleMetadata()', () => {
    it('should register metadata for all functions in a module', () => {
      const moduleExports = {
        FUNC_A: () => 'a',
        FUNC_B: () => 'b',
        __metadata__: {
          FUNC_A: {
            module: 'custom.js',
            category: 'Custom',
            description: 'Function A',
            parameters: [],
            returns: 'string'
          },
          FUNC_B: {
            module: 'custom.js',
            category: 'Custom',
            description: 'Function B',
            parameters: [],
            returns: 'string'
          }
        }
      };

      const registered = registerModuleMetadata(moduleExports, 'custom.js');

      expect(registered).toBe(2);
      expect(getFunctionInfo('FUNC_A')).toBeDefined();
      expect(getFunctionInfo('FUNC_B')).toBeDefined();
    });

    it('should apply prefix to function names when registering', () => {
      const moduleExports = {
        GREET: () => 'hello',
        __metadata__: {
          GREET: {
            module: 'custom.js',
            category: 'Custom',
            description: 'Greeting',
            parameters: ['name'],
            returns: 'string'
          }
        }
      };

      const registered = registerModuleMetadata(moduleExports, 'custom.js', 'custom_');

      expect(registered).toBe(1);
      // Function names are uppercased, so prefix should be too
      expect(getFunctionInfo('CUSTOM_GREET')).toBeDefined();
      expect(getFunctionInfo('GREET')).toBeNull(); // Original name not registered
    });

    it('should handle modules with no metadata gracefully', () => {
      const moduleExports = {
        FUNC_A: () => 'a',
        FUNC_B: () => 'b'
        // No metadata exported
      };

      const registered = registerModuleMetadata(moduleExports, 'no-metadata.js');

      expect(registered).toBe(0);
    });

    it('should support alternate metadata property names', () => {
      // Test with 'metadata' property
      const withMetadata = {
        TEST_FUNC: () => 'test',
        metadata: {
          TEST_FUNC: {
            module: 'test.js',
            category: 'Test',
            description: 'Test',
            parameters: [],
            returns: 'string'
          }
        }
      };

      const result1 = registerModuleMetadata(withMetadata, 'test1.js');
      expect(result1).toBe(1);

      // Test with '_metadata' property
      const withUnderscoreMetadata = {
        TEST_FUNC2: () => 'test',
        _metadata: {
          TEST_FUNC2: {
            module: 'test.js',
            category: 'Test',
            description: 'Test',
            parameters: [],
            returns: 'string'
          }
        }
      };

      const result2 = registerModuleMetadata(withUnderscoreMetadata, 'test2.js');
      expect(result2).toBe(1);
    });
  });

  describe('Integration with category and module queries', () => {
    beforeEach(() => {
      // Register custom functions in custom category
      registerFunctionMetadata('CUSTOM_FUNC_1', {
        module: 'custom.js',
        category: 'CustomTest',
        description: 'Custom function 1',
        parameters: [],
        returns: 'string'
      });

      registerFunctionMetadata('CUSTOM_FUNC_2', {
        module: 'custom.js',
        category: 'CustomTest',
        description: 'Custom function 2',
        parameters: [],
        returns: 'string'
      });
    });

    it('should include dynamically registered functions in category queries', () => {
      const customFuncs = getFunctionsByCategory('CustomTest');
      expect(customFuncs.CustomTest).toBeDefined();
      expect(customFuncs.CustomTest).toContain('CUSTOM_FUNC_1');
      expect(customFuncs.CustomTest).toContain('CUSTOM_FUNC_2');
    });

    it('should include dynamically registered functions in module queries', () => {
      const customModuleFuncs = getFunctionsByModule('custom.js');
      expect(customModuleFuncs['custom.js']).toBeDefined();
      expect(customModuleFuncs['custom.js']).toContain('CUSTOM_FUNC_1');
      expect(customModuleFuncs['custom.js']).toContain('CUSTOM_FUNC_2');
    });

    it('should create new category when registering functions with new category', () => {
      registerFunctionMetadata('NEW_CATEGORY_FUNC', {
        module: 'new.js',
        category: 'BrandNewCategory',
        description: 'First in new category',
        parameters: [],
        returns: 'string'
      });

      const newCategoryFuncs = getFunctionsByCategory('BrandNewCategory');
      expect(newCategoryFuncs.BrandNewCategory).toBeDefined();
      expect(newCategoryFuncs.BrandNewCategory).toContain('NEW_CATEGORY_FUNC');
    });

    it('should create new module when registering functions from new module', () => {
      registerFunctionMetadata('NEW_MODULE_FUNC', {
        module: 'brand-new-module.js',
        category: 'Test',
        description: 'First from new module',
        parameters: [],
        returns: 'string'
      });

      const newModuleFuncs = getFunctionsByModule('brand-new-module.js');
      expect(newModuleFuncs['brand-new-module.js']).toBeDefined();
      expect(newModuleFuncs['brand-new-module.js']).toContain('NEW_MODULE_FUNC');
    });
  });

  describe('Real-world scenario: Loading sample library', () => {
    it('should successfully load and register sample-custom-library metadata', () => {
      // Load the sample library
      const sampleLib = require('./sample-custom-library.js');

      // Register its metadata
      const registered = registerModuleMetadata(sampleLib, 'sample-custom-library.js', 'sample_');

      // Verify registration
      expect(registered).toBeGreaterThan(0);
      // Function names are uppercased, so prefix should be too
      expect(getFunctionInfo('SAMPLE_GREET')).toBeDefined();
      expect(getFunctionInfo('SAMPLE_CALCULATE')).toBeDefined();
      expect(getFunctionInfo('SAMPLE_PROCESS_TEXT')).toBeDefined();
      expect(getFunctionInfo('SAMPLE_ANALYZE')).toBeDefined();

      // Verify metadata content
      const greetInfo = getFunctionInfo('SAMPLE_GREET');
      expect(greetInfo.description).toContain('greeting');
      expect(greetInfo.parameters).toContain('name');
      expect(greetInfo.returns).toBe('string');
    });

    it('should make dynamically registered functions discoverable via queries', () => {
      // Load and register sample library
      const sampleLib = require('./sample-custom-library.js');
      registerModuleMetadata(sampleLib, 'sample-custom-library.js', 'sample_');

      // Query by module
      const byModule = getFunctionsByModule('sample-custom-library.js');
      expect(byModule['sample-custom-library.js']).toContain('SAMPLE_GREET');
      expect(byModule['sample-custom-library.js']).toContain('SAMPLE_CALCULATE');

      // Query by category
      const byCategory = getFunctionsByCategory('Custom');
      expect(byCategory.Custom).toContain('SAMPLE_GREET');
      expect(byCategory.Custom).toContain('SAMPLE_CALCULATE');
    });
  });
});
