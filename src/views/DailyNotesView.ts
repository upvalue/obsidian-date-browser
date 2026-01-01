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

export class DailyNotesView extends ItemView {
  private scanner: DateNoteScanner<TFile>;
  private headingScanner: HeadingScanner<TFile>;
  private clusterize: Clusterize | null = null;
  private allItems: BrowsableItem<TFile>[] = [];
  private activeFilePath: string | null = null;

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
    this.allItems = items;
    this.allItems.sort((a, b) => {
      const cmp = b.sortKey - a.sortKey;
      if (cmp !== 0) return cmp;
      const aText = a.type === "note" ? a.file.basename : a.heading;
      const bText = b.type === "note" ? b.file.basename : b.heading;
      return aText.localeCompare(bText);
    });

    if (this.allItems.length === 0) {
      container.createDiv({
        cls: "date-browser-empty",
        text: "No notes found",
      });
      return;
    }

    // Create Clusterize structure
    const scrollArea = container.createDiv({
      cls: "clusterize-scroll",
      attr: { id: "date-browser-scroll" },
    });
    const contentArea = scrollArea.createDiv({
      cls: "clusterize-content",
      attr: { id: "date-browser-content" },
    });

    // Generate row HTML
    const rows = this.allItems.map((item, index) => this.renderItemHtml(item, index));

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

    // Use event delegation for clicks
    const handleClick = (event: MouseEvent) => {
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
    };

    contentArea.addEventListener("click", handleClick);
    contentArea.addEventListener("auxclick", handleClick);
  }

  private renderItemHtml(item: BrowsableItem<TFile>, index: number): string {
    const iconName = item.type === "heading" ? "heading" : "file-text";
    const text = item.type === "note" ? item.file.basename : item.heading;
    const escapedText = this.escapeHtml(text);

    // We'll set the icon via CSS or inline SVG
    // Using Obsidian's icon classes
    return `<div class="tree-item nav-file">
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
    const iconElements = container.querySelectorAll(".nav-file-icon[data-icon]");
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
