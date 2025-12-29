import { ItemView, WorkspaceLeaf, TFile, Keymap, MarkdownView, setIcon } from "obsidian";
import type DailyNotesBrowserPlugin from "../main";
import { DateNoteScanner } from "../services/DateNoteScanner";
import { HeadingScanner } from "../services/HeadingScanner";
import { ObsidianVaultAdapter } from "../interfaces/VaultAdapter";
import type { BrowsableItem } from "../models/DailyNoteItem";
import type { HeadingItem } from "../models/HeadingItem";

export const VIEW_TYPE_DAILY_NOTES = "daily-notes-view";

export class DailyNotesView extends ItemView {
  private scanner: DateNoteScanner<TFile>;
  private headingScanner: HeadingScanner<TFile>;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: DailyNotesBrowserPlugin
  ) {
    super(leaf);
    this.scanner = new DateNoteScanner(new ObsidianVaultAdapter(this.app.vault));
    this.headingScanner = new HeadingScanner(
      () => this.app.vault.getMarkdownFiles(),
      (file) => this.app.metadataCache.getFileCache(file)
    );
  }

  getViewType(): string {
    return VIEW_TYPE_DAILY_NOTES;
  }

  getDisplayText(): string {
    return "Daily Notes";
  }

  getIcon(): string {
    return "calendar";
  }

  async onOpen(): Promise<void> {
    await this.redraw();
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  async redraw(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("daily-notes-container");

    const notes = this.scanner.scanForDailyNotes();
    const headings = this.headingScanner.scanForDatedHeadings();

    // Merge and sort by sortKey descending, then alphabetically
    const allItems: BrowsableItem<TFile>[] = [...notes, ...headings];
    allItems.sort((a, b) => {
      const cmp = b.sortKey - a.sortKey;
      if (cmp !== 0) return cmp;
      // For ties, sort by display text
      const aText = a.type === "note" ? a.file.basename : a.heading;
      const bText = b.type === "note" ? b.file.basename : b.heading;
      return aText.localeCompare(bText);
    });

    if (allItems.length === 0) {
      container.createDiv({
        cls: "daily-notes-empty",
        text: "No notes found",
      });
      return;
    }

    const navContainer = container.createDiv({ cls: "nav-files-container" });

    for (const item of allItems) {
      this.renderItem(navContainer, item);
    }
  }

  private renderItem(container: HTMLElement, item: BrowsableItem<TFile>): void {
    const navFile = container.createDiv({ cls: "tree-item nav-file" });
    const navFileTitle = navFile.createDiv({
      cls: "tree-item-self nav-file-title is-clickable",
    });

    // Icon for item type
    const iconEl = navFileTitle.createSpan({ cls: "nav-file-icon" });
    setIcon(iconEl, item.type === "heading" ? "heading" : "file-text");

    // Display text: basename for notes, heading text for headings
    navFileTitle.createSpan({
      cls: "tree-item-inner nav-file-title-content",
      text: item.type === "note" ? item.file.basename : item.heading,
    });

    navFileTitle.addEventListener("click", (event: MouseEvent) => {
      const newLeaf = Keymap.isModEvent(event);
      if (item.type === "heading") {
        this.openHeading(item, newLeaf);
      } else {
        this.openFile(item.file, newLeaf);
      }
    });

    // Add context menu on right-click
    navFileTitle.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      // Could add custom context menu here in the future
    });
  }

  private openFile(file: TFile, newLeaf: boolean): void {
    const leaf = newLeaf
      ? this.app.workspace.getLeaf("tab")
      : this.app.workspace.getMostRecentLeaf();

    if (leaf) {
      leaf.openFile(file);
    }
  }

  private async openHeading(
    item: HeadingItem<TFile>,
    newLeaf: boolean
  ): Promise<void> {
    const leaf = newLeaf
      ? this.app.workspace.getLeaf("tab")
      : this.app.workspace.getMostRecentLeaf();

    if (leaf) {
      await leaf.openFile(item.file);

      // Scroll to heading line after file is open
      if (leaf.view instanceof MarkdownView) {
        leaf.view.editor.scrollIntoView(
          {
            from: { line: item.lineNumber, ch: 0 },
            to: { line: item.lineNumber, ch: 0 },
          },
          true
        );
      }
    }
  }
}
