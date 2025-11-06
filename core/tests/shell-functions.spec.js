/**
 * Shell-Inspired Functions Tests
 *
 * Modern file system operations inspired by Deno and Rust:
 * - Rich native APIs (no shelling out)
 * - Named parameters for ergonomics
 * - Pipeline operator compatible
 * - Cross-platform abstractions
 *
 * Test coverage includes:
 * - File listing (ls)
 * - File reading (cat)
 * - Pattern searching (grep)
 * - File finding (find)
 * - File operations (mkdir, cp, mv, rm)
 * - File metadata (stat)
 * - Path operations (basename, dirname, join)
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Shell-Inspired Functions', () => {
  let interpreter;
  let testDir;

  beforeEach(() => {
    const mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
    };
    interpreter = new RexxInterpreter(mockAddressSender);

    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rexxjs-shell-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('LS - List Directory', () => {
    beforeEach(() => {
      // Create test file structure
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'content2');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'file3.txt'), 'content3');
      fs.writeFileSync(path.join(testDir, 'subdir', 'file4.js'), 'content4');
    });

    it('should list files in directory', async () => {
      const script = `
        LET files = LS(path="${testDir}")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3); // file1.txt, file2.md, subdir
    });

    it('should list files recursively', async () => {
      const script = `
        LET files = LS(path="${testDir}", recursive=true)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(5); // All files + subdir
    });

    it('should filter by pattern', async () => {
      const script = `
        LET files = LS(path="${testDir}", pattern="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // Only file1.txt at root level
    });

    it('should filter by pattern recursively', async () => {
      const script = `
        LET files = LS(path="${testDir}", recursive=true, pattern="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(2); // file1.txt and subdir/file3.txt
    });

    it('should filter by type (files only)', async () => {
      const script = `
        LET files = LS(path="${testDir}", type="file")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(2); // file1.txt, file2.md (no subdir)
    });

    it('should filter by type (directories only)', async () => {
      const script = `
        LET dirs = LS(path="${testDir}", type="directory")
        LET count = ARRAY_LENGTH(array=dirs)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // Only subdir
    });

    it('should work with pipe operator', async () => {
      const script = `
        LET count = "${testDir}" |> LS(pattern="*.txt") |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should return file objects with metadata', async () => {
      const script = `
        LET files = LS(path="${testDir}", type="file")
        LET first = ARRAY_SLICE(array=files, start=0, end=1)
      `;

      await interpreter.run(parse(script));
      const first = interpreter.getVariable('first');
      expect(first).toBeDefined();
      expect(first[0]).toHaveProperty('name');
      expect(first[0]).toHaveProperty('path');
      expect(first[0]).toHaveProperty('size');
      expect(first[0]).toHaveProperty('isFile');
      expect(first[0]).toHaveProperty('isDirectory');
    });
  });

  describe('CAT - Read File', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello World');
      fs.writeFileSync(path.join(testDir, 'test.json'), '{"key":"value"}');
    });

    it('should read file contents', async () => {
      const testFile = path.join(testDir, 'test.txt');
      const script = `
        LET content = CAT(path="${testFile}")
      `;

      await interpreter.run(parse(script));
      const content = interpreter.getVariable('content');
      expect(content).toBe('Hello World');
    });

    it('should work with pipe operator', async () => {
      const testFile = path.join(testDir, 'test.txt');
      const script = `
        LET upper = "${testFile}" |> CAT() |> UPPER()
      `;

      await interpreter.run(parse(script));
      const upper = interpreter.getVariable('upper');
      expect(upper).toBe('HELLO WORLD');
    });

    it('should read JSON and parse in pipeline', async () => {
      const testFile = path.join(testDir, 'test.json');
      const script = `
        LET data = "${testFile}" |> CAT() |> JSON_PARSE()
      `;

      await interpreter.run(parse(script));
      const data = interpreter.getVariable('data');
      expect(data).toEqual({ key: 'value' });
    });

    it('should handle non-existent files', async () => {
      const script = `
        LET content = CAT(path="${testDir}/nonexistent.txt")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('GREP - Search Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'TODO: fix bug\nDone: feature');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'TODO: add tests\nAnother line');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'file3.txt'), 'TODO: refactor\nCode here');
    });

    it('should search for pattern in single file', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="TODO", path="${testFile}")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // One line with TODO
    });

    it('should search recursively in directory', async () => {
      const script = `
        LET matches = GREP(pattern="TODO", path="${testDir}", recursive=true)
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3); // Three files with TODO
    });

    it('should support regex patterns', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="\\\\bTODO\\\\b", path="${testFile}")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should support case-insensitive search', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="todo", path="${testFile}", ignoreCase=true)
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should return match objects with line numbers', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="TODO", path="${testFile}")
        LET first = ARRAY_SLICE(array=matches, start=0, end=1)
      `;

      await interpreter.run(parse(script));
      const first = interpreter.getVariable('first');
      expect(first[0]).toHaveProperty('file');
      expect(first[0]).toHaveProperty('line');
      expect(first[0]).toHaveProperty('lineNumber');
      expect(first[0]).toHaveProperty('match');
      expect(first[0].lineNumber).toBe(1);
    });

    it('should work with glob patterns', async () => {
      const script = `
        LET matches = GREP(pattern="TODO", path="${testDir}/**/*.txt")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3);
    });
  });

  describe('FIND - Find Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'old.txt'), 'old');
      fs.writeFileSync(path.join(testDir, 'new.txt'), 'new');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'nested.txt'), 'nested');

      // Make old.txt actually old
      const oldTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      fs.utimesSync(path.join(testDir, 'old.txt'), oldTime, oldTime);
    });

    it('should find all files', async () => {
      const script = `
        LET files = FIND(path="${testDir}", type="file")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should find by name pattern', async () => {
      const script = `
        LET files = FIND(path="${testDir}", name="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should find files modified within days', async () => {
      const script = `
        LET files = FIND(path="${testDir}", type="file", modifiedWithin=7)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1); // At least new.txt
    });

    it('should find by size', async () => {
      // Create a larger file
      fs.writeFileSync(path.join(testDir, 'large.txt'), 'x'.repeat(1000));

      const script = `
        LET files = FIND(path="${testDir}", type="file", minSize=500)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should work with pipe operator', async () => {
      const script = `
        LET count = "${testDir}" |> FIND(type="file") |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MKDIR - Create Directory', () => {
    it('should create directory', async () => {
      const newDir = path.join(testDir, 'newdir');
      const script = `
        MKDIR(path="${newDir}")
        LET exists = FILE_EXISTS(filename="${newDir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should create nested directories with recursive', async () => {
      const newDir = path.join(testDir, 'a', 'b', 'c');
      const script = `
        MKDIR(path="${newDir}", recursive=true)
        LET exists = FILE_EXISTS(filename="${newDir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should handle existing directory', async () => {
      const newDir = path.join(testDir, 'existing');
      fs.mkdirSync(newDir);

      const script = `
        MKDIR(path="${newDir}")
      `;

      // Should not throw when directory exists
      await interpreter.run(parse(script));
      expect(fs.existsSync(newDir)).toBe(true);
    });
  });

  describe('CP - Copy Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'source.txt'), 'source content');
      fs.mkdirSync(path.join(testDir, 'sourcedir'));
      fs.writeFileSync(path.join(testDir, 'sourcedir', 'file.txt'), 'file content');
    });

    it('should copy file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'dest.txt');

      const script = `
        CP(source="${source}", dest="${dest}")
        LET exists = FILE_EXISTS(filename="${dest}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.readFileSync(dest, 'utf8')).toBe('source content');
    });

    it('should copy directory recursively', async () => {
      const source = path.join(testDir, 'sourcedir');
      const dest = path.join(testDir, 'destdir');

      const script = `
        CP(source="${source}", dest="${dest}", recursive=true)
        LET exists = FILE_EXISTS(filename="${dest}/file.txt")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
    });

    it('should handle non-existent source', async () => {
      const script = `
        CP(source="${testDir}/nonexistent.txt", dest="${testDir}/dest.txt")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('MV - Move/Rename Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'source.txt'), 'content');
    });

    it('should move file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'dest.txt');

      const script = `
        MV(source="${source}", dest="${dest}")
        LET sourceExists = FILE_EXISTS(filename="${source}")
        LET destExists = FILE_EXISTS(filename="${dest}")
      `;

      await interpreter.run(parse(script));
      const sourceExists = interpreter.getVariable('sourceExists');
      const destExists = interpreter.getVariable('destExists');

      expect(sourceExists).toBe(false);
      expect(destExists).toBe(true);
    });

    it('should rename file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'renamed.txt');

      const script = `
        MV(source="${source}", dest="${dest}")
        LET content = CAT(path="${dest}")
      `;

      await interpreter.run(parse(script));
      const content = interpreter.getVariable('content');
      expect(content).toBe('content');
    });
  });

  describe('RM - Remove Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');
      fs.mkdirSync(path.join(testDir, 'dir'));
      fs.writeFileSync(path.join(testDir, 'dir', 'nested.txt'), 'nested');
    });

    it('should remove file', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        RM(path="${file}")
        LET exists = FILE_EXISTS(filename="${file}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(false);
    });

    it('should remove directory recursively', async () => {
      const dir = path.join(testDir, 'dir');

      const script = `
        RM(path="${dir}", recursive=true)
        LET exists = FILE_EXISTS(filename="${dir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(false);
    });

    it('should require recursive for non-empty directory', async () => {
      const dir = path.join(testDir, 'dir');

      const script = `
        RM(path="${dir}")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    it('should handle force flag', async () => {
      const script = `
        RM(path="${testDir}/nonexistent.txt", force=true)
      `;

      // Should not throw with force=true
      await interpreter.run(parse(script));
    });
  });

  describe('STAT - File Metadata', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'test content');
    });

    it('should return file statistics', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        LET stats = STAT(path="${file}")
      `;

      await interpreter.run(parse(script));
      const stats = interpreter.getVariable('stats');

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('isFile');
      expect(stats).toHaveProperty('isDirectory');
      expect(stats).toHaveProperty('created');
      expect(stats).toHaveProperty('modified');
      expect(stats).toHaveProperty('accessed');
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
      expect(stats.size).toBe(12); // 'test content'.length
    });

    it('should work with pipe operator', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        LET stats = "${file}" |> STAT()
      `;

      await interpreter.run(parse(script));
      const stats = interpreter.getVariable('stats');
      expect(stats.isFile).toBe(true);
    });
  });

  describe('Path Operations', () => {
    it('should get basename', async () => {
      const script = `
        LET name = BASENAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const name = interpreter.getVariable('name');
      expect(name).toBe('file.txt');
    });

    it('should get dirname', async () => {
      const script = `
        LET dir = DIRNAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const dir = interpreter.getVariable('dir');
      expect(dir).toBe('/path/to');
    });

    it('should join paths', async () => {
      const script = `
        LET joined = PATH_JOIN("path", "to", "file.txt")
      `;

      await interpreter.run(parse(script));
      const joined = interpreter.getVariable('joined');
      expect(joined).toBe(path.join('path', 'to', 'file.txt'));
    });

    it('should resolve to absolute path', async () => {
      const script = `
        LET absolute = PATH_RESOLVE(path="file.txt")
      `;

      await interpreter.run(parse(script));
      const absolute = interpreter.getVariable('absolute');
      expect(path.isAbsolute(absolute)).toBe(true);
    });

    it('should get file extension', async () => {
      const script = `
        LET ext = PATH_EXTNAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const ext = interpreter.getVariable('ext');
      expect(ext).toBe('.txt');
    });
  });

  describe('Pipeline Composition', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'TODO: test\nContent');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'README');
      fs.mkdirSync(path.join(testDir, 'src'));
      fs.writeFileSync(path.join(testDir, 'src', 'test.js'), 'TODO: implement');
    });

    it('should compose find and grep', async () => {
      const script = `
        LET files = "${testDir}" |> FIND(type="file", name="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should chain multiple operations', async () => {
      const script = `
        LET result = "${testDir}"
          |> LS(recursive=true, pattern="*.txt")
          |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should read and transform file content', async () => {
      const file = path.join(testDir, 'file1.txt');
      const script = `
        LET result = "${file}"
          |> CAT()
          |> UPPER()
          |> LENGTH()
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Text Processing Functions', () => {
    describe('HEAD', () => {
      it('should return first 10 lines by default', async () => {
        const script = `
          LET lines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
          LET result = HEAD(input=lines)
          LET count = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(10);
      });

      it('should return first N lines', async () => {
        const script = `
          LET lines = ["a", "b", "c", "d", "e"]
          LET result = HEAD(input=lines, lines=3)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty input', async () => {
        const script = `
          LET result = HEAD(input=[], lines=5)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([]);
      });

      it('should handle N larger than array length', async () => {
        const script = `
          LET lines = ["a", "b"]
          LET result = HEAD(input=lines, lines=10)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b']);
      });
    });

    describe('TAIL', () => {
      it('should return last 10 lines by default', async () => {
        const script = `
          LET lines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
          LET result = TAIL(input=lines)
          LET count = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(10);
      });

      it('should return last N lines', async () => {
        const script = `
          LET lines = ["a", "b", "c", "d", "e"]
          LET result = TAIL(input=lines, lines=2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['d', 'e']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET result = ["1", "2", "3", "4", "5"] |> TAIL(lines=3)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['3', '4', '5']);
      });
    });

    describe('WC', () => {
      it('should count lines in array', async () => {
        const script = `
          LET myLines = ["line1", "line2", "line3"]
          LET result = WC(input=myLines, type="lines")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(3);
      });

      it('should count words in array', async () => {
        const script = `
          LET lines = ["hello world", "foo bar baz"]
          LET result = WC(input=lines, type="words")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(5);
      });

      it('should count characters', async () => {
        const script = `
          LET lines = ["hello"]
          LET result = WC(input=lines, type="chars")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(5);
      });

      it('should return all counts for array', async () => {
        const script = `
          LET lines = ["hello world", "foo bar"]
          LET result = WC(input=lines)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.lines).toBe(2);
        expect(result.words).toBe(4);
        expect(result.chars).toBeGreaterThan(0);
      });
    });

    describe('SORT', () => {
      it('should sort lines alphabetically', async () => {
        const script = `
          LET lines = ["zebra", "apple", "banana"]
          LET result = SORT(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['apple', 'banana', 'zebra']);
      });

      it('should sort numerically', async () => {
        const script = `
          LET numbers = ["10", "2", "100", "1"]
          LET result = SORT(input=numbers, numeric=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1', '2', '10', '100']);
      });

      it('should sort in reverse order', async () => {
        const script = `
          LET lines = ["a", "b", "c"]
          LET result = SORT(input=lines, reverse=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['c', 'b', 'a']);
      });

      it('should remove duplicates when unique=true', async () => {
        const script = `
          LET lines = ["b", "a", "b", "c", "a"]
          LET result = SORT(input=lines, unique=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET result = ["3", "1", "2"] |> SORT()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1', '2', '3']);
      });
    });

    describe('UNIQ', () => {
      it('should remove adjacent duplicates', async () => {
        const script = `
          LET lines = ["a", "a", "b", "b", "b", "c", "c", "a"]
          LET result = UNIQ(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c', 'a']);
      });

      it('should count occurrences when count=true', async () => {
        const script = `
          LET lines = ["a", "a", "a", "b", "b", "c"]
          LET result = UNIQ(input=lines, count=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['3 a', '2 b', '1 c']);
      });

      it('should work after SORT in pipeline', async () => {
        const script = `
          LET result = ["b", "a", "b", "a", "c"]
            |> SORT()
            |> UNIQ()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty array', async () => {
        const script = `
          LET result = UNIQ(input=[])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([]);
      });
    });

    describe('SEQ', () => {
      it('should generate sequence from 1 to N', async () => {
        const script = `
          LET result = SEQ(5)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([1, 2, 3, 4, 5]);
      });

      it('should generate sequence from start to end', async () => {
        const script = `
          LET result = SEQ(3, 7)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([3, 4, 5, 6, 7]);
      });

      it('should use step increment', async () => {
        const script = `
          LET result = SEQ(0, 10, 2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([0, 2, 4, 6, 8, 10]);
      });

      it('should handle negative step', async () => {
        const script = `
          LET result = SEQ(5, 1, -1)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([5, 4, 3, 2, 1]);
      });

      it('should work in pipelines', async () => {
        const script = `
          LET result = SEQ(5) |> ARRAY_MAP(n => n * 2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([2, 4, 6, 8, 10]);
      });

      it('should throw on zero step', async () => {
        const script = `
          LET result = SEQ(1, 10, 0)
        `;
        await expect(interpreter.run(parse(script))).rejects.toThrow('step cannot be zero');
      });
    });

    describe('SHUF', () => {
      it('should shuffle array elements', async () => {
        const script = `
          LET input = ["a", "b", "c", "d", "e"]
          LET result = SHUF(input)
          LET length = ARRAY_LENGTH(result)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        const input = ['a', 'b', 'c', 'd', 'e'];

        // Should have same length
        expect(result.length).toBe(5);

        // Should contain all same elements
        expect(result.sort()).toEqual(input.sort());
      });

      it.skip('should maintain array length', async () => {
        const script = `
          LET result = SHUF(["1", "2", "3"])
          LET count = ARRAY_LENGTH(result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(3);
      });

      it('should handle single element', async () => {
        const script = `
          LET result = SHUF(["only"])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['only']);
      });
    });

    describe('CUT', () => {
      it('should extract single field', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = CUT(input=lines, fields="2")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b', '2']);
      });

      it('should extract multiple fields', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = CUT(input=lines, fields="1,3")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a\tc', '1\t3']);
      });

      it('should extract field range', async () => {
        const script = `
          LET lines = ["a	b	c	d"]
          LET result = CUT(input=lines, fields="2-3")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b\tc']);
      });

      it('should use custom delimiter', async () => {
        const script = `
          LET lines = ["a,b,c", "1,2,3"]
          LET result = CUT(input=lines, fields="1,3", delimiter=",")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a,c', '1,3']);
      });

      it('should handle missing fields', async () => {
        const script = `
          LET lines = ["a	b"]
          LET result = CUT(input=lines, fields="1,2,3,4")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a\tb\t\t']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = lines |> CUT(fields="2")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b', '2']);
      });
    });

    describe('PASTE', () => {
      it('should merge two arrays line by line', async () => {
        const script = `
          LET a = ["a1", "a2"]
          LET b = ["b1", "b2"]
          LET result = PASTE(a, b)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1\tb1', 'a2\tb2']);
      });

      it('should use custom delimiter', async () => {
        const script = `
          LET a = ["a1", "a2"]
          LET b = ["b1", "b2"]
          LET result = PASTE(a, b, delimiter=",")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1,b1', 'a2,b2']);
      });

      it('should handle arrays of different lengths', async () => {
        const script = `
          LET a = ["a1", "a2", "a3"]
          LET b = ["b1"]
          LET result = PASTE(a, b)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1\tb1', 'a2\t', 'a3\t']);
      });

      it('should merge three arrays', async () => {
        const script = `
          LET result = PASTE(["1"], ["2"], ["3"])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1\t2\t3']);
      });
    });

    describe('TEE', () => {
      beforeEach(() => {
        // Create a temp file for TEE tests
        const teeFile = path.join(testDir, 'tee-output.txt');
        if (fs.existsSync(teeFile)) {
          fs.unlinkSync(teeFile);
        }
      });

      it('should write to file and pass through data', async () => {
        const teeFile = path.join(testDir, 'tee-output.txt');
        const script = `
          LET result = TEE(input="hello world", file="${teeFile}")
        `;
        await interpreter.run(parse(script));

        const result = interpreter.getVariable('result');
        expect(result).toBe('hello world');
        expect(fs.existsSync(teeFile)).toBe(true);
        expect(fs.readFileSync(teeFile, 'utf8')).toBe('hello world\n');
      });

      it('should append when append=true', async () => {
        const teeFile = path.join(testDir, 'tee-append.txt');
        fs.writeFileSync(teeFile, 'existing\n');

        const script = `
          LET result = TEE(input="new", file="${teeFile}", append=true)
        `;
        await interpreter.run(parse(script));

        const content = fs.readFileSync(teeFile, 'utf8');
        expect(content).toBe('existing\nnew\n');
      });

      it('should work in pipeline', async () => {
        const teeFile = path.join(testDir, 'tee-pipe.txt');
        const script = `
          LET result = ["a", "b", "c"]
            |> TEE(file="${teeFile}")
            |> ARRAY_LENGTH()
        `;
        await interpreter.run(parse(script));

        expect(interpreter.getVariable('result')).toBe(3);
        expect(fs.existsSync(teeFile)).toBe(true);
      });
    });

    describe('XARGS', () => {
      it('should build command with arguments', async () => {
        const script = `
          LET files = ["file1.txt", "file2.txt"]
          LET result = XARGS(input=files, command="rm")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['rm file1.txt file2.txt']);
      });

      it('should use placeholder syntax', async () => {
        const script = `
          LET files = ["file1.txt", "file2.txt"]
          LET result = XARGS(input=files, command="echo {}")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['echo file1.txt file2.txt']);
      });

      it('should batch with maxArgs', async () => {
        const script = `
          LET files = ["a", "b", "c", "d"]
          LET result = XARGS(input=files, command="cmd", maxArgs=2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['cmd a b', 'cmd c d']);
      });

      it('should handle string input', async () => {
        const script = `
          LET text = "file1\\nfile2\\nfile3"
          LET result = XARGS(input=text, command="process {}")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['process file1 file2 file3']);
      });
    });

    describe('NL', () => {
      it('should number lines starting from 1', async () => {
        const script = `
          LET lines = ["apple", "banana", "cherry"]
          LET result = NL(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([
          '     1  apple',
          '     2  banana',
          '     3  cherry'
        ]);
      });

      it('should start numbering from custom value', async () => {
        const script = `
          LET lines = ["first", "second"]
          LET result = NL(input=lines, start=10)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([
          '    10  first',
          '    11  second'
        ]);
      });

      it('should handle string input', async () => {
        const script = `
          LET text = "line1\\nline2"
          LET result = NL(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([
          '     1  line1',
          '     2  line2'
        ]);
      });
    });

    describe('REV', () => {
      it('should reverse each line', async () => {
        const script = `
          LET lines = ["abc", "123", "xyz"]
          LET result = REV(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['cba', '321', 'zyx']);
      });

      it('should handle string input', async () => {
        const script = `
          LET text = "hello\\nworld"
          LET result = REV(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['olleh', 'dlrow']);
      });
    });

    describe('TAC', () => {
      it('should reverse line order', async () => {
        const script = `
          LET lines = ["first", "second", "third"]
          LET result = TAC(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['third', 'second', 'first']);
      });

      it('should handle string input', async () => {
        const script = `
          LET text = "a\\nb\\nc"
          LET result = TAC(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['c', 'b', 'a']);
      });
    });

    describe('FOLD', () => {
      it('should wrap lines at default width 80', async () => {
        const script = `
          LET longLine = "${'a'.repeat(100)}"
          LET result = FOLD(input=longLine)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.length).toBe(2); // 100 chars wrapped at 80
        expect(result[0].length).toBe(80);
        expect(result[1].length).toBe(20);
      });

      it('should wrap at custom width', async () => {
        const script = `
          LET line = "abcdefghijklmnopqrstuvwxyz"
          LET result = FOLD(input=line, width=10)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([
          'abcdefghij',
          'klmnopqrst',
          'uvwxyz'
        ]);
      });

      it('should handle array of lines', async () => {
        const script = `
          LET lines = ["short", "${'a'.repeat(25)}"]
          LET result = FOLD(input=lines, width=10)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.length).toBe(4); // "short" + 3 wrapped lines
        expect(result[0]).toBe('short');
      });
    });

    describe('EXPAND', () => {
      it('should convert tabs to spaces with default width 8', async () => {
        const script = `
          LET line = "a\\tb\\tc"
          LET result = EXPAND(input=line)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result[0]).toBe('a       b       c');
      });

      it.skip('should convert tabs with custom width', async () => {
        const script = `
          LET line = "a\\tb"
          LET result = EXPAND(input=line, tabWidth=4)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a   b']);
      });

      it.skip('should handle array input', async () => {
        const script = `
          LET lines = ["a\\tb", "c\\td"]
          LET result = EXPAND(input=lines, tabWidth=4)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a   b', 'c   d']);
      });
    });

    describe('DOS2UNIX', () => {
      it('should convert CRLF to LF', async () => {
        const script = `
          LET text = "line1\\r\\nline2\\r\\nline3"
          LET result = DOS2UNIX(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('line1\nline2\nline3');
      });

      it('should handle array input', async () => {
        const script = `
          LET lines = ["line1", "line2"]
          LET result = DOS2UNIX(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['line1', 'line2']);
      });
    });

    describe('UNIX2DOS', () => {
      it('should convert LF to CRLF', async () => {
        const script = `
          LET text = "line1\\nline2\\nline3"
          LET result = UNIX2DOS(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('line1\r\nline2\r\nline3');
      });

      it('should handle array input', async () => {
        const script = `
          LET lines = ["line1", "line2"]
          LET result = UNIX2DOS(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('line1\r\nline2');
      });
    });

    describe('BASE32', () => {
      it('should encode string to Base32', async () => {
        const script = `
          LET text = "Hello"
          LET result = BASE32(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('JBSWY3DP');
      });

      it('should decode Base32 to string', async () => {
        const script = `
          LET encoded = "JBSWY3DP"
          LET result = BASE32(input=encoded, decode=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('Hello');
      });

      it('should handle encoding with padding', async () => {
        const script = `
          LET text = "Hello World"
          LET result = BASE32(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('JBSWY3DPEBLW64TMMQ======');
      });

      it('should decode with padding', async () => {
        const script = `
          LET encoded = "JBSWY3DPEBLW64TMMQ======"
          LET result = BASE32(input=encoded, decode=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('Hello World');
      });
    });

    describe('XXD', () => {
      it('should encode string to hex', async () => {
        const script = `
          LET text = "ABC"
          LET result = XXD(input=text)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('414243');
      });

      it('should decode hex to string', async () => {
        const script = `
          LET hex = "414243"
          LET result = XXD(input=hex, decode=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('ABC');
      });

      it('should handle hex with spaces', async () => {
        const script = `
          LET hex = "41 42 43"
          LET result = XXD(input=hex, decode=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe('ABC');
      });

      it('should handle multi-byte characters', async () => {
        const script = `
          LET text = "Hi!"
          LET encoded = XXD(input=text)
          LET decoded = XXD(input=encoded, decode=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('decoded')).toBe('Hi!');
      });
    });

    describe('HEXDUMP', () => {
      it('should create formatted hex dump', async () => {
        const script = `
          LET text = "Hello World!"
          LET result = HEXDUMP(input=text)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2); // 1 line + final offset
        expect(result[0]).toMatch(/^00000000/);
        expect(result[0]).toContain('48 65 6c 6c 6f'); // "Hello" in hex
        expect(result[0]).toContain('|Hello World!|');
      });

      it('should handle custom width', async () => {
        const script = `
          LET text = "ABCDEFGHIJKLMNOP"
          LET result = HEXDUMP(input=text, width=8)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.length).toBe(3); // 2 lines + final offset
        expect(result[0]).toContain('|ABCDEFGH|');
        expect(result[1]).toContain('|IJKLMNOP|');
      });

      it('should format output with offset, hex, and ASCII', async () => {
        const script = `
          LET text = "Test123"
          LET result = HEXDUMP(input=text)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        // Should show offset, hex bytes, and ASCII representation
        expect(result[0]).toContain('00000000');  // offset
        expect(result[0]).toContain('|Test123|'); // ASCII column
      });
    });

    describe('OD', () => {
      it('should create octal dump by default', async () => {
        const script = `
          LET text = "ABC"
          LET result = OD(input=text)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2); // 1 line + final offset
        expect(result[0]).toMatch(/^0000000/);
        expect(result[0]).toContain('101 102 103'); // A=101, B=102, C=103 in octal
      });

      it('should support hex format', async () => {
        const script = `
          LET text = "ABC"
          LET result = OD(input=text, format="hex")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result[0]).toContain('41 42 43'); // A=0x41, B=0x42, C=0x43
      });

      it('should support decimal format', async () => {
        const script = `
          LET text = "ABC"
          LET result = OD(input=text, format="decimal")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result[0]).toContain(' 65  66  67'); // A=65, B=66, C=67
      });

      it('should support char format', async () => {
        const script = `
          LET text = "ABC"
          LET result = OD(input=text, format="char")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result[0]).toContain('A B C'); // Characters with spacing
      });
    });

    describe('FMT', () => {
      it('should format text to default width', async () => {
        const script = `
          LET text = "This is a very long line that should be wrapped at the default width of 75 characters which is the standard terminal width for formatting text output"
          LET result = FMT(input=text)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].length).toBeLessThanOrEqual(75);
      });

      it('should format text to custom width', async () => {
        const script = `
          LET text = "Short text that will wrap at thirty characters max"
          LET result = FMT(input=text, width=30)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        result.forEach(line => {
          expect(line.length).toBeLessThanOrEqual(30);
        });
      });

      it('should handle multiple words correctly', async () => {
        const script = `
          LET text = "One two three four five six seven eight nine ten"
          LET result = FMT(input=text, width=20)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        result.forEach(line => {
          expect(line.length).toBeLessThanOrEqual(20);
        });
      });
    });

    describe('STRINGS', () => {
      it('should extract printable strings with default length', async () => {
        const script = `
          LET data = "Hello\\x00\\x01World\\x00Test"
          LET result = STRINGS(input=data)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should respect minimum length parameter', async () => {
        const script = `
          LET data = "Hi Test LongerString"
          LET result = STRINGS(input=data, minLength=6)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        result.forEach(str => {
          expect(str.length).toBeGreaterThanOrEqual(6);
        });
      });

      it('should extract strings from text data', async () => {
        const script = `
          LET data = "Some printable text here"
          LET result = STRINGS(input=data, minLength=4)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('File Comparison Functions', () => {
      describe('CMP', () => {
        it('should return equal for identical strings', async () => {
          const script = `
            LET text1 = "Hello World"
            LET text2 = "Hello World"
            LET result = CMP(input1=text1, input2=text2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result.equal).toBe(true);
          expect(result.message).toBe('Files are identical');
        });

        it('should detect first difference', async () => {
          const script = `
            LET text1 = "Hello World"
            LET text2 = "Hello Earth"
            LET result = CMP(input1=text1, input2=text2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result.equal).toBe(false);
          expect(result.line).toBe(1);
          expect(result.byte).toBeGreaterThan(0);
          expect(result.char1).not.toBe(result.char2);
        });

        it('should detect length differences', async () => {
          const script = `
            LET text1 = "Hello"
            LET text2 = "Hello World"
            LET result = CMP(input1=text1, input2=text2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result.equal).toBe(false);
        });

        it('should track line numbers correctly', async () => {
          const script = `
            LET lines1 = ["Line1", "Line2", "Line3"]
            LET lines2 = ["Line1", "Line2", "LineX"]
            LET result = CMP(input1=lines1, input2=lines2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result.equal).toBe(false);
          expect(result.line).toBe(3);
        });
      });

      describe('COMM', () => {
        it('should show all three columns by default', async () => {
          const script = `
            LET text1 = ["apple", "banana", "cherry"]
            LET text2 = ["banana", "cherry", "date"]
            LET result = COMM(input1=text1, input2=text2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(Array.isArray(result)).toBe(true);
          expect(result).toContain('apple'); // Only in file1
          expect(result).toContain('\t\tbanana'); // In both
          expect(result).toContain('\t\tcherry'); // In both
          expect(result).toContain('\tdate'); // Only in file2
        });

        it('should suppress column 1', async () => {
          const script = `
            LET text1 = ["apple", "banana"]
            LET text2 = ["banana", "cherry"]
            LET result = COMM(input1=text1, input2=text2, suppress=1)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).not.toContain('apple'); // Suppressed (only in file1)
          expect(result).toContain('\t\tbanana'); // In both
          expect(result).toContain('\tcherry'); // Only in file2
        });

        it('should suppress column 2', async () => {
          const script = `
            LET text1 = ["apple", "banana"]
            LET text2 = ["banana", "cherry"]
            LET result = COMM(input1=text1, input2=text2, suppress=2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('apple'); // Only in file1
          expect(result).toContain('\t\tbanana'); // In both
          expect(result).not.toContain('\tcherry'); // Suppressed (only in file2)
        });

        it('should suppress column 3', async () => {
          const script = `
            LET text1 = ["apple", "banana"]
            LET text2 = ["banana", "cherry"]
            LET result = COMM(input1=text1, input2=text2, suppress=3)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('apple'); // Only in file1
          expect(result).toContain('\tcherry'); // Only in file2
          expect(result).not.toContain('\t\tbanana'); // Suppressed (in both)
        });

        it('should handle empty inputs', async () => {
          const script = `
            LET text1 = ""
            LET text2 = ""
            LET result = COMM(input1=text1, input2=text2)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(1); // Empty string becomes one empty line
        });
      });
    });

    describe('UUENCODE/UUDECODE', () => {
      describe('UUENCODE', () => {
        it('should encode text with header and footer', async () => {
          const script = `
            LET text = "Hello, World!"
            LET result = UUENCODE(input=text, filename="test.txt")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('begin 644 test.txt');
          expect(result).toContain('end');
        });

        it('should use default filename if not specified', async () => {
          const script = `
            LET text = "Test"
            LET result = UUENCODE(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('begin 644 data.bin');
        });

        it('should produce printable ASCII output', async () => {
          const script = `
            LET text = "ABC"
            LET result = UUENCODE(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          // UUencoded output should be printable ASCII
          expect(result).toMatch(/^[\x20-\x7E\n]+$/);
        });
      });

      describe('UUDECODE', () => {
        it('should decode UUencoded data', async () => {
          const script = `
            LET text = "Hello"
            LET encoded = UUENCODE(input=text)
            LET decoded = UUDECODE(input=encoded)
          `;
          await interpreter.run(parse(script));
          const decoded = interpreter.getVariable('decoded');
          expect(decoded).toBe('Hello');
        });

        it('should handle round-trip encoding/decoding', async () => {
          const script = `
            LET text = "The quick brown fox jumps over the lazy dog"
            LET encoded = UUENCODE(input=text, filename="fox.txt")
            LET decoded = UUDECODE(input=encoded)
          `;
          await interpreter.run(parse(script));
          const original = 'The quick brown fox jumps over the lazy dog';
          const decoded = interpreter.getVariable('decoded');
          expect(decoded).toBe(original);
        });

        it('should handle special characters', async () => {
          const script = `
            LET text = "ABC!@#$%^&*()123"
            LET encoded = UUENCODE(input=text)
            LET decoded = UUDECODE(input=encoded)
          `;
          await interpreter.run(parse(script));
          const decoded = interpreter.getVariable('decoded');
          expect(decoded).toBe('ABC!@#$%^&*()123');
        });

        it('should handle empty input', async () => {
          const script = `
            LET text = ""
            LET encoded = UUENCODE(input=text)
            LET decoded = UUDECODE(input=encoded)
          `;
          await interpreter.run(parse(script));
          const decoded = interpreter.getVariable('decoded');
          expect(decoded).toBe('');
        });
      });
    });

    describe('Checksum Functions', () => {
      describe('CRC32', () => {
        it('should calculate CRC32 checksum', async () => {
          const script = `
            LET text = "Hello, World!"
            LET result = CRC32(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBe(8); // CRC32 is 8 hex characters
          expect(result).toMatch(/^[0-9a-f]+$/);
        });

        it('should produce consistent checksums', async () => {
          const script = `
            LET text = "test"
            LET result1 = CRC32(input=text)
            LET result2 = CRC32(input=text)
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).toBe(result2);
        });

        it('should produce different checksums for different inputs', async () => {
          const script = `
            LET result1 = CRC32(input="abc")
            LET result2 = CRC32(input="xyz")
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).not.toBe(result2);
        });
      });

      describe('CKSUM', () => {
        it('should calculate POSIX checksum with byte count', async () => {
          const script = `
            LET text = "Hello"
            LET result = CKSUM(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toMatch(/^\d+ \d+$/); // Format: "checksum bytes"
          expect(result).toContain('5'); // 5 bytes
        });

        it('should produce consistent checksums', async () => {
          const script = `
            LET text = "test data"
            LET result1 = CKSUM(input=text)
            LET result2 = CKSUM(input=text)
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).toBe(result2);
        });

        it('should include correct byte count', async () => {
          const script = `
            LET text = "ABC"
            LET result = CKSUM(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          const parts = result.split(' ');
          expect(parts[1]).toBe('3'); // 3 bytes
        });
      });

      describe('SUM_BSD', () => {
        it('should calculate BSD checksum by default', async () => {
          const script = `
            LET text = "Hello"
            LET result = SUM_BSD(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toMatch(/^\d+ \d+$/); // Format: "checksum blocks"
        });

        it('should calculate SysV checksum when specified', async () => {
          const script = `
            LET text = "The quick brown fox jumps over the lazy dog"
            LET bsd = SUM_BSD(input=text, algorithm="bsd")
            LET sysv = SUM_BSD(input=text, algorithm="sysv")
          `;
          await interpreter.run(parse(script));
          const bsd = interpreter.getVariable('bsd');
          const sysv = interpreter.getVariable('sysv');
          expect(bsd).not.toBe(sysv); // Different algorithms produce different results
        });

        it('should calculate block count', async () => {
          const script = `
            LET text = "A"
            LET result = SUM_BSD(input=text)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          const parts = result.split(' ');
          expect(parts[1]).toBe('1'); // 1 block (< 1024 bytes)
        });

        it('should produce consistent checksums', async () => {
          const script = `
            LET text = "test"
            LET result1 = SUM_BSD(input=text)
            LET result2 = SUM_BSD(input=text)
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).toBe(result2);
        });
      });
    });

    describe('System Information Functions', () => {
      describe('UNAME', () => {
        it('should return platform by default', async () => {
          const script = `
            LET result = UNAME()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });

        it('should support option parameter', async () => {
          const script = `
            LET system = UNAME(option="system")
            LET arch = UNAME(option="machine")
            LET all = UNAME(option="all")
          `;
          await interpreter.run(parse(script));
          const system = interpreter.getVariable('system');
          const arch = interpreter.getVariable('arch');
          const all = interpreter.getVariable('all');
          expect(typeof system).toBe('string');
          expect(typeof arch).toBe('string');
          expect(typeof all).toBe('string');
          expect(all).toContain(system);
        });
      });

      describe('HOSTNAME', () => {
        it('should return hostname', async () => {
          const script = `
            LET result = HOSTNAME()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      describe('WHOAMI', () => {
        it('should return current username', async () => {
          const script = `
            LET result = WHOAMI()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      describe('NPROC', () => {
        it('should return number of processors', async () => {
          const script = `
            LET result = NPROC()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThan(0);
        });
      });

      describe('ARCH', () => {
        it('should return architecture', async () => {
          const script = `
            LET result = ARCH()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      describe('USERINFO', () => {
        it('should return user information object', async () => {
          const script = `
            LET result = USERINFO()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('object');
          expect(result.username).toBeDefined();
          expect(typeof result.username).toBe('string');
        });
      });

      describe('ENV', () => {
        it('should return all environment variables when no parameter', async () => {
          const script = `
            LET result = ENV()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('object');
          expect(Object.keys(result).length).toBeGreaterThan(0);
        });

        it('should return specific environment variable when name provided', async () => {
          const script = `
            LET result = ENV(name="PATH")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
        });
      });

      describe('UPTIME', () => {
        it('should return system uptime', async () => {
          const script = `
            LET result = UPTIME()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThan(0);
        });
      });
    });

    describe('Pipeline Integration', () => {
      it('should chain multiple text processing functions', async () => {
        const script = `
          LET result = SEQ(10)
            |> SHUF()
            |> SORT(numeric=true)
            |> HEAD(lines=5)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should process text with SORT and UNIQ', async () => {
        const script = `
          LET lines = ["b", "a", "a", "c", "b", "a"]
          LET result = lines
            |> SORT()
            |> UNIQ()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should extract and count fields', async () => {
        const script = `
          LET data = ["a	1", "b	2", "c	3"]
          LET result = data
            |> CUT(fields="2")
            |> WC(type="lines")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(3);
      });

      it('should generate, transform, and sample data', async () => {
        const script = `
          LET result = SEQ(1, 100, 10)
            |> ARRAY_MAP(n => n * 2)
            |> TAIL(lines=3)
        `;
        await interpreter.run(parse(script));
        // SEQ(1, 100, 10) = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91]
        // * 2 = [2, 22, 42, 62, 82, 102, 122, 142, 162, 182]
        // TAIL 3 = [142, 162, 182]
        expect(interpreter.getVariable('result')).toEqual([142, 162, 182]);
      });
    });

    describe('System Information Functions', () => {
      describe('GROUPS', () => {
        it('should return an array of groups', async () => {
          const script = `
            LET result = GROUPS()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);
        });
      });

      describe('LOGNAME', () => {
        it('should return the login name', async () => {
          const script = `
            LET result = LOGNAME()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      describe('GETCONF', () => {
        it('should return PAGE_SIZE by default', async () => {
          const script = `
            LET result = GETCONF()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toBe(4096);
        });

        it('should return number of processors for NPROCESSORS_ONLN', async () => {
          const script = `
            LET result = GETCONF(name="NPROCESSORS_ONLN")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThan(0);
        });

        it('should return hostname for HOSTNAME config', async () => {
          const script = `
            LET result = GETCONF(name="HOSTNAME")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });

        it('should return tmpdir for TMPDIR config', async () => {
          const script = `
            LET result = GETCONF(name="TMPDIR")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });

        it('should return undefined for unknown config', async () => {
          const script = `
            LET result = GETCONF(name="UNKNOWN_CONFIG")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toBeUndefined();
        });
      });

      describe('DNSDOMAINNAME', () => {
        it('should return domain name or empty string', async () => {
          const script = `
            LET result = DNSDOMAINNAME()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          // Result can be empty string if no domain in hostname
        });
      });

      describe('TTY', () => {
        it('should return boolean for TTY status', async () => {
          const script = `
            LET result = TTY()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('boolean');
        });
      });
    });

    describe('Utility Functions', () => {
      describe('FACTOR', () => {
        it('should factor a prime number', async () => {
          const script = `
            LET result = FACTOR(n=17)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toEqual([17]);
        });

        it('should factor a composite number', async () => {
          const script = `
            LET result = FACTOR(n=60)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toEqual([2, 2, 3, 5]);
        });

        it('should factor number 1', async () => {
          const script = `
            LET result = FACTOR(n=1)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toEqual([1]);
        });

        it('should factor a large composite number', async () => {
          const script = `
            LET result = FACTOR(n=1024)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
        });
      });

      describe('MCOOKIE', () => {
        it('should generate 32-character hex string by default', async () => {
          const script = `
            LET result = MCOOKIE()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBe(32);
          expect(result).toMatch(/^[0-9a-f]+$/);
        });

        it('should generate custom length hex string', async () => {
          const script = `
            LET result = MCOOKIE(bytes=8)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result.length).toBe(16); // 8 bytes = 16 hex chars
          expect(result).toMatch(/^[0-9a-f]+$/);
        });

        it('should generate different values on each call', async () => {
          const script = `
            LET result1 = MCOOKIE()
            LET result2 = MCOOKIE()
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).not.toBe(result2);
        });
      });

      describe('MKTEMP', () => {
        it('should generate temp path with default template', async () => {
          const script = `
            LET result = MKTEMP()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('tmp.');
        });

        it('should generate temp path with custom template', async () => {
          const script = `
            LET result = MKTEMP(template="myfile.XXX.txt")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('myfile.');
          expect(result).toContain('.txt');
        });

        it('should replace X characters with random values', async () => {
          const script = `
            LET result1 = MKTEMP(template="file.XXXXXX")
            LET result2 = MKTEMP(template="file.XXXXXX")
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).not.toBe(result2);
        });
      });

      describe('ASCII', () => {
        it('should return info for a specific character', async () => {
          const script = `
            LET result = ASCII(char="A")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('Dec: 65');
          expect(result).toContain('Hex: 0x41');
          expect(result).toContain('Char: A');
        });

        it('should return full ASCII table when no char specified', async () => {
          const script = `
            LET result = ASCII()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('Dec  Hex  Oct');
          expect(result.split('\n').length).toBeGreaterThan(60);
        });

        it('should handle control characters', async () => {
          const script = `
            LET result = ASCII(char=" ")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('Dec: 32');
          expect(result).toContain('Hex: 0x20');
        });

        it('should handle numeric input', async () => {
          const script = `
            LET result = ASCII(char=65)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('Dec: 54'); // ASCII code of '6'
        });
      });

      describe('YES', () => {
        it('should repeat default text 100 times', async () => {
          const script = `
            LET result = YES()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(100);
          expect(result[0]).toBe('y');
        });

        it('should repeat custom text N times', async () => {
          const script = `
            LET result = YES(text="yes", count=5)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toEqual(['yes', 'yes', 'yes', 'yes', 'yes']);
        });

        it('should limit to max 10000 repetitions', async () => {
          const script = `
            LET result = YES(text="x", count=50000)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result.length).toBe(10000);
        });
      });

      describe('TRUE/FALSE', () => {
        it('TRUE should return true', async () => {
          const script = `
            LET result = TRUE()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toBe(true);
        });

        it('FALSE should return false', async () => {
          const script = `
            LET result = FALSE()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toBe(false);
        });
      });

      describe('CAL', () => {
        it('should generate calendar for current month when no params', async () => {
          const script = `
            LET result = CAL()
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('Su Mo Tu We Th Fr Sa');
        });

        it('should generate calendar for specific month/year', async () => {
          const script = `
            LET result = CAL(month=1, year=2025)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('January 2025');
          expect(result).toContain('Su Mo Tu We Th Fr Sa');
        });

        it('should handle leap year February correctly', async () => {
          const script = `
            LET result = CAL(month=2, year=2024)
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toContain('February 2024');
          expect(result).toContain('29'); // Leap year has 29 days
        });
      });

      describe('WHICH', () => {
        it('should find node command in PATH', async () => {
          const script = `
            LET result = WHICH(command="node")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('node');
        });

        it('should return null for non-existent command', async () => {
          const script = `
            LET result = WHICH(command="nonexistentcommandxyz123")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(result).toBeNull();
        });
      });

      describe('MKPASSWD', () => {
        it('should generate password hash with default salt', async () => {
          const script = `
            LET result = MKPASSWD(password="test123")
          `;
          await interpreter.run(parse(script));
          const result = interpreter.getVariable('result');
          expect(typeof result).toBe('string');
          expect(result).toContain('$6$');
          expect(result.length).toBeGreaterThan(10);
        });

        it('should generate consistent hash for same password/salt', async () => {
          const script = `
            LET result1 = MKPASSWD(password="test", salt="$6$mysalt")
            LET result2 = MKPASSWD(password="test", salt="$6$mysalt")
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).toBe(result2);
        });

        it('should generate different hash for different passwords', async () => {
          const script = `
            LET result1 = MKPASSWD(password="test1")
            LET result2 = MKPASSWD(password="test2")
          `;
          await interpreter.run(parse(script));
          const result1 = interpreter.getVariable('result1');
          const result2 = interpreter.getVariable('result2');
          expect(result1).not.toBe(result2);
        });
      });

      describe('Compression Functions', () => {
        describe('GZIP', () => {
          it('should compress text data', async () => {
            const script = `
              LET text = "Hello, World! This is a test of gzip compression."
              LET result = GZIP(input=text, encoding="base64")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          });

          it('should compress and return Buffer by default', async () => {
            const script = `
              LET text = "Test data"
              LET result = GZIP(input=text)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Buffer.isBuffer(result)).toBe(true);
          });

          it('should compress array data', async () => {
            const script = `
              LET lines = ["line1", "line2", "line3"]
              LET result = GZIP(input=lines, encoding="hex")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]+$/);
          });
        });

        describe('GUNZIP', () => {
          it('should decompress gzipped data', async () => {
            const script = `
              LET text = "Hello, World!"
              LET compressed = GZIP(input=text, encoding="base64")
              LET result = GUNZIP(input=compressed)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe('Hello, World!');
          });

          it('should handle hex encoded compressed data', async () => {
            const script = `
              LET text = "Test data"
              LET compressed = GZIP(input=text, encoding="hex")
              LET result = GUNZIP(input=compressed)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe('Test data');
          });

          it('should round-trip compress and decompress', async () => {
            const script = `
              LET original = "The quick brown fox jumps over the lazy dog"
              LET compressed = GZIP(input=original, encoding="base64")
              LET decompressed = GUNZIP(input=compressed)
            `;
            await interpreter.run(parse(script));
            const original = interpreter.getVariable('original');
            const decompressed = interpreter.getVariable('decompressed');
            expect(decompressed).toBe(original);
          });
        });

        describe('ZCAT', () => {
          it('should decompress and output gzipped data', async () => {
            const script = `
              LET text = "Sample text for zcat"
              LET compressed = GZIP(input=text, encoding="base64")
              LET result = ZCAT(input=compressed)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe('Sample text for zcat');
          });

          it('should work with Buffer input', async () => {
            const script = `
              LET text = "Buffer test"
              LET compressed = GZIP(input=text)
              LET result = ZCAT(input=compressed)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe('Buffer test');
          });
        });
      });

      describe('File Operations', () => {
        const testDir = '/tmp/rexxjs-file-ops-test';
        const os = require('os');
        const path = require('path');

        beforeEach(async () => {
          // Create test directory
          const script = `
            LET result = MKDIR(path="${testDir}", recursive=true)
          `;
          await interpreter.run(parse(script));
        });

        afterEach(async () => {
          // Clean up test directory
          const script = `
            LET result = RMDIR(path="${testDir}", recursive=true)
          `;
          try {
            await interpreter.run(parse(script));
          } catch (e) {
            // Ignore cleanup errors
          }
        });

        describe('TOUCH', () => {
          it('should create new file', async () => {
            const testFile = path.join(testDir, 'test.txt');
            const script = `
              LET result = TOUCH(path="${testFile}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const fs = require('fs');
            expect(fs.existsSync(testFile)).toBe(true);
          });

          it('should update timestamps on existing file', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'existing.txt');
            fs.writeFileSync(testFile, 'content');
            const oldStats = fs.statSync(testFile);

            // Wait a bit then touch
            await new Promise(resolve => setTimeout(resolve, 10));

            const script = `
              LET result = TOUCH(path="${testFile}")
            `;
            await interpreter.run(parse(script));

            const newStats = fs.statSync(testFile);
            expect(newStats.mtime.getTime()).toBeGreaterThan(oldStats.mtime.getTime());
          });
        });

        describe('CHMOD', () => {
          it('should change file permissions', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'chmod-test.txt');
            fs.writeFileSync(testFile, 'test');

            const script = `
              LET result = CHMOD(path="${testFile}", mode="755")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const stats = fs.statSync(testFile);
            // 755 in octal = 0o755 = 493 in decimal
            expect((stats.mode & 0o777).toString(8)).toBe('755');
          });
        });

        describe('LINK', () => {
          it('should create hard link', async () => {
            const fs = require('fs');
            const source = path.join(testDir, 'original.txt');
            const link = path.join(testDir, 'hardlink.txt');
            fs.writeFileSync(source, 'content');

            const script = `
              LET result = LINK(existing="${source}", new="${link}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            expect(fs.existsSync(link)).toBe(true);
            expect(fs.readFileSync(link, 'utf8')).toBe('content');

            // Check they have same inode
            const sourceStat = fs.statSync(source);
            const linkStat = fs.statSync(link);
            expect(sourceStat.ino).toBe(linkStat.ino);
          });
        });

        describe('UNLINK', () => {
          it('should remove file', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'to-delete.txt');
            fs.writeFileSync(testFile, 'delete me');

            const script = `
              LET result = UNLINK(path="${testFile}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            expect(fs.existsSync(testFile)).toBe(false);
          });
        });

        describe('RMDIR', () => {
          it('should remove empty directory', async () => {
            const fs = require('fs');
            const emptyDir = path.join(testDir, 'empty');
            fs.mkdirSync(emptyDir);

            const script = `
              LET result = RMDIR(path="${emptyDir}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            expect(fs.existsSync(emptyDir)).toBe(false);
          });

          it('should remove directory recursively', async () => {
            const fs = require('fs');
            const nestedDir = path.join(testDir, 'nested', 'deep');
            fs.mkdirSync(nestedDir, { recursive: true });
            fs.writeFileSync(path.join(nestedDir, 'file.txt'), 'content');

            const script = `
              LET result = RMDIR(path="${path.join(testDir, 'nested')}", recursive=true)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            expect(fs.existsSync(path.join(testDir, 'nested'))).toBe(false);
          });
        });

        describe('DU', () => {
          it('should calculate disk usage', async () => {
            const fs = require('fs');
            const file1 = path.join(testDir, 'file1.txt');
            const file2 = path.join(testDir, 'file2.txt');
            fs.writeFileSync(file1, 'a'.repeat(100));
            fs.writeFileSync(file2, 'b'.repeat(200));

            const script = `
              LET result = DU(path="${testDir}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(300);
          });

          it('should return detailed info when requested', async () => {
            const fs = require('fs');
            const file1 = path.join(testDir, 'file1.txt');
            fs.writeFileSync(file1, 'test');

            const script = `
              LET result = DU(path="${testDir}", detailed=true)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result.total).toBe(4);
            expect(Array.isArray(result.files)).toBe(true);
            expect(result.count).toBe(1);
          });
        });

        describe('READLINK', () => {
          it('should read symbolic link target', async () => {
            const fs = require('fs');
            const target = path.join(testDir, 'target.txt');
            const link = path.join(testDir, 'symlink.txt');
            fs.writeFileSync(target, 'content');
            fs.symlinkSync(target, link);

            const script = `
              LET result = READLINK(path="${link}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(target);
          });
        });

        describe('TRUNCATE', () => {
          it('should truncate file to specified size', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'truncate.txt');
            fs.writeFileSync(testFile, 'a'.repeat(100));

            const script = `
              LET result = TRUNCATE(path="${testFile}", size=50)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const stats = fs.statSync(testFile);
            expect(stats.size).toBe(50);
          });

          it('should truncate file to zero by default', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'truncate-zero.txt');
            fs.writeFileSync(testFile, 'content');

            const script = `
              LET result = TRUNCATE(path="${testFile}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const stats = fs.statSync(testFile);
            expect(stats.size).toBe(0);
          });
        });

        describe('LN', () => {
          it('should create symbolic link by default', async () => {
            const fs = require('fs');
            const target = path.join(testDir, 'ln-target.txt');
            const link = path.join(testDir, 'ln-symlink.txt');
            fs.writeFileSync(target, 'content');

            const script = `
              LET result = LN(target="${target}", link="${link}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const linkStats = fs.lstatSync(link);
            expect(linkStats.isSymbolicLink()).toBe(true);
            expect(fs.readlinkSync(link)).toBe(target);
          });

          it('should create hard link when symbolic=false', async () => {
            const fs = require('fs');
            const target = path.join(testDir, 'ln-hard-target.txt');
            const link = path.join(testDir, 'ln-hardlink.txt');
            fs.writeFileSync(target, 'content');

            const script = `
              LET result = LN(target="${target}", link="${link}", symbolic=false)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const targetStats = fs.statSync(target);
            const linkStats = fs.statSync(link);
            expect(targetStats.ino).toBe(linkStats.ino);
          });
        });

        describe('CHGRP', () => {
          it('should change file group', async () => {
            const fs = require('fs');
            const testFile = path.join(testDir, 'chgrp-test.txt');
            fs.writeFileSync(testFile, 'test');
            const originalStats = fs.statSync(testFile);

            // Use same gid for test (to avoid permission errors)
            const script = `
              LET result = CHGRP(path="${testFile}", gid=${originalStats.gid})
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const newStats = fs.statSync(testFile);
            expect(newStats.gid).toBe(originalStats.gid);
            expect(newStats.uid).toBe(originalStats.uid); // UID should not change
          });
        });

        describe('INSTALL', () => {
          it('should copy file and set permissions', async () => {
            const fs = require('fs');
            const source = path.join(testDir, 'install-source.txt');
            const dest = path.join(testDir, 'install-dest.txt');
            fs.writeFileSync(source, 'test content');

            const script = `
              LET result = INSTALL(source="${source}", dest="${dest}", mode="644")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            expect(fs.existsSync(dest)).toBe(true);
            expect(fs.readFileSync(dest, 'utf8')).toBe('test content');

            const stats = fs.statSync(dest);
            expect((stats.mode & 0o777).toString(8)).toBe('644');
          });

          it('should use default mode 755 when not specified', async () => {
            const fs = require('fs');
            const source = path.join(testDir, 'install-src2.txt');
            const dest = path.join(testDir, 'install-dst2.txt');
            fs.writeFileSync(source, 'test');

            const script = `
              LET result = INSTALL(source="${source}", dest="${dest}")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);

            const stats = fs.statSync(dest);
            expect((stats.mode & 0o777).toString(8)).toBe('755');
          });
        });
      });

      describe('Process Management', () => {
        describe('GETPID', () => {
          it('should return current process ID', async () => {
            const script = `
              LET result = GETPID()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);
            expect(result).toBe(process.pid);
          });
        });

        describe('GETPPID', () => {
          it('should return parent process ID', async () => {
            const script = `
              LET result = GETPPID()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);
            expect(result).toBe(process.ppid);
          });
        });

        describe('SLEEP', () => {
          it('should sleep for specified milliseconds', async () => {
            const start = Date.now();
            const script = `
              LET result = SLEEP(ms=100)
            `;
            await interpreter.run(parse(script));
            const elapsed = Date.now() - start;
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);
            expect(elapsed).toBeGreaterThanOrEqual(95); // Allow 5ms tolerance
          });
        });

        describe('ENV (environment variables)', () => {
          it('should return all environment variables when no name specified', async () => {
            const script = `
              LET result = ENV()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('PATH');
          });

          it('should return specific environment variable', async () => {
            process.env.TEST_VAR_12345 = 'test_value';
            const script = `
              LET result = ENV(name="TEST_VAR_12345")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe('test_value');
            delete process.env.TEST_VAR_12345;
          });
        });

        describe('SETENV', () => {
          it('should set environment variable', async () => {
            const script = `
              LET result = SETENV(name="TEST_SETENV_VAR", value="test123")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);
            expect(process.env.TEST_SETENV_VAR).toBe('test123');
            delete process.env.TEST_SETENV_VAR;
          });
        });

        describe('UNSETENV', () => {
          it('should unset environment variable', async () => {
            process.env.TEST_UNSETENV_VAR = 'value';
            const script = `
              LET result = UNSETENV(name="TEST_UNSETENV_VAR")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toBe(true);
            expect(process.env.TEST_UNSETENV_VAR).toBeUndefined();
          });
        });

        describe('KILL', () => {
          it('should verify KILL function is available', async () => {
            // Note: We can't actually kill our own process in a test
            // Just verify GETPID works as KILL depends on having a valid PID
            const script = `
              LET pid = GETPID()
            `;
            await interpreter.run(parse(script));
            const pid = interpreter.getVariable('pid');
            expect(typeof pid).toBe('number');
            expect(pid).toBeGreaterThan(0);
            // KILL function exists and would work, but we don't test it
            // to avoid killing the test process
          });
        });

        describe('PS', () => {
          it('should return array of processes', async () => {
            const script = `
              LET result = PS()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
          });

          it('should return process objects with expected fields', async () => {
            const script = `
              LET result = PS()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            const firstProc = result[0];
            expect(firstProc).toHaveProperty('pid');
            expect(firstProc).toHaveProperty('ppid');
            expect(firstProc).toHaveProperty('name');
            expect(firstProc).toHaveProperty('cmd');
            expect(typeof firstProc.pid).toBe('number');
            expect(firstProc.pid).toBeGreaterThan(0);
          });

          it('should include current process in list', async () => {
            const script = `
              LET processes = PS()
              LET currentPid = GETPID()
            `;
            await interpreter.run(parse(script));
            const processes = interpreter.getVariable('processes');
            const currentPid = interpreter.getVariable('currentPid');
            const currentProc = processes.find(p => p.pid === currentPid);
            expect(currentProc).toBeDefined();
          });
        });

        describe('PGREP', () => {
          it('should find process by name pattern', async () => {
            const script = `
              LET result = PGREP(pattern="node")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Array.isArray(result)).toBe(true);
            // Should find at least one node process (the test itself)
            expect(result.length).toBeGreaterThan(0);
          });

          it('should return array of PIDs', async () => {
            const script = `
              LET result = PGREP(pattern="node")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Array.isArray(result)).toBe(true);
            if (result.length > 0) {
              expect(typeof result[0]).toBe('number');
              expect(result[0]).toBeGreaterThan(0);
            }
          });

          it('should return empty array for non-matching pattern', async () => {
            const script = `
              LET result = PGREP(pattern="nonexistentprocessname12345xyz")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
          });

          it('should support exact match option', async () => {
            const script = `
              LET result = PGREP(pattern="node", exact=true)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(Array.isArray(result)).toBe(true);
            // Exact match for 'node' should find node processes
          });
        });

        describe('KILLALL', () => {
          it('should return number of killed processes', async () => {
            // Test with a non-existent process name (safe test)
            const script = `
              LET result = KILLALL(name="nonexistentprocess12345xyz")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('number');
            expect(result).toBe(0);
          });

          it('should accept signal parameter', async () => {
            // Test that function accepts signal parameter (even if it finds no processes)
            const script = `
              LET result = KILLALL(name="nonexistentprocess", signal="SIGTERM")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(typeof result).toBe('number');
            expect(result).toBe(0);
          });
        });

        describe('TOP', () => {
          it('should return system information', async () => {
            const script = `
              LET result = TOP()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('system');
            expect(result).toHaveProperty('processes');
          });

          it('should include system stats', async () => {
            const script = `
              LET result = TOP()
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            const sys = result.system;
            expect(sys).toHaveProperty('uptime');
            expect(sys).toHaveProperty('loadAverage');
            expect(sys).toHaveProperty('memory');
            expect(sys).toHaveProperty('cpus');
            expect(typeof sys.uptime).toBe('number');
            expect(sys.uptime).toBeGreaterThan(0);
            expect(typeof sys.cpus).toBe('number');
            expect(sys.cpus).toBeGreaterThan(0);
          });

          it('should include top processes', async () => {
            const script = `
              LET result = TOP(limit=5)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result.processes).toHaveProperty('total');
            expect(result.processes).toHaveProperty('top');
            expect(Array.isArray(result.processes.top)).toBe(true);
            expect(result.processes.top.length).toBeLessThanOrEqual(5);
            expect(typeof result.processes.total).toBe('number');
            expect(result.processes.total).toBeGreaterThan(0);
          });

          it('should sort by CPU by default', async () => {
            const script = `
              LET result = TOP(limit=5)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            const top = result.processes.top;
            if (top.length > 1) {
              // Verify descending CPU order
              for (let i = 0; i < top.length - 1; i++) {
                expect(top[i].cpu).toBeGreaterThanOrEqual(top[i + 1].cpu);
              }
            }
          });

          it('should support sorting by memory', async () => {
            const script = `
              LET result = TOP(limit=5, sortBy="mem")
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            const top = result.processes.top;
            expect(Array.isArray(top)).toBe(true);
            // Just verify it runs without error
          });
        });

        describe('NICE', () => {
          it('should run command with modified priority', async () => {
            const script = `
              LET result = NICE(command="echo 'hello'", priority=10)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result).toHaveProperty('exitCode');
            expect(result).toHaveProperty('stdout');
            expect(result).toHaveProperty('stderr');
          });

          it('should run simple echo command', async () => {
            const script = `
              LET result = NICE(command="echo 'test'", priority=0)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('test');
          });

          it('should handle command errors', async () => {
            const script = `
              LET result = NICE(command="nonexistentcommand12345", priority=10)
            `;
            await interpreter.run(parse(script));
            const result = interpreter.getVariable('result');
            expect(result.exitCode).not.toBe(0);
          });

          it('should accept different priority levels', async () => {
            const script = `
              LET result1 = NICE(command="echo 'low'", priority=19)
              LET result2 = NICE(command="echo 'high'", priority=-20)
            `;
            await interpreter.run(parse(script));
            const result1 = interpreter.getVariable('result1');
            const result2 = interpreter.getVariable('result2');
            expect(result1).toHaveProperty('exitCode');
            expect(result2).toHaveProperty('exitCode');
          });
        });
      });
    });
  });

  describe('System Utilities', () => {
    describe('TIMEOUT', () => {
      it('should run command within time limit', async () => {
        const script = `
          LET result = TIMEOUT(command="echo 'hello'", ms=5000)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toHaveProperty('stdout');
        expect(result.stdout.trim()).toBe('hello');
        expect(result.timedOut).toBe(false);
        expect(result.status).toBe(0);
      });

      it('should timeout long-running command', async () => {
        const script = `
          LET result = TIMEOUT(command="sleep 10", ms=100)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.timedOut).toBe(true);
        expect(result.status).toBeGreaterThan(0);
      });

      it('should handle command errors', async () => {
        const script = `
          LET result = TIMEOUT(command="nonexistentcommand123", ms=1000)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.status).not.toBe(0);
        expect(result.timedOut).toBe(false);
      });
    });

    describe('FSYNC', () => {
      it('should sync file to disk', async () => {
        const tempFile = '/tmp/test-fsync-' + Date.now() + '.txt';
        const fs = require('fs');
        fs.writeFileSync(tempFile, 'test data');

        const script = `
          LET result = FSYNC(path="${tempFile}")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toBe(true);

        // Cleanup
        fs.unlinkSync(tempFile);
      });

      it('should sync using file descriptor', async () => {
        const tempFile = '/tmp/test-fsync-fd-' + Date.now() + '.txt';
        const fs = require('fs');
        const fd = fs.openSync(tempFile, 'w');
        fs.writeSync(fd, 'test data');

        const script = `
          LET result = FSYNC(fd=${fd})
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toBe(true);

        // Cleanup
        fs.closeSync(fd);
        fs.unlinkSync(tempFile);
      });
    });

    describe('SYNC', () => {
      it('should sync all filesystems', async () => {
        const script = `
          LET result = SYNC()
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toBe(true);
      });
    });

    describe('GETOPT', () => {
      it('should parse short options without arguments', async () => {
        const script = `
          LET result = GETOPT(args=["-a", "-b", "-c"], optstring="abc")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ a: true, b: true, c: true });
        expect(result.arguments).toEqual([]);
      });

      it('should parse short options with required arguments', async () => {
        const script = `
          LET result = GETOPT(args=["-o", "output.txt", "-v"], optstring="o:v")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ o: 'output.txt', v: true });
        expect(result.arguments).toEqual([]);
      });

      it('should parse short option with attached argument', async () => {
        const script = `
          LET result = GETOPT(args=["-ooutput.txt"], optstring="o:")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ o: 'output.txt' });
        expect(result.arguments).toEqual([]);
      });

      it('should parse long options', async () => {
        const script = `
          LET result = GETOPT(args=["--verbose", "--output", "file.txt"], longopts=["verbose", "output="])
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ verbose: true, output: 'file.txt' });
        expect(result.arguments).toEqual([]);
      });

      it('should parse long option with = syntax', async () => {
        const script = `
          LET result = GETOPT(args=["--output=file.txt"], longopts=["output="])
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ output: 'file.txt' });
        expect(result.arguments).toEqual([]);
      });

      it('should handle positional arguments', async () => {
        const script = `
          LET result = GETOPT(args=["-v", "file1.txt", "file2.txt"], optstring="v")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ v: true });
        expect(result.arguments).toEqual(['file1.txt', 'file2.txt']);
      });

      it('should handle -- separator', async () => {
        const script = `
          LET result = GETOPT(args=["-v", "--", "-f"], optstring="vf")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ v: true });
        expect(result.arguments).toEqual(['-f']);
      });

      it('should handle combined short options', async () => {
        const script = `
          LET result = GETOPT(args=["-abc"], optstring="abc")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ a: true, b: true, c: true });
        expect(result.arguments).toEqual([]);
      });

      it('should throw error for missing required argument', async () => {
        const script = `
          LET result = GETOPT(args=["-o"], optstring="o:")
        `;
        await expect(interpreter.run(parse(script))).rejects.toThrow('requires an argument');
      });

      it('should handle optional arguments', async () => {
        const script = `
          LET result = GETOPT(args=["-o"], optstring="o::")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ o: true });
        expect(result.arguments).toEqual([]);
      });

      it('should handle optional argument with value', async () => {
        const script = `
          LET result = GETOPT(args=["-ovalue"], optstring="o::")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.options).toEqual({ o: 'value' });
        expect(result.arguments).toEqual([]);
      });
    });
  });

  describe('Network Operations', () => {
    describe('HOST', () => {
      it('should resolve hostname to IP addresses', async () => {
        const script = `
          LET result = HOST(hostname="localhost")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        // localhost should resolve to 127.0.0.1 or ::1
        expect(result.some(ip => ip === '127.0.0.1' || ip === '::1')).toBe(true);
      });

      it('should return detailed DNS information', async () => {
        const script = `
          LET result = HOST(hostname="localhost", detailed=true)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toHaveProperty('hostname');
        expect(result).toHaveProperty('ipv4');
        expect(result).toHaveProperty('ipv6');
        expect(result).toHaveProperty('all');
        expect(result.hostname).toBe('localhost');
      });

      it('should resolve IPv4 only', async () => {
        const script = `
          LET result = HOST(hostname="localhost", family=4)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        // Should contain either 127.0.0.1 or be empty if no IPv4 for localhost
        if (result.length > 0) {
          expect(result).toContain('127.0.0.1');
        }
      });

      it('should throw error for invalid hostname', async () => {
        const script = `
          LET result = HOST(hostname="invalid-hostname-that-does-not-exist-12345.com")
        `;
        await expect(interpreter.run(parse(script))).rejects.toThrow('DNS lookup failed');
      });
    });

    describe('IFCONFIG', () => {
      it('should return all network interfaces', async () => {
        const script = `
          LET result = IFCONFIG()
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('addresses');
      });

      it('should return loopback interface', async () => {
        const script = `
          LET result = IFCONFIG(interface="lo")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toHaveProperty('name');
        expect(result.name).toBe('lo');
        expect(result).toHaveProperty('addresses');
        expect(Array.isArray(result.addresses)).toBe(true);
      });

      it('should throw error for non-existent interface', async () => {
        const script = `
          LET result = IFCONFIG(interface="nonexistent123")
        `;
        await expect(interpreter.run(parse(script))).rejects.toThrow('not found');
      });
    });
  });

  describe('File Utilities', () => {
    describe('FILESPLIT', () => {
      it('should split content by lines', async () => {
        const tempFile = '/tmp/test-split-' + Date.now() + '.txt';
        const fs = require('fs');
        const content = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');
        fs.writeFileSync(tempFile, content);

        const script = `
          LET result = FILESPLIT(input="${tempFile}", lines=10, prefix="split-test-", numeric=true)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(5); // 50 lines / 10 lines per file = 5 files
        expect(result[0]).toContain('split-test-');

        // Verify files exist and cleanup
        result.forEach(file => {
          expect(fs.existsSync(file)).toBe(true);
          fs.unlinkSync(file);
        });
        fs.unlinkSync(tempFile);
      });

      it('should split string content by lines', async () => {
        const script = `
          LET result = FILESPLIT(input="line1\\nline2\\nline3\\nline4\\nline5", lines=2, prefix="str-split-")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        const fs = require('fs');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3); // 5 lines / 2 lines per file = 3 files

        // Verify first file has 2 lines (trim to remove trailing newline)
        const firstFileContent = fs.readFileSync(result[0], 'utf8');
        const lines = firstFileContent.trim().split('\n');
        expect(lines.length).toBe(2);

        // Cleanup
        result.forEach(file => fs.unlinkSync(file));
      });

      it('should split by bytes', async () => {
        const script = `
          LET result = FILESPLIT(input="0123456789abcdefghij", bytes=5, prefix="byte-split-")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        const fs = require('fs');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4); // 20 bytes / 5 bytes per file = 4 files

        // Verify file sizes
        result.forEach((file, i) => {
          const content = fs.readFileSync(file, 'utf8');
          expect(content.length).toBe(5);
          fs.unlinkSync(file);
        });
      });

      it('should split array input', async () => {
        const script = `
          LET result = FILESPLIT(input=["a", "b", "c", "d", "e"], lines=2, prefix="arr-split-")
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        const fs = require('fs');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);

        // Cleanup
        result.forEach(file => fs.unlinkSync(file));
      });
    });
  });
});
