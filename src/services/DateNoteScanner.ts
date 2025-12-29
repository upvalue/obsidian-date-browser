import type { DailyNoteItem } from "../models/DailyNoteItem";
import type { VaultAdapter, GenericFile } from "../interfaces/VaultAdapter";
import { parseFilenameExtended } from "./DateParser";

const FALLBACK_SORT_KEY = 20000101; // 2000-01-01 for undated notes

export class DateNoteScanner<TFile extends GenericFile = GenericFile> {
  constructor(private vault: VaultAdapter<TFile>) {}

  /**
   * Scans the vault for all markdown notes.
   * Dated notes (YYYY-MM-DD or YYYY-Www) are sorted by date descending.
   * Undated notes are sorted to the end (as 2000-01-01), then alphabetically.
   */
  scanForDailyNotes(): DailyNoteItem<TFile>[] {
    const allFiles = this.vault.getMarkdownFiles();
    const items: DailyNoteItem<TFile>[] = [];

    for (const file of allFiles) {
      const parsed = parseFilenameExtended(file.basename);
      if (parsed) {
        items.push({
          type: "note",
          file,
          parsedDate: parsed,
          displayDate: parsed.originalFormat ?? parsed.dateString,
          sortKey: parsed.sortKey,
        });
      } else {
        // Undated note - use fallback date
        items.push({
          type: "note",
          file,
          parsedDate: null,
          displayDate: file.basename,
          sortKey: FALLBACK_SORT_KEY,
        });
      }
    }

    // Sort by date descending (most recent first), then alphabetically for ties
    items.sort((a, b) => {
      const dateCompare = b.sortKey - a.sortKey;
      if (dateCompare !== 0) return dateCompare;
      return a.file.basename.localeCompare(b.file.basename);
    });

    return items;
  }
}
