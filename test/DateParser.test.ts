import { parseFilename, parseHeading, ParsedDate } from "../src/services/DateParser";

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
});
