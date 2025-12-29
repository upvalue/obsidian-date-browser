import type { CachedMetadata, HeadingCache } from "../../src/services/HeadingScanner";
import type { FakeFile } from "./FakeVaultAdapter";

export class FakeMetadataCache {
  private caches = new Map<string, CachedMetadata>();

  setHeadings(path: string, headings: HeadingCache[]): void {
    this.caches.set(path, { headings });
  }

  getFileCache(file: FakeFile): CachedMetadata | null {
    return this.caches.get(file.path) || null;
  }
}

export function createHeading(
  heading: string,
  level: number,
  line: number
): HeadingCache {
  return {
    heading,
    level,
    position: {
      start: { line, col: 0 },
      end: { line, col: heading.length + level + 1 }, // # + space + heading
    },
  };
}
