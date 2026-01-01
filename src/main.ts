import { Plugin } from "obsidian";
import { DailyNotesView, VIEW_TYPE_DATE_BROWSER } from "./views/DailyNotesView";

export default class DailyNotesBrowserPlugin extends Plugin {
  async onload(): Promise<void> {
    // Register the custom view
    this.registerView(VIEW_TYPE_DATE_BROWSER, (leaf) => new DailyNotesView(leaf, this));

    // Add ribbon icon to open the view
    this.addRibbonIcon("calendar", "Open Date Browser", () => {
      this.activateView();
    });

    // Add command to open the view
    this.addCommand({
      id: "open-date-browser-view",
      name: "Open Date Browser view",
      callback: () => {
        this.activateView();
      },
    });

    // Open view in left sidebar when layout is ready
    // Defer event registration to avoid startup spam
    const onReady = () => {
      this.initLeaf();

      this.registerEvent(
        this.app.vault.on("create", () => this.refreshView())
      );
      this.registerEvent(
        this.app.vault.on("delete", () => this.refreshView())
      );
      this.registerEvent(
        this.app.vault.on("rename", () => this.refreshView())
      );
      this.registerEvent(
        this.app.metadataCache.on("changed", () => this.refreshView())
      );

      // Refresh when window regains focus (e.g., after long idle)
      this.registerDomEvent(window, "focus", () => this.refreshView());
    };

    if (this.app.workspace.layoutReady) {
      onReady();
    } else {
      this.app.workspace.onLayoutReady(() => onReady());
    }
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DATE_BROWSER);
  }

  private async initLeaf(): Promise<void> {
    // Only create if not already present
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);
    if (leaves.length === 0) {
      await this.app.workspace.getLeftLeaf(false)?.setViewState({
        type: VIEW_TYPE_DATE_BROWSER,
        active: true,
      });
    }
  }

  private async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);

    if (leaves.length === 0) {
      // Create new leaf in left sidebar
      await this.app.workspace.getLeftLeaf(false)?.setViewState({
        type: VIEW_TYPE_DATE_BROWSER,
        active: true,
      });
    }

    // Reveal and focus the view
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER)[0];
    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }

  private refreshView(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof DailyNotesView) {
        view.redraw();
      }
    }
  }
}
