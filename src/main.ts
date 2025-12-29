import { Plugin } from "obsidian";
import { DailyNotesView, VIEW_TYPE_DAILY_NOTES } from "./views/DailyNotesView";

export default class DailyNotesBrowserPlugin extends Plugin {
  async onload(): Promise<void> {
    // Register the custom view
    this.registerView(VIEW_TYPE_DAILY_NOTES, (leaf) => new DailyNotesView(leaf, this));

    // Add ribbon icon to open the view
    this.addRibbonIcon("calendar", "Open Daily Notes", () => {
      this.activateView();
    });

    // Add command to open the view
    this.addCommand({
      id: "open-daily-notes-view",
      name: "Open Daily Notes view",
      callback: () => {
        this.activateView();
      },
    });

    // Register vault events to refresh the view when files change
    this.registerEvent(
      this.app.vault.on("create", () => this.refreshView())
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.refreshView())
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.refreshView())
    );

    // Refresh view when file content changes (for heading updates)
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.refreshView())
    );

    // Open view in left sidebar when layout is ready
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.app.workspace.onLayoutReady(() => this.initLeaf());
    }
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_NOTES);
  }

  private async initLeaf(): Promise<void> {
    // Only create if not already present
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    if (leaves.length === 0) {
      await this.app.workspace.getLeftLeaf(false)?.setViewState({
        type: VIEW_TYPE_DAILY_NOTES,
        active: true,
      });
    }
  }

  private async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);

    if (leaves.length === 0) {
      // Create new leaf in left sidebar
      await this.app.workspace.getLeftLeaf(false)?.setViewState({
        type: VIEW_TYPE_DAILY_NOTES,
        active: true,
      });
    }

    // Reveal and focus the view
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES)[0];
    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }

  private refreshView(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof DailyNotesView) {
        view.redraw();
      }
    }
  }
}
