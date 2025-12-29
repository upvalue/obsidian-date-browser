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
var WEEKLY_PATTERN = /^(\d{4})-W(\d{1,2})/;
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
function parseHeading(headingText) {
  return parseDate(headingText);
}
function sundayOfWeek(year, week) {
  const jan1 = new Date(year, 0, 1);
  const jan1DayOfWeek = jan1.getDay();
  const daysToFirstSunday = jan1DayOfWeek === 0 ? 0 : 7 - jan1DayOfWeek;
  const targetDate = new Date(year, 0, 1 + daysToFirstSunday + (week - 1) * 7);
  return {
    year: targetDate.getFullYear(),
    month: targetDate.getMonth() + 1,
    day: targetDate.getDate()
  };
}
function parseWeeklyDate(input) {
  const match = input.match(WEEKLY_PATTERN);
  if (!match)
    return null;
  const [matchedPart, yearStr, weekStr] = match;
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  if (week < 1 || week > 53)
    return null;
  const { year: computedYear, month, day } = sundayOfWeek(year, week);
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return {
    year: computedYear,
    month,
    day,
    dateString: `${computedYear}-${monthStr}-${dayStr}`,
    sortKey: computedYear * 1e4 + month * 100 + day,
    originalFormat: matchedPart
  };
}
function parseFilenameExtended(filename) {
  const dailyParsed = parseDate(filename);
  if (dailyParsed)
    return dailyParsed;
  return parseWeeklyDate(filename);
}

// src/services/DateNoteScanner.ts
var FALLBACK_SORT_KEY = 20000101;
var DateNoteScanner = class {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Scans the vault for all markdown notes.
   * Dated notes (YYYY-MM-DD or YYYY-Www) are sorted by date descending.
   * Undated notes are sorted to the end (as 2000-01-01), then alphabetically.
   */
  scanForDailyNotes() {
    var _a;
    const allFiles = this.vault.getMarkdownFiles();
    const items = [];
    for (const file of allFiles) {
      const parsed = parseFilenameExtended(file.basename);
      if (parsed) {
        items.push({
          type: "note",
          file,
          parsedDate: parsed,
          displayDate: (_a = parsed.originalFormat) != null ? _a : parsed.dateString,
          sortKey: parsed.sortKey
        });
      } else {
        items.push({
          type: "note",
          file,
          parsedDate: null,
          displayDate: file.basename,
          sortKey: FALLBACK_SORT_KEY
        });
      }
    }
    items.sort((a, b) => {
      const dateCompare = b.sortKey - a.sortKey;
      if (dateCompare !== 0)
        return dateCompare;
      return a.file.basename.localeCompare(b.file.basename);
    });
    return items;
  }
};

// src/services/HeadingScanner.ts
var HeadingScanner = class {
  constructor(getFiles, getCache) {
    this.getFiles = getFiles;
    this.getCache = getCache;
  }
  /**
   * Scans all files for headings that start with YYYY-MM-DD format.
   * Uses metadata cache for performance (no file I/O).
   */
  scanForDatedHeadings() {
    const items = [];
    for (const file of this.getFiles()) {
      const cache = this.getCache(file);
      if (!(cache == null ? void 0 : cache.headings))
        continue;
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
            sortKey: parsed.sortKey
          });
        }
      }
    }
    return items;
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
    this.headingScanner = new HeadingScanner(
      () => this.app.vault.getMarkdownFiles(),
      (file) => this.app.metadataCache.getFileCache(file)
    );
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
    const notes = this.scanner.scanForDailyNotes();
    const headings = this.headingScanner.scanForDatedHeadings();
    const allItems = [...notes, ...headings];
    allItems.sort((a, b) => {
      const cmp = b.sortKey - a.sortKey;
      if (cmp !== 0)
        return cmp;
      const aText = a.type === "note" ? a.file.basename : a.heading;
      const bText = b.type === "note" ? b.file.basename : b.heading;
      return aText.localeCompare(bText);
    });
    if (allItems.length === 0) {
      container.createDiv({
        cls: "daily-notes-empty",
        text: "No notes found"
      });
      return;
    }
    const navContainer = container.createDiv({ cls: "nav-files-container" });
    for (const item of allItems) {
      this.renderItem(navContainer, item);
    }
  }
  renderItem(container, item) {
    const navFile = container.createDiv({ cls: "tree-item nav-file" });
    const navFileTitle = navFile.createDiv({
      cls: "tree-item-self nav-file-title is-clickable"
    });
    const iconEl = navFileTitle.createSpan({ cls: "nav-file-icon" });
    (0, import_obsidian.setIcon)(iconEl, item.type === "heading" ? "heading" : "file-text");
    navFileTitle.createSpan({
      cls: "tree-item-inner nav-file-title-content",
      text: item.type === "note" ? item.file.basename : item.heading
    });
    navFileTitle.addEventListener("click", (event) => {
      const newLeaf = import_obsidian.Keymap.isModEvent(event);
      if (item.type === "heading") {
        this.openHeading(item, newLeaf);
      } else {
        this.openFile(item.file, newLeaf);
      }
    });
    navFileTitle.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }
  openFile(file, newLeaf) {
    const leaf = newLeaf ? this.app.workspace.getLeaf("tab") : this.app.workspace.getMostRecentLeaf();
    if (leaf) {
      leaf.openFile(file);
    }
  }
  async openHeading(item, newLeaf) {
    const leaf = newLeaf ? this.app.workspace.getLeaf("tab") : this.app.workspace.getMostRecentLeaf();
    if (leaf) {
      await leaf.openFile(item.file);
      if (leaf.view instanceof import_obsidian.MarkdownView) {
        leaf.view.editor.scrollIntoView(
          {
            from: { line: item.lineNumber, ch: 0 },
            to: { line: item.lineNumber, ch: 0 }
          },
          true
        );
      }
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
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.refreshView())
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
