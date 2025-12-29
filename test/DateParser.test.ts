import {
  parseFilename,
  parseHeading,
  parseWeeklyDate,
  parseFilenameExtended,
  sundayOfWeek,
  ParsedDate,
} from "../src/services/DateParser";

describe("DateParser", () => {
  describe("parseFilename", () => {
    it("should parse valid YYYY-MM-DD at start of filename", () => {
      const result = parseFilename("2024-01-15 Meeting Notes");
      expect(result).toEqual({
        year: 2024,
        month: 1,
        day: 15,
        dateString: "2024-01-15",
        sortKey: 20240115,
      });
    });

    it("should parse filename with just the date", () => {
      const result = parseFilename("2024-01-15");
      expect(result).not.toBeNull();
      expect(result?.dateString).toBe("2024-01-15");
    });

    it("should parse filename with date and hyphenated suffix", () => {
      const result = parseFilename("2024-01-15-daily-standup");
      expect(result).not.toBeNull();
      expect(result?.dateString).toBe("2024-01-15");
    });

    it("should return null for non-date filenames", () => {
      expect(parseFilename("Meeting Notes")).toBeNull();
      expect(parseFilename("notes-2024-01-15")).toBeNull();
      expect(parseFilename("random text")).toBeNull();
    });

    it("should return null for partial dates", () => {
      expect(parseFilename("2024-01")).toBeNull();
      expect(parseFilename("2024")).toBeNull();
    });

    it("should reject invalid months", () => {
      expect(parseFilename("2024-13-01")).toBeNull();
      expect(parseFilename("2024-00-01")).toBeNull();
    });

    it("should reject invalid days", () => {
      expect(parseFilename("2024-01-00")).toBeNull();
      expect(parseFilename("2024-01-32")).toBeNull();
    });

    it("should handle edge case valid dates", () => {
      expect(parseFilename("2024-02-29")).not.toBeNull(); // Leap year
      expect(parseFilename("2024-12-31")).not.toBeNull();
      expect(parseFilename("2024-01-01")).not.toBeNull();
    });

    it("should produce correct sort keys for ordering", () => {
      const dates = [
        parseFilename("2024-01-15")!,
        parseFilename("2023-12-31")!,
        parseFilename("2024-02-01")!,
      ];

      const sorted = dates.sort((a, b) => b.sortKey - a.sortKey);

      expect(sorted[0].dateString).toBe("2024-02-01");
      expect(sorted[1].dateString).toBe("2024-01-15");
      expect(sorted[2].dateString).toBe("2023-12-31");
    });
  });

  describe("parseHeading", () => {
    it("should parse date from heading text", () => {
      const result = parseHeading("2024-01-15 Team Sync");
      expect(result).not.toBeNull();
      expect(result?.dateString).toBe("2024-01-15");
    });

    it("should return null for headings without dates", () => {
      expect(parseHeading("Team Sync Meeting")).toBeNull();
      expect(parseHeading("Notes from January")).toBeNull();
    });
  });

  describe("sundayOfWeek", () => {
    it("should compute Sunday of week 52 in 2025 as Dec 28", () => {
      const result = sundayOfWeek(2025, 52);
      expect(result).toEqual({ year: 2025, month: 12, day: 28 });
    });

    it("should compute Sunday of week 1 in 2025 as Jan 5", () => {
      // 2025-01-01 is Wednesday, so first Sunday is Jan 5
      const result = sundayOfWeek(2025, 1);
      expect(result).toEqual({ year: 2025, month: 1, day: 5 });
    });

    it("should handle year boundary - late weeks can span into next year", () => {
      // Week 53 of 2025 would start Jan 4, 2026
      const result = sundayOfWeek(2025, 53);
      expect(result.year).toBe(2026);
    });

    it("should handle year where Jan 1 is Sunday", () => {
      // 2023-01-01 is a Sunday
      const result = sundayOfWeek(2023, 1);
      expect(result).toEqual({ year: 2023, month: 1, day: 1 });
    });
  });

  describe("parseWeeklyDate", () => {
    it("should parse YYYY-Www format at start of string", () => {
      const result = parseWeeklyDate("2025-W52 Weekly Review");
      expect(result).not.toBeNull();
      expect(result?.originalFormat).toBe("2025-W52");
      expect(result?.dateString).toBe("2025-12-28");
      expect(result?.sortKey).toBe(20251228);
    });

    it("should parse single-digit week numbers", () => {
      const result = parseWeeklyDate("2025-W1");
      expect(result).not.toBeNull();
      expect(result?.originalFormat).toBe("2025-W1");
    });

    it("should return null for invalid week numbers", () => {
      expect(parseWeeklyDate("2025-W0")).toBeNull();
      expect(parseWeeklyDate("2025-W54")).toBeNull();
    });

    it("should return null for non-weekly formats", () => {
      expect(parseWeeklyDate("2025-01-15")).toBeNull();
      expect(parseWeeklyDate("Meeting Notes")).toBeNull();
    });
  });

  describe("parseFilenameExtended", () => {
    it("should parse daily format first", () => {
      const result = parseFilenameExtended("2024-01-15 Notes");
      expect(result).not.toBeNull();
      expect(result?.dateString).toBe("2024-01-15");
      expect(result?.originalFormat).toBeUndefined();
    });

    it("should fall back to weekly format", () => {
      const result = parseFilenameExtended("2025-W52 Review");
      expect(result).not.toBeNull();
      expect(result?.originalFormat).toBe("2025-W52");
    });

    it("should return null for non-matching strings", () => {
      expect(parseFilenameExtended("Meeting Notes")).toBeNull();
      expect(parseFilenameExtended("Random Text")).toBeNull();
    });

    it("should prefer daily format when both could match", () => {
      // 2024-01-15 is clearly daily, not weekly
      const result = parseFilenameExtended("2024-01-15");
      expect(result?.originalFormat).toBeUndefined();
    });
  });
});
