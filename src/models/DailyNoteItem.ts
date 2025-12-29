import type { ParsedDate } from "../services/DateParser";
import type { GenericFile } from "../interfaces/VaultAdapter";
import type { HeadingItem } from "./HeadingItem";

export interface DailyNoteItem<TFile extends GenericFile = GenericFile> {
  type: "note";
  file: TFile;
  parsedDate: ParsedDate | null; // null for undated notes
  displayDate: string; // For dated notes: originalFormat or dateString; for undated: basename
  sortKey: number; // Always present (fallback to 20000101 for undated)
}

export type BrowsableItem<TFile extends GenericFile = GenericFile> =
  | DailyNoteItem<TFile>
  | HeadingItem<TFile>;
