import { HeadingScanner } from "../src/services/HeadingScanner";
import { FakeFile } from "./fakes/FakeVaultAdapter";
import { FakeMetadataCache, createHeading } from "./fakes/FakeMetadataCache";

describe("HeadingScanner", () => {
  describe("scanForDatedHeadings", () => {
    it("should extract YYYY-MM-DD headings from cache", () => {
      const files = [new FakeFile("notes/journal.md", "journal")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/journal.md", [
        createHeading("2024-01-15 Morning standup", 1, 0),
        createHeading("2024-01-15 Afternoon review", 2, 10),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(2);
      expect(results[0].heading).toBe("2024-01-15 Morning standup");
      expect(results[0].displayDate).toBe("2024-01-15");
      expect(results[0].type).toBe("heading");
      expect(results[1].heading).toBe("2024-01-15 Afternoon review");
    });

    it("should ignore non-dated headings", () => {
      const files = [new FakeFile("notes/readme.md", "readme")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/readme.md", [
        createHeading("Introduction", 1, 0),
        createHeading("2024-01-15 Dated section", 2, 5),
        createHeading("Conclusion", 1, 20),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(1);
      expect(results[0].heading).toBe("2024-01-15 Dated section");
    });

    it("should handle all heading levels (H1-H6)", () => {
      const files = [new FakeFile("notes/test.md", "test")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/test.md", [
        createHeading("2024-01-01 H1", 1, 0),
        createHeading("2024-01-02 H2", 2, 5),
        createHeading("2024-01-03 H3", 3, 10),
        createHeading("2024-01-04 H4", 4, 15),
        createHeading("2024-01-05 H5", 5, 20),
        createHeading("2024-01-06 H6", 6, 25),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(6);
      expect(results.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should return empty for files with no cache", () => {
      const files = [new FakeFile("notes/empty.md", "empty")];
      const cache = new FakeMetadataCache();
      // No cache set for this file

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(0);
    });

    it("should return empty for files with no headings in cache", () => {
      const files = [new FakeFile("notes/noheadings.md", "noheadings")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/noheadings.md", []);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(0);
    });

    it("should NOT parse weekly format in headings", () => {
      const files = [new FakeFile("notes/weekly.md", "weekly")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/weekly.md", [
        createHeading("2025-W52 Weekly review", 1, 0),
        createHeading("2024-01-15 Daily note", 1, 10),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      // Only the daily format should match
      expect(results).toHaveLength(1);
      expect(results[0].heading).toBe("2024-01-15 Daily note");
    });

    it("should include correct line numbers for navigation", () => {
      const files = [new FakeFile("notes/test.md", "test")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/test.md", [
        createHeading("2024-01-15 First", 1, 0),
        createHeading("2024-01-16 Second", 2, 42),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results[0].lineNumber).toBe(0);
      expect(results[1].lineNumber).toBe(42);
    });

    it("should include file reference in results", () => {
      const file = new FakeFile("notes/journal.md", "journal");
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/journal.md", [
        createHeading("2024-01-15 Entry", 1, 0),
      ]);

      const scanner = new HeadingScanner(
        () => [file],
        (f) => cache.getFileCache(f)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results[0].file).toBe(file);
      expect(results[0].file.path).toBe("notes/journal.md");
    });

    it("should scan headings from multiple files", () => {
      const files = [
        new FakeFile("notes/a.md", "a"),
        new FakeFile("notes/b.md", "b"),
      ];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/a.md", [createHeading("2024-01-15 From A", 1, 0)]);
      cache.setHeadings("notes/b.md", [createHeading("2024-01-16 From B", 1, 0)]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.heading)).toContain("2024-01-15 From A");
      expect(results.map((r) => r.heading)).toContain("2024-01-16 From B");
    });

    it("should generate correct sortKey for ordering", () => {
      const files = [new FakeFile("notes/test.md", "test")];
      const cache = new FakeMetadataCache();
      cache.setHeadings("notes/test.md", [
        createHeading("2024-01-15 Entry", 1, 0),
      ]);

      const scanner = new HeadingScanner(
        () => files,
        (file) => cache.getFileCache(file)
      );
      const results = scanner.scanForDatedHeadings();

      expect(results[0].sortKey).toBe(20240115);
    });
  });
});
