import type { ParsedDate } from "../services/DateParser";
import type { GenericFile } from "../interfaces/VaultAdapter";

export interface HeadingItem<TFile extends GenericFile = GenericFile> {
  type: "heading";
  file: TFile;
  heading: string; // Full heading text (e.g., "2025-05-05 Hello world")
  level: number; // 1-6
  parsedDate: ParsedDate; // Always present for dated headings
  displayDate: string; // The date portion
  lineNumber: number; // 0-based line number for navigation
  sortKey: number; // For sorting with notes
}
