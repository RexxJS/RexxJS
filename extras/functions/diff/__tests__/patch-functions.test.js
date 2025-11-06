const { Interpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');

describe('Patch Functions (@extras/patch)', () => {
  let interpreter;

  beforeEach(async () => {
    interpreter = new Interpreter();
    // Load diff functions module (includes PATCH functions) using absolute path
    const diffFunctionsPath = path.join(__dirname, '../src/diff-functions.js');
    await interpreter.run(parse(`REQUIRE "${diffFunctionsPath}"`));
  });

  describe('PATCH - Basic Functionality', () => {
    it('should apply a simple patch', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified, format="patch")
        LET result = PATCH(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('line2 changed');
      expect(result).toContain('line1');
      expect(result).toContain('line3');
    });

    it('should apply a patch with additions', async () => {
      const script = `
        LET original = "line1\\nline2"
        LET modified = "line1\\nline2\\nline3"
        LET patch = DIFF(text1=original, text2=modified)
        LET result = PATCH(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('line1\nline2\nline3');
    });

    it('should apply a patch with deletions', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline3"
        LET patch = DIFF(text1=original, text2=modified)
        LET result = PATCH(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('line1\nline3');
    });

    it('should handle multiline patches', async () => {
      const script = `
        LET original = "a\\nb\\nc\\nd\\ne"
        LET modified = "a\\nB\\nC\\nd\\ne"
        LET patch = DIFF(text1=original, text2=modified)
        LET result = PATCH(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toBe('a\nB\nC\nd\ne');
    });
  });

  describe('PATCH - Options', () => {
    it('should return detailed result when returnResult=true', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified)
        LET result = PATCH(text=original, patch=patch, returnResult=true)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('hunks');
      expect(result.success).toBe(true);
      expect(result.text).toContain('line2 changed');
    });

    it('should accept fuzz parameter without error', async () => {
      // Fuzz allows patches to apply with some context differences
      // This test just verifies the parameter is accepted
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified)
        LET result = PATCH(text=original, patch=patch, fuzz=2)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('line2 changed');
    });
  });

  describe('PATCH - Error Handling', () => {
    it('should throw error for invalid patch format', async () => {
      const script = `
        LET result = PATCH(text="hello", patch="invalid patch")
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    it('should throw error when patch cannot be applied', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET patch = "--- a\\n+++ b\\n@@ -1,3 +1,3 @@\\n line1\\n-completely different\\n+line2 changed\\n line3"
        LET result = PATCH(text=original, patch=patch)
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    it('should throw error for patch with no hunks', async () => {
      const script = `
        LET patch = "--- a\\n+++ b"
        LET result = PATCH(text="hello", patch=patch)
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow('no hunks');
    });
  });

  describe('PATCH_CHECK', () => {
    it('should check if patch can be applied', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified)
        LET check = PATCH_CHECK(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const check = interpreter.getVariable('check');

      expect(check.canApply).toBe(true);
      expect(check.conflicts).toEqual([]);
    });

    it('should detect when patch cannot be applied', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET patch = "--- a\\n+++ b\\n@@ -1,3 +1,3 @@\\n line1\\n-different content\\n+line2 changed\\n line3"
        LET check = PATCH_CHECK(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const check = interpreter.getVariable('check');

      expect(check.canApply).toBe(false);
      expect(check.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH_APPLY_MULTIPLE', () => {
    it('should apply multiple patches in sequence', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET step1 = "line1\\nline2 modified\\nline3"
        LET step2 = "line1\\nline2 modified\\nline3 also modified"

        LET patch1 = DIFF(text1=original, text2=step1)
        LET patch2 = DIFF(text1=step1, text2=step2)

        LET patches = [patch1, patch2]
        LET result = PATCH_APPLY_MULTIPLE(text=original, patches=patches)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('line2 modified');
      expect(result).toContain('line3 also modified');
    });

    it('should return results array when returnResults=true', async () => {
      const script = `
        LET original = "line1\\nline2"
        LET step1 = "line1\\nline2 A"
        LET step2 = "line1\\nline2 A B"

        LET patch1 = DIFF(text1=original, text2=step1)
        LET patch2 = DIFF(text1=step1, text2=step2)

        LET patches = [patch1, patch2]
        LET results = PATCH_APPLY_MULTIPLE(text=original, patches=patches, returnResults=true)
      `;
      await interpreter.run(parse(script));
      const results = interpreter.getVariable('results');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should stop on first error when stopOnError=true', async () => {
      const script = `
        LET original = "line1\\nline2"
        LET patch1 = DIFF(text1=original, text2="line1\\nline2 A")
        LET badPatch = "invalid patch format"
        LET patch2 = DIFF(text1="line1\\nline2 A", text2="line1\\nline2 A B")

        LET patches = [patch1, badPatch, patch2]
        LET result = PATCH_APPLY_MULTIPLE(text=original, patches=patches, stopOnError=true)
      `;
      await expect(interpreter.run(parse(script))).rejects.toThrow('Patch 1 failed');
    });

    it('should continue on error when stopOnError=false', async () => {
      const script = `
        LET original = "line1\\nline2"
        LET patch1 = DIFF(text1=original, text2="line1\\nline2 A")
        LET badPatch = "invalid"

        LET patches = [patch1, badPatch]
        LET results = PATCH_APPLY_MULTIPLE(text=original, patches=patches, stopOnError=false, returnResults=true)
      `;
      await interpreter.run(parse(script));
      const results = interpreter.getVariable('results');

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1]).toHaveProperty('error');
    });
  });

  describe('PATCH_CREATE_REVERSE', () => {
    it('should create a reverse patch', async () => {
      const script = `
        LET original = "line1\\nline2\\nline3"
        LET modified = "line1\\nline2 changed\\nline3"
        LET patch = DIFF(text1=original, text2=modified)

        /* Create reverse patch */
        LET reversePatch = PATCH_CREATE_REVERSE(patch=patch)

        /* Apply original patch */
        LET patched = PATCH(text=original, patch=patch)

        /* Apply reverse patch to undo */
        LET undone = PATCH(text=patched, patch=reversePatch)
      `;
      await interpreter.run(parse(script));
      const undone = interpreter.getVariable('undone');
      const original = interpreter.getVariable('original');

      // After applying patch and then reverse, should get back original
      expect(undone).toBe(original);
    });

    it('should swap old and new filenames', async () => {
      const script = `
        LET original = "hello"
        LET modified = "world"
        LET patch = DIFF_PATCH(text1=original, text2=modified, filename1="old.txt", filename2="new.txt")
        LET reversePatch = PATCH_CREATE_REVERSE(patch=patch)
      `;
      await interpreter.run(parse(script));
      const reversePatch = interpreter.getVariable('reversePatch');

      expect(reversePatch.oldFileName).toBe('new.txt');
      expect(reversePatch.newFileName).toBe('old.txt');
    });
  });

  describe('PATCH - Integration with DIFF', () => {
    it('should work seamlessly with DIFF output', async () => {
      const script = `
        LET original = "The quick brown fox\\njumps over\\nthe lazy dog"
        LET modified = "The quick red fox\\njumps over\\nthe sleeping dog"

        /* Create diff */
        LET patch = DIFF(text1=original, text2=modified)

        /* Apply patch */
        LET result = PATCH(text=original, patch=patch)
      `;
      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      expect(result).toContain('red fox');
      expect(result).toContain('sleeping dog');
    });

    it('should handle all DIFF formats', async () => {
      const script = `
        LET original = "a\\nb\\nc"
        LET modified = "a\\nB\\nc"

        /* Test with unified format */
        LET patchUnified = DIFF(text1=original, text2=modified, format="unified")
        LET resultUnified = PATCH(text=original, patch=patchUnified)

        /* Test with patch format */
        LET patchFormat = DIFF(text1=original, text2=modified, format="patch")
        LET resultPatch = PATCH(text=original, patch=patchFormat)
      `;
      await interpreter.run(parse(script));
      const resultUnified = interpreter.getVariable('resultUnified');
      const resultPatch = interpreter.getVariable('resultPatch');

      expect(resultUnified).toBe('a\nB\nc');
      expect(resultPatch).toBe('a\nB\nc');
    });
  });
});
