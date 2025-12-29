import { DateNoteScanner } from "../src/services/DateNoteScanner";
import { FakeVaultAdapter, FakeFile } from "./fakes/FakeVaultAdapter";

describe("DateNoteScanner", () => {
  describe("scanForDailyNotes", () => {
    it("should return all files, with dated ones first and undated at end", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("journal/2024-01-15.md", "2024-01-15"),
        new FakeFile("notes/Regular Note.md", "Regular Note"),
        new FakeFile("journal/2024-01-10.md", "2024-01-10"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.file.basename)).toEqual([
        "2024-01-15", // Most recent first
        "2024-01-10",
        "Regular Note", // Undated at end
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

    it("should include undated files sorted alphabetically", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("notes/Meeting Notes.md", "Meeting Notes"),
        new FakeFile("notes/Project Ideas.md", "Project Ideas"),
        new FakeFile("notes/Agenda.md", "Agenda"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(3);
      // Alphabetically sorted since all have same fallback date
      expect(results.map((r) => r.file.basename)).toEqual([
        "Agenda",
        "Meeting Notes",
        "Project Ideas",
      ]);
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

    it("should parse weekly notes and sort them with daily notes", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("weekly/2025-W52.md", "2025-W52"),
        new FakeFile("daily/2025-12-30.md", "2025-12-30"),
        new FakeFile("daily/2025-12-25.md", "2025-12-25"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(3);
      // 2025-12-30 > 2025-W52 (Dec 28) > 2025-12-25
      expect(results.map((r) => r.displayDate)).toEqual([
        "2025-12-30",
        "2025-W52", // Shows original format, sorts as Dec 28
        "2025-12-25",
      ]);
    });

    it("should display weekly notes in original format", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("weekly/2025-W52 Review.md", "2025-W52 Review"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results[0].displayDate).toBe("2025-W52");
      expect(results[0].parsedDate?.originalFormat).toBe("2025-W52");
    });

    it("should set parsedDate to null for undated notes", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("notes/Random Note.md", "Random Note"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results[0].parsedDate).toBeNull();
      expect(results[0].displayDate).toBe("Random Note");
      expect(results[0].sortKey).toBe(20000101);
    });

    it("should sort alphabetically when dates are equal", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("a/2024-01-15 Zebra.md", "2024-01-15 Zebra"),
        new FakeFile("b/2024-01-15 Apple.md", "2024-01-15 Apple"),
        new FakeFile("c/2024-01-15 Mango.md", "2024-01-15 Mango"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      // Same date, so alphabetically by basename
      expect(results.map((r) => r.file.basename)).toEqual([
        "2024-01-15 Apple",
        "2024-01-15 Mango",
        "2024-01-15 Zebra",
      ]);
    });

    it("should handle mixed daily, weekly, and undated notes", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("a/2024-01-15.md", "2024-01-15"),
        new FakeFile("b/2025-W01.md", "2025-W01"),
        new FakeFile("c/Random Note.md", "Random Note"),
        new FakeFile("d/Another Note.md", "Another Note"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(4);
      expect(results.map((r) => r.displayDate)).toEqual([
        "2025-W01", // Jan 5, 2025
        "2024-01-15",
        "Another Note", // Undated, alphabetically first
        "Random Note", // Undated, alphabetically second
      ]);
    });

    it("should include type discriminator on all items", () => {
      const vault = new FakeVaultAdapter([
        new FakeFile("a/2024-01-15.md", "2024-01-15"),
        new FakeFile("b/Random Note.md", "Random Note"),
      ]);

      const scanner = new DateNoteScanner(vault);
      const results = scanner.scanForDailyNotes();

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe("note");
      expect(results[1].type).toBe("note");
    });
  });
});
