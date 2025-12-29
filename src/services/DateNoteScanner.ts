import type { DailyNoteItem } from "../models/DailyNoteItem";
import type { VaultAdapter, GenericFile } from "../interfaces/VaultAdapter";
import { parseFilename } from "./DateParser";

export class DateNoteScanner<TFile extends GenericFile = GenericFile> {
  constructor(private vault: VaultAdapter<TFile>) {}

  /**
   * Scans the vault for notes with YYYY-MM-DD filename prefixes.
   * Returns them sorted by date descending (most recent first).
   */
  scanForDailyNotes(): DailyNoteItem<TFile>[] {
    const allFiles = this.vault.getMarkdownFiles();
    const dailyNotes: DailyNoteItem<TFile>[] = [];

    for (const file of allFiles) {
      const parsed = parseFilename(file.basename);
      if (parsed) {
        dailyNotes.push({
          file,
          parsedDate: parsed,
          displayDate: parsed.dateString,
        });
      }
    }

    // Sort by date descending (most recent first)
    dailyNotes.sort((a, b) => b.parsedDate.sortKey - a.parsedDate.sortKey);

    return dailyNotes;
  }
}
