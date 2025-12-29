import type { HeadingItem } from "../models/HeadingItem";
import type { GenericFile } from "../interfaces/VaultAdapter";
import { parseHeading } from "./DateParser";

export interface HeadingCache {
  heading: string;
  level: number;
  position: {
    start: { line: number; col: number };
    end: { line: number; col: number };
  };
}

export interface CachedMetadata {
  headings?: HeadingCache[];
}

export class HeadingScanner<TFile extends GenericFile = GenericFile> {
  constructor(
    private getFiles: () => TFile[],
    private getCache: (file: TFile) => CachedMetadata | null
  ) {}

  /**
   * Scans all files for headings that start with YYYY-MM-DD format.
   * Uses metadata cache for performance (no file I/O).
   */
  scanForDatedHeadings(): HeadingItem<TFile>[] {
    const items: HeadingItem<TFile>[] = [];

    for (const file of this.getFiles()) {
      const cache = this.getCache(file);
      if (!cache?.headings) continue;

      for (const h of cache.headings) {
        const parsed = parseHeading(h.heading);
        if (parsed) {
          items.push({
            type: "heading",
            file,
            heading: h.heading,
            level: h.level,
            parsedDate: parsed,
            displayDate: parsed.dateString,
            lineNumber: h.position.start.line,
            sortKey: parsed.sortKey,
          });
        }
      }
    }

    return items;
  }
}
