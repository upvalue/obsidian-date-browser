var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DailyNotesBrowserPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/views/DailyNotesView.ts
var import_obsidian = require("obsidian");

// src/services/DateParser.ts
var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
function parseDate(input) {
  const match = input.match(DATE_PATTERN);
  if (!match)
    return null;
  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (month < 1 || month > 12)
    return null;
  if (day < 1 || day > 31)
    return null;
  return {
    year,
    month,
    day,
    dateString: `${yearStr}-${monthStr}-${dayStr}`,
    sortKey: year * 1e4 + month * 100 + day
  };
}
function parseFilename(filename) {
  return parseDate(filename);
}

// src/services/DateNoteScanner.ts
var DateNoteScanner = class {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Scans the vault for notes with YYYY-MM-DD filename prefixes.
   * Returns them sorted by date descending (most recent first).
   */
  scanForDailyNotes() {
    const allFiles = this.vault.getMarkdownFiles();
    const dailyNotes = [];
    for (const file of allFiles) {
      const parsed = parseFilename(file.basename);
      if (parsed) {
        dailyNotes.push({
          file,
          parsedDate: parsed,
          displayDate: parsed.dateString
        });
      }
    }
    dailyNotes.sort((a, b) => b.parsedDate.sortKey - a.parsedDate.sortKey);
    return dailyNotes;
  }
};

// src/interfaces/VaultAdapter.ts
var ObsidianVaultAdapter = class {
  constructor(vault) {
    this.vault = vault;
  }
  getMarkdownFiles() {
    return this.vault.getMarkdownFiles();
  }
  async readFile(file) {
    return await this.vault.cachedRead(file);
  }
};

// src/views/DailyNotesView.ts
var VIEW_TYPE_DAILY_NOTES = "daily-notes-view";
var DailyNotesView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.scanner = new DateNoteScanner(new ObsidianVaultAdapter(this.app.vault));
  }
  getViewType() {
    return VIEW_TYPE_DAILY_NOTES;
  }
  getDisplayText() {
    return "Daily Notes";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    await this.redraw();
  }
  async onClose() {
  }
  async redraw() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("daily-notes-container");
    const items = this.scanner.scanForDailyNotes();
    if (items.length === 0) {
      container.createDiv({
        cls: "daily-notes-empty",
        text: "No notes found with YYYY-MM-DD prefix"
      });
      return;
    }
    const navContainer = container.createDiv({ cls: "nav-files-container" });
    for (const item of items) {
      this.renderNoteItem(navContainer, item);
    }
  }
  renderNoteItem(container, item) {
    const navFile = container.createDiv({ cls: "tree-item nav-file" });
    const navFileTitle = navFile.createDiv({
      cls: "tree-item-self nav-file-title is-clickable"
    });
    navFileTitle.createSpan({
      cls: "tree-item-inner nav-file-title-content",
      text: item.file.basename
    });
    navFileTitle.addEventListener("click", (event) => {
      const newLeaf = import_obsidian.Keymap.isModEvent(event);
      this.openFile(item.file, newLeaf);
    });
    navFileTitle.addEventListener("contextmenu", (event) => {
      var _a, _b;
      event.preventDefault();
      const menu = (_b = (_a = this.app.workspace.getLeaf().view) == null ? void 0 : _a.app) == null ? void 0 : _b.workspace;
    });
  }
  openFile(file, newLeaf) {
    const leaf = newLeaf ? this.app.workspace.getLeaf("tab") : this.app.workspace.getMostRecentLeaf();
    if (leaf) {
      leaf.openFile(file);
    }
  }
};

// src/main.ts
var DailyNotesBrowserPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_DAILY_NOTES, (leaf) => new DailyNotesView(leaf, this));
    this.addRibbonIcon("calendar", "Open Daily Notes", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-daily-notes-view",
      name: "Open Daily Notes view",
      callback: () => {
        this.activateView();
      }
    });
    this.registerEvent(
      this.app.vault.on("create", () => this.refreshView())
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.refreshView())
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.refreshView())
    );
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.app.workspace.onLayoutReady(() => this.initLeaf());
    }
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_NOTES);
  }
  async initLeaf() {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    if (leaves.length === 0) {
      await ((_a = this.app.workspace.getLeftLeaf(false)) == null ? void 0 : _a.setViewState({
        type: VIEW_TYPE_DAILY_NOTES,
        active: true
      }));
    }
  }
  async activateView() {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    if (leaves.length === 0) {
      await ((_a = this.app.workspace.getLeftLeaf(false)) == null ? void 0 : _a.setViewState({
        type: VIEW_TYPE_DAILY_NOTES,
        active: true
      }));
    }
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES)[0];
    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }
  refreshView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof DailyNotesView) {
        view.redraw();
      }
    }
  }
};
