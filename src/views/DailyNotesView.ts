import { ItemView, WorkspaceLeaf, TFile, Keymap } from "obsidian";
import type DailyNotesBrowserPlugin from "../main";
import { DateNoteScanner } from "../services/DateNoteScanner";
import { ObsidianVaultAdapter } from "../interfaces/VaultAdapter";
import type { DailyNoteItem } from "../models/DailyNoteItem";

export const VIEW_TYPE_DAILY_NOTES = "daily-notes-view";

export class DailyNotesView extends ItemView {
  private scanner: DateNoteScanner<TFile>;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: DailyNotesBrowserPlugin
  ) {
    super(leaf);
    this.scanner = new DateNoteScanner(new ObsidianVaultAdapter(this.app.vault));
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

    const items = this.scanner.scanForDailyNotes();

    if (items.length === 0) {
      container.createDiv({
        cls: "daily-notes-empty",
        text: "No notes found with YYYY-MM-DD prefix",
      });
      return;
    }

    const navContainer = container.createDiv({ cls: "nav-files-container" });

    for (const item of items) {
      this.renderNoteItem(navContainer, item);
    }
  }

  private renderNoteItem(container: HTMLElement, item: DailyNoteItem<TFile>): void {
    const navFile = container.createDiv({ cls: "tree-item nav-file" });
    const navFileTitle = navFile.createDiv({
      cls: "tree-item-self nav-file-title is-clickable",
    });

    // Show the full basename, not just the date
    navFileTitle.createSpan({
      cls: "tree-item-inner nav-file-title-content",
      text: item.file.basename,
    });

    navFileTitle.addEventListener("click", (event: MouseEvent) => {
      const newLeaf = Keymap.isModEvent(event);
      this.openFile(item.file, newLeaf);
    });

    // Add context menu on right-click
    navFileTitle.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      const menu = this.app.workspace.getLeaf().view?.app?.workspace;
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
}
