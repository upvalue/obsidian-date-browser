import { DateNoteScanner } from "../src/services/DateNoteScanner";
import { FakeVaultAdapter, FakeFile } from "./fakes/FakeVaultAdapter";

describe("DateNoteScanner", () => {
  describe("scanForDailyNotes", () => {
    it("should return only files matching YYYY-MM-DD pattern", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("journal/2024-01-15.md", "2024-01-15"),
        new FakeFile("notes/Regular Note.md", "Regular Note"),
        new FakeFile("journal/2024-01-10.md", "2024-01-10"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.file.basename)).toEqual([
        "2024-01-15", // Most recent first
        "2024-01-10",
      ]);
    });

    it("should ignore directory structure", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("deep/nested/folder/2024-01-15.md", "2024-01-15"),
        new FakeFile("2024-01-10.md", "2024-01-10"),
        new FakeFile("another/path/2024-01-20.md", "2024-01-20"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(3);
      // All found regardless of directory
      expect(results.map((r) => r.file.basename)).toContain("2024-01-15");
      expect(results.map((r) => r.file.basename)).toContain("2024-01-10");
      expect(results.map((r) => r.file.basename)).toContain("2024-01-20");
    });

    it("should sort by date descending (most recent first)", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("a/2023-06-15.md", "2023-06-15"),
        new FakeFile("b/2024-12-01.md", "2024-12-01"),
        new FakeFile("c/2024-01-01.md", "2024-01-01"),
        new FakeFile("d/2023-12-31.md", "2023-12-31"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results.map((r) => r.displayDate)).toEqual([
        "2024-12-01",
        "2024-01-01",
        "2023-12-31",
        "2023-06-15",
      ]);
    });

    it("should return empty array when no matching files", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("notes/Meeting Notes.md", "Meeting Notes"),
        new FakeFile("notes/Project Ideas.md", "Project Ideas"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(0);
    });

    it("should return empty array when vault is empty", () => {
      const vault = new FakeVaultAdapter([]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(0);
    });

    it("should handle files with date prefix and additional text", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("journal/2024-01-15 Morning Standup.md", "2024-01-15 Morning Standup"),
        new FakeFile("journal/2024-01-15-daily-notes.md", "2024-01-15-daily-notes"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(2);
      // Both should have the same date extracted
      expect(results[0].displayDate).toBe("2024-01-15");
      expect(results[1].displayDate).toBe("2024-01-15");
    });

    it("should include file reference in results", () => {
      const file = new FakeFile("journal/2024-01-15.md", "2024-01-15");
      const vault = new FakeVaultAdapter([file]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results[0].file).toBe(file);
      expect(results[0].file.path).toBe("journal/2024-01-15.md");
    });
  });
});
