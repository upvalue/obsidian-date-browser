import { ItemView, WorkspaceLeaf, TFile, Keymap, MarkdownView, setIcon } from "obsidian";
import Clusterize from "clusterize.js";
import type DailyNotesBrowserPlugin from "../main";
import { DateNoteScanner } from "../services/DateNoteScanner";
import { HeadingScanner } from "../services/HeadingScanner";
import { ObsidianVaultAdapter } from "../interfaces/VaultAdapter";
import type { BrowsableItem } from "../models/DailyNoteItem";
import type { HeadingItem } from "../models/HeadingItem";

export const VIEW_TYPE_DATE_BROWSER = "date-browser-view";

// Feature flags for item types
const SHOW_DATED_NOTES = true;
const SHOW_HEADINGS = true;
const SHOW_UNDATED_NOTES = false;

// Patterns for pinned items
const WEEKLY_NOTE_PATTERN = /^\d{4}-W\d{1,2}/;
const CYCLE_HEADING_PATTERN = /^\d{4}-\d{2}-\d{2} \d+W Cycle \d+/;

export class DailyNotesView extends ItemView {
  private scanner: DateNoteScanner<TFile>;
  private headingScanner: HeadingScanner<TFile>;
  private clusterize: Clusterize | null = null;
  private allItems: BrowsableItem<TFile>[] = [];
  private activeFilePath: string | null = null;
  private pinnedIndices: Set<number> = new Set();

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
    return VIEW_TYPE_DATE_BROWSER;
  }

  getDisplayText(): string {
    return "Date Browser";
  }

  getIcon(): string {
    return "calendar";
  }

  async onOpen(): Promise<void> {
    // Track active file changes
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const file = leaf?.view instanceof MarkdownView ? leaf.view.file : null;
        this.activeFilePath = file?.path ?? null;
        this.updateActiveHighlight();
      })
    );

    // Initialize active file
    const activeFile = this.app.workspace.getActiveFile();
    this.activeFilePath = activeFile?.path ?? null;

    setTimeout(() => this.redraw(), 0);
  }

  // Called when view is resized or becomes visible again (e.g., after idle)
  onResize(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    const hasContent = container?.querySelector(".clusterize-scroll") !== null ||
                       container?.querySelector(".date-browser-empty") !== null;

    if (!hasContent) {
      // Content missing entirely - full redraw needed
      this.redraw();
    } else if (this.clusterize) {
      // Content exists - quick refresh to ensure visible items are rendered
      this.clusterize.refresh();
    }
  }

  async onClose(): Promise<void> {
    if (this.clusterize) {
      this.clusterize.destroy(true);
      this.clusterize = null;
    }
  }

  async redraw(): Promise<void> {
    // Cleanup previous instance
    if (this.clusterize) {
      this.clusterize.destroy(true);
      this.clusterize = null;
    }

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("date-browser-container");

    // Collect items based on feature flags
    let items: BrowsableItem<TFile>[] = [];

    if (SHOW_DATED_NOTES || SHOW_UNDATED_NOTES) {
      const notes = this.scanner.scanForDailyNotes();
      for (const note of notes) {
        const isDated = note.parsedDate !== null;
        if ((isDated && SHOW_DATED_NOTES) || (!isDated && SHOW_UNDATED_NOTES)) {
          items.push(note);
        }
      }
    }

    if (SHOW_HEADINGS) {
      const headings = this.headingScanner.scanForDatedHeadings();
      items = items.concat(headings);
    }

    // Sort by sortKey descending, then alphabetically
    items.sort((a, b) => {
      const cmp = b.sortKey - a.sortKey;
      if (cmp !== 0) return cmp;
      const aText = a.type === "note" ? a.file.basename : a.heading;
      const bText = b.type === "note" ? b.file.basename : b.heading;
      return aText.localeCompare(bText);
    });

    // Find pinned items in a single pass (most recent of each type)
    // Items are already sorted by sortKey descending, so first match = most recent
    const pinnedItems: BrowsableItem<TFile>[] = [];
    const regularItems: BrowsableItem<TFile>[] = [];
    this.pinnedIndices.clear();

    let foundWeekly = false;
    let foundCycle = false;

    for (const item of items) {
      let isPinned = false;

      if (!foundWeekly && item.type === "note" &&
          item.parsedDate?.originalFormat &&
          WEEKLY_NOTE_PATTERN.test(item.parsedDate.originalFormat)) {
        foundWeekly = true;
        isPinned = true;
      }

      if (!foundCycle && item.type === "heading" &&
          CYCLE_HEADING_PATTERN.test(item.heading)) {
        foundCycle = true;
        isPinned = true;
      }

      if (isPinned) {
        this.pinnedIndices.add(pinnedItems.length);
        pinnedItems.push(item);
      } else {
        regularItems.push(item);
      }
    }

    // Store all items (pinned indices are 0-based into pinnedItems, rest offset by pinnedItems.length)
    this.allItems = [...pinnedItems, ...regularItems];

    if (this.allItems.length === 0) {
      container.createDiv({
        cls: "date-browser-empty",
        text: "No notes found",
      });
      return;
    }

    // Render pinned items in a fixed header (outside Clusterize)
    if (pinnedItems.length > 0) {
      const pinnedArea = container.createDiv({ cls: "date-browser-pinned" });
      for (let i = 0; i < pinnedItems.length; i++) {
        pinnedArea.insertAdjacentHTML(
          "beforeend",
          this.renderItemHtml(pinnedItems[i], i)
        );
      }
      this.populateIcons(pinnedArea);
      container.createDiv({ cls: "date-browser-separator" });

      // Click handler for pinned area
      pinnedArea.addEventListener("click", (event: MouseEvent) =>
        this.handleItemClick(event)
      );
      pinnedArea.addEventListener("auxclick", (event: MouseEvent) =>
        this.handleItemClick(event)
      );
    }

    // Create Clusterize structure for regular items
    const scrollArea = container.createDiv({
      cls: "clusterize-scroll",
      attr: { id: "date-browser-scroll" },
    });
    const contentArea = scrollArea.createDiv({
      cls: "clusterize-content",
      attr: { id: "date-browser-content" },
    });

    // Generate row HTML for regular items only (indices offset by pinned count)
    const rows = regularItems.map((item, i) =>
      this.renderItemHtml(item, pinnedItems.length + i)
    );

    // Initialize Clusterize
    this.clusterize = new Clusterize({
      rows,
      scrollElem: scrollArea,
      contentElem: contentArea,
      rows_in_block: 20,
      blocks_in_cluster: 4,
      tag: "div",
      no_data_text: "No notes found",
      callbacks: {
        clusterChanged: () => {
          this.populateIcons(contentArea);
          this.updateActiveHighlight();
        },
      },
    });

    // Initial icon population and highlighting
    this.populateIcons(contentArea);
    this.updateActiveHighlight();

    // Use event delegation for clicks on Clusterize content
    contentArea.addEventListener("click", (event: MouseEvent) =>
      this.handleItemClick(event)
    );
    contentArea.addEventListener("auxclick", (event: MouseEvent) =>
      this.handleItemClick(event)
    );
  }

  private handleItemClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const row = target.closest(".nav-file-title") as HTMLElement;
    if (!row) return;

    const indexStr = row.dataset.index;
    if (indexStr === undefined) return;

    const index = parseInt(indexStr, 10);
    const item = this.allItems[index];
    if (!item) return;

    const newLeaf = Keymap.isModEvent(event) || event.button === 1;
    if (item.type === "heading") {
      this.openHeading(item, newLeaf);
    } else {
      this.openFile(item.file, newLeaf);
    }
  }

  private renderItemHtml(item: BrowsableItem<TFile>, index: number): string {
    const iconName = item.type === "heading" ? "heading" : "file-text";
    const text = item.type === "note" ? item.file.basename : item.heading;
    const escapedText = this.escapeHtml(text);
    const isPinned = this.pinnedIndices.has(index);
    const pinnedClass = isPinned ? " is-pinned" : "";

    return `<div class="tree-item nav-file${pinnedClass}">
      <div class="tree-item-self nav-file-title is-clickable" data-index="${index}">
        <span class="nav-file-icon" data-icon="${iconName}"></span>
        <span class="tree-item-inner nav-file-title-content">${escapedText}</span>
      </div>
    </div>`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private populateIcons(container: HTMLElement): void {
    const iconElements = container.querySelectorAll("[data-icon]");
    iconElements.forEach((el) => {
      const iconName = el.getAttribute("data-icon");
      if (iconName && el.children.length === 0) {
        setIcon(el as HTMLElement, iconName);
      }
    });
  }

  private updateActiveHighlight(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    const rows = container?.querySelectorAll(".nav-file-title[data-index]");
    if (!rows) return;

    rows.forEach((row) => {
      const indexStr = row.getAttribute("data-index");
      if (indexStr === null) return;

      const index = parseInt(indexStr, 10);
      const item = this.allItems[index];
      if (!item) return;

      const isActive = item.file.path === this.activeFilePath;
      row.classList.toggle("is-active", isActive);
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
