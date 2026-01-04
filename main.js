var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/clusterize.js@1.0.0/node_modules/clusterize.js/clusterize.js
var require_clusterize = __commonJS({
  "node_modules/.pnpm/clusterize.js@1.0.0/node_modules/clusterize.js/clusterize.js"(exports, module2) {
    (function(name, definition) {
      if (typeof module2 != "undefined")
        module2.exports = definition();
      else if (typeof define == "function" && typeof define.amd == "object")
        define(definition);
      else
        this[name] = definition();
    })("Clusterize", function() {
      "use strict";
      var ie = function() {
        for (var v = 3, el = document.createElement("b"), all = el.all || []; el.innerHTML = "<!--[if gt IE " + ++v + "]><i><![endif]-->", all[0]; ) {
        }
        return v > 4 ? v : document.documentMode;
      }(), is_mac = navigator.platform.toLowerCase().indexOf("mac") + 1;
      var Clusterize2 = function(data) {
        if (!(this instanceof Clusterize2))
          return new Clusterize2(data);
        var self = this;
        var defaults = {
          rows_in_block: 50,
          blocks_in_cluster: 4,
          tag: null,
          show_no_data_row: true,
          no_data_class: "clusterize-no-data",
          no_data_text: "No data",
          keep_parity: true,
          callbacks: {}
        };
        self.options = {};
        var options = ["rows_in_block", "blocks_in_cluster", "show_no_data_row", "no_data_class", "no_data_text", "keep_parity", "tag", "callbacks"];
        for (var i = 0, option; option = options[i]; i++) {
          self.options[option] = typeof data[option] != "undefined" && data[option] != null ? data[option] : defaults[option];
        }
        var elems = ["scroll", "content"];
        for (var i = 0, elem; elem = elems[i]; i++) {
          self[elem + "_elem"] = data[elem + "Id"] ? document.getElementById(data[elem + "Id"]) : data[elem + "Elem"];
          if (!self[elem + "_elem"])
            throw new Error("Error! Could not find " + elem + " element");
        }
        if (!self.content_elem.hasAttribute("tabindex"))
          self.content_elem.setAttribute("tabindex", 0);
        var rows = isArray(data.rows) ? data.rows : self.fetchMarkup(), cache = {}, scroll_top = self.scroll_elem.scrollTop;
        self.insertToDOM(rows, cache);
        self.scroll_elem.scrollTop = scroll_top;
        var last_cluster = false, scroll_debounce = 0, pointer_events_set = false, scrollEv = function() {
          if (is_mac) {
            if (!pointer_events_set)
              self.content_elem.style.pointerEvents = "none";
            pointer_events_set = true;
            clearTimeout(scroll_debounce);
            scroll_debounce = setTimeout(function() {
              self.content_elem.style.pointerEvents = "auto";
              pointer_events_set = false;
            }, 50);
          }
          if (last_cluster != (last_cluster = self.getClusterNum(rows)))
            self.insertToDOM(rows, cache);
          if (self.options.callbacks.scrollingProgress)
            self.options.callbacks.scrollingProgress(self.getScrollProgress());
        }, resize_debounce = 0, resizeEv = function() {
          clearTimeout(resize_debounce);
          resize_debounce = setTimeout(self.refresh, 100);
        };
        on("scroll", self.scroll_elem, scrollEv);
        on("resize", window, resizeEv);
        self.destroy = function(clean) {
          off("scroll", self.scroll_elem, scrollEv);
          off("resize", window, resizeEv);
          self.html((clean ? self.generateEmptyRow() : rows).join(""));
        };
        self.refresh = function(force) {
          if (self.getRowsHeight(rows) || force)
            self.update(rows);
        };
        self.update = function(new_rows) {
          rows = isArray(new_rows) ? new_rows : [];
          var scroll_top2 = self.scroll_elem.scrollTop;
          if (rows.length * self.options.item_height < scroll_top2) {
            self.scroll_elem.scrollTop = 0;
            last_cluster = 0;
          }
          self.insertToDOM(rows, cache);
          self.scroll_elem.scrollTop = scroll_top2;
        };
        self.clear = function() {
          self.update([]);
        };
        self.getRowsAmount = function() {
          return rows.length;
        };
        self.getScrollProgress = function() {
          return this.options.scroll_top / (rows.length * this.options.item_height) * 100 || 0;
        };
        var add = function(where, _new_rows) {
          var new_rows = isArray(_new_rows) ? _new_rows : [];
          if (!new_rows.length)
            return;
          rows = where == "append" ? rows.concat(new_rows) : new_rows.concat(rows);
          self.insertToDOM(rows, cache);
        };
        self.append = function(rows2) {
          add("append", rows2);
        };
        self.prepend = function(rows2) {
          add("prepend", rows2);
        };
      };
      Clusterize2.prototype = {
        constructor: Clusterize2,
        // fetch existing markup
        fetchMarkup: function() {
          var rows = [], rows_nodes = this.getChildNodes(this.content_elem);
          while (rows_nodes.length) {
            rows.push(rows_nodes.shift().outerHTML);
          }
          return rows;
        },
        // get tag name, content tag name, tag height, calc cluster height
        exploreEnvironment: function(rows, cache) {
          var opts = this.options;
          opts.content_tag = this.content_elem.tagName.toLowerCase();
          if (!rows.length)
            return;
          if (ie && ie <= 9 && !opts.tag)
            opts.tag = rows[0].match(/<([^>\s/]*)/)[1].toLowerCase();
          if (this.content_elem.children.length <= 1)
            cache.data = this.html(rows[0] + rows[0] + rows[0]);
          if (!opts.tag)
            opts.tag = this.content_elem.children[0].tagName.toLowerCase();
          this.getRowsHeight(rows);
        },
        getRowsHeight: function(rows) {
          var opts = this.options, prev_item_height = opts.item_height;
          opts.cluster_height = 0;
          if (!rows.length)
            return;
          var nodes = this.content_elem.children;
          if (!nodes.length)
            return;
          var node = nodes[Math.floor(nodes.length / 2)];
          opts.item_height = node.offsetHeight;
          if (opts.tag == "tr" && getStyle("borderCollapse", this.content_elem) != "collapse")
            opts.item_height += parseInt(getStyle("borderSpacing", this.content_elem), 10) || 0;
          if (opts.tag != "tr") {
            var marginTop = parseInt(getStyle("marginTop", node), 10) || 0;
            var marginBottom = parseInt(getStyle("marginBottom", node), 10) || 0;
            opts.item_height += Math.max(marginTop, marginBottom);
          }
          opts.block_height = opts.item_height * opts.rows_in_block;
          opts.rows_in_cluster = opts.blocks_in_cluster * opts.rows_in_block;
          opts.cluster_height = opts.blocks_in_cluster * opts.block_height;
          return prev_item_height != opts.item_height;
        },
        // get current cluster number
        getClusterNum: function(rows) {
          var opts = this.options;
          opts.scroll_top = this.scroll_elem.scrollTop;
          var cluster_divider = opts.cluster_height - opts.block_height;
          var current_cluster = Math.floor(opts.scroll_top / cluster_divider);
          var max_cluster = Math.floor(rows.length * opts.item_height / cluster_divider);
          return Math.min(current_cluster, max_cluster);
        },
        // generate empty row if no data provided
        generateEmptyRow: function() {
          var opts = this.options;
          if (!opts.tag || !opts.show_no_data_row)
            return [];
          var empty_row = document.createElement(opts.tag), no_data_content = document.createTextNode(opts.no_data_text), td;
          empty_row.className = opts.no_data_class;
          if (opts.tag == "tr") {
            td = document.createElement("td");
            td.colSpan = 100;
            td.appendChild(no_data_content);
          }
          empty_row.appendChild(td || no_data_content);
          return [empty_row.outerHTML];
        },
        // generate cluster for current scroll position
        generate: function(rows) {
          var opts = this.options, rows_len = rows.length;
          if (rows_len < opts.rows_in_block) {
            return {
              top_offset: 0,
              bottom_offset: 0,
              rows_above: 0,
              rows: rows_len ? rows : this.generateEmptyRow()
            };
          }
          var items_start = Math.max((opts.rows_in_cluster - opts.rows_in_block) * this.getClusterNum(rows), 0), items_end = items_start + opts.rows_in_cluster, top_offset = Math.max(items_start * opts.item_height, 0), bottom_offset = Math.max((rows_len - items_end) * opts.item_height, 0), this_cluster_rows = [], rows_above = items_start;
          if (top_offset < 1) {
            rows_above++;
          }
          for (var i = items_start; i < items_end; i++) {
            rows[i] && this_cluster_rows.push(rows[i]);
          }
          return {
            top_offset,
            bottom_offset,
            rows_above,
            rows: this_cluster_rows
          };
        },
        renderExtraTag: function(class_name, height) {
          var tag = document.createElement(this.options.tag), clusterize_prefix = "clusterize-";
          tag.className = [clusterize_prefix + "extra-row", clusterize_prefix + class_name].join(" ");
          height && (tag.style.height = height + "px");
          return tag.outerHTML;
        },
        // if necessary verify data changed and insert to DOM
        insertToDOM: function(rows, cache) {
          if (!this.options.cluster_height) {
            this.exploreEnvironment(rows, cache);
          }
          var data = this.generate(rows), this_cluster_rows = data.rows.join(""), this_cluster_content_changed = this.checkChanges("data", this_cluster_rows, cache), top_offset_changed = this.checkChanges("top", data.top_offset, cache), only_bottom_offset_changed = this.checkChanges("bottom", data.bottom_offset, cache), callbacks = this.options.callbacks, layout = [];
          if (this_cluster_content_changed || top_offset_changed) {
            if (data.top_offset) {
              this.options.keep_parity && layout.push(this.renderExtraTag("keep-parity"));
              layout.push(this.renderExtraTag("top-space", data.top_offset));
            }
            layout.push(this_cluster_rows);
            data.bottom_offset && layout.push(this.renderExtraTag("bottom-space", data.bottom_offset));
            callbacks.clusterWillChange && callbacks.clusterWillChange();
            this.html(layout.join(""));
            this.options.content_tag == "ol" && this.content_elem.setAttribute("start", data.rows_above);
            this.content_elem.style["counter-increment"] = "clusterize-counter " + (data.rows_above - 1);
            callbacks.clusterChanged && callbacks.clusterChanged();
          } else if (only_bottom_offset_changed) {
            this.content_elem.lastChild.style.height = data.bottom_offset + "px";
          }
        },
        // unfortunately ie <= 9 does not allow to use innerHTML for table elements, so make a workaround
        html: function(data) {
          var content_elem = this.content_elem;
          if (ie && ie <= 9 && this.options.tag == "tr") {
            var div = document.createElement("div"), last;
            div.innerHTML = "<table><tbody>" + data + "</tbody></table>";
            while (last = content_elem.lastChild) {
              content_elem.removeChild(last);
            }
            var rows_nodes = this.getChildNodes(div.firstChild.firstChild);
            while (rows_nodes.length) {
              content_elem.appendChild(rows_nodes.shift());
            }
          } else {
            content_elem.innerHTML = data;
          }
        },
        getChildNodes: function(tag) {
          var child_nodes = tag.children, nodes = [];
          for (var i = 0, ii = child_nodes.length; i < ii; i++) {
            nodes.push(child_nodes[i]);
          }
          return nodes;
        },
        checkChanges: function(type, value, cache) {
          var changed = value != cache[type];
          cache[type] = value;
          return changed;
        }
      };
      function on(evt, element, fnc) {
        return element.addEventListener ? element.addEventListener(evt, fnc, false) : element.attachEvent("on" + evt, fnc);
      }
      function off(evt, element, fnc) {
        return element.removeEventListener ? element.removeEventListener(evt, fnc, false) : element.detachEvent("on" + evt, fnc);
      }
      function isArray(arr) {
        return Object.prototype.toString.call(arr) === "[object Array]";
      }
      function getStyle(prop, elem) {
        return window.getComputedStyle ? window.getComputedStyle(elem)[prop] : elem.currentStyle[prop];
      }
      return Clusterize2;
    });
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DailyNotesBrowserPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/views/DailyNotesView.ts
var import_obsidian = require("obsidian");
var import_clusterize = __toESM(require_clusterize());

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
var VIEW_TYPE_DATE_BROWSER = "date-browser-view";
var SHOW_DATED_NOTES = true;
var SHOW_HEADINGS = true;
var SHOW_UNDATED_NOTES = false;
var WEEKLY_NOTE_PATTERN = /^\d{4}-W\d{1,2}/;
var CYCLE_HEADING_PATTERN = /^\d{4}-\d{2}-\d{2} \d+W Cycle \d+/;
var DailyNotesView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.clusterize = null;
    this.allItems = [];
    this.activeFilePath = null;
    this.pinnedIndices = /* @__PURE__ */ new Set();
    this.scanner = new DateNoteScanner(new ObsidianVaultAdapter(this.app.vault));
    this.headingScanner = new HeadingScanner(
      () => this.app.vault.getMarkdownFiles(),
      (file) => this.app.metadataCache.getFileCache(file)
    );
  }
  getViewType() {
    return VIEW_TYPE_DATE_BROWSER;
  }
  getDisplayText() {
    return "Date Browser";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    var _a;
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        var _a2;
        const file = (leaf == null ? void 0 : leaf.view) instanceof import_obsidian.MarkdownView ? leaf.view.file : null;
        this.activeFilePath = (_a2 = file == null ? void 0 : file.path) != null ? _a2 : null;
        this.updateActiveHighlight();
      })
    );
    const activeFile = this.app.workspace.getActiveFile();
    this.activeFilePath = (_a = activeFile == null ? void 0 : activeFile.path) != null ? _a : null;
    setTimeout(() => this.redraw(), 0);
  }
  // Called when view is resized or becomes visible again (e.g., after idle)
  onResize() {
    const container = this.containerEl.children[1];
    const hasContent = (container == null ? void 0 : container.querySelector(".clusterize-scroll")) !== null || (container == null ? void 0 : container.querySelector(".date-browser-empty")) !== null;
    if (!hasContent) {
      this.redraw();
    } else if (this.clusterize) {
      this.clusterize.refresh();
    }
  }
  async onClose() {
    if (this.clusterize) {
      this.clusterize.destroy(true);
      this.clusterize = null;
    }
  }
  async redraw() {
    var _a;
    if (this.clusterize) {
      this.clusterize.destroy(true);
      this.clusterize = null;
    }
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("date-browser-container");
    let items = [];
    if (SHOW_DATED_NOTES || SHOW_UNDATED_NOTES) {
      const notes = this.scanner.scanForDailyNotes();
      for (const note of notes) {
        const isDated = note.parsedDate !== null;
        if (isDated && SHOW_DATED_NOTES || !isDated && SHOW_UNDATED_NOTES) {
          items.push(note);
        }
      }
    }
    if (SHOW_HEADINGS) {
      const headings = this.headingScanner.scanForDatedHeadings();
      items = items.concat(headings);
    }
    items.sort((a, b) => {
      const cmp = b.sortKey - a.sortKey;
      if (cmp !== 0)
        return cmp;
      const aText = a.type === "note" ? a.file.basename : a.heading;
      const bText = b.type === "note" ? b.file.basename : b.heading;
      return aText.localeCompare(bText);
    });
    const pinnedItems = [];
    const regularItems = [];
    this.pinnedIndices.clear();
    let foundWeekly = false;
    let foundCycle = false;
    for (const item of items) {
      let isPinned = false;
      if (!foundWeekly && item.type === "note" && ((_a = item.parsedDate) == null ? void 0 : _a.originalFormat) && WEEKLY_NOTE_PATTERN.test(item.parsedDate.originalFormat)) {
        foundWeekly = true;
        isPinned = true;
      }
      if (!foundCycle && item.type === "heading" && CYCLE_HEADING_PATTERN.test(item.heading)) {
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
    this.allItems = [...pinnedItems, ...regularItems];
    if (this.allItems.length === 0) {
      container.createDiv({
        cls: "date-browser-empty",
        text: "No notes found"
      });
      return;
    }
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
      pinnedArea.addEventListener(
        "click",
        (event) => this.handleItemClick(event)
      );
      pinnedArea.addEventListener(
        "auxclick",
        (event) => this.handleItemClick(event)
      );
    }
    const scrollArea = container.createDiv({
      cls: "clusterize-scroll",
      attr: { id: "date-browser-scroll" }
    });
    const contentArea = scrollArea.createDiv({
      cls: "clusterize-content",
      attr: { id: "date-browser-content" }
    });
    const rows = regularItems.map(
      (item, i) => this.renderItemHtml(item, pinnedItems.length + i)
    );
    this.clusterize = new import_clusterize.default({
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
        }
      }
    });
    this.populateIcons(contentArea);
    this.updateActiveHighlight();
    contentArea.addEventListener(
      "click",
      (event) => this.handleItemClick(event)
    );
    contentArea.addEventListener(
      "auxclick",
      (event) => this.handleItemClick(event)
    );
  }
  handleItemClick(event) {
    const target = event.target;
    const row = target.closest(".nav-file-title");
    if (!row)
      return;
    const indexStr = row.dataset.index;
    if (indexStr === void 0)
      return;
    const index = parseInt(indexStr, 10);
    const item = this.allItems[index];
    if (!item)
      return;
    const newLeaf = import_obsidian.Keymap.isModEvent(event) || event.button === 1;
    if (item.type === "heading") {
      this.openHeading(item, newLeaf);
    } else {
      this.openFile(item.file, newLeaf);
    }
  }
  renderItemHtml(item, index) {
    const iconName = item.type === "heading" ? "heading" : "file-text";
    const text = item.type === "note" ? item.file.basename : item.heading;
    const escapedText = this.escapeHtml(text);
    const isPinned = this.pinnedIndices.has(index);
    const pinnedClass = isPinned ? " is-pinned" : "";
    return `<div class="tree-item nav-file${pinnedClass}">
      <div class="tree-item-self nav-file-title is-clickable" data-index="${index}">
        <span class="nav-file-icon" data-icon="${iconName}"></span>
        <span class="tree-item-inner nav-file-title-content" title="${escapedText}">${escapedText}</span>
      </div>
    </div>`;
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  populateIcons(container) {
    const iconElements = container.querySelectorAll("[data-icon]");
    iconElements.forEach((el) => {
      const iconName = el.getAttribute("data-icon");
      if (iconName && el.children.length === 0) {
        (0, import_obsidian.setIcon)(el, iconName);
      }
    });
  }
  updateActiveHighlight() {
    const container = this.containerEl.children[1];
    const rows = container == null ? void 0 : container.querySelectorAll(".nav-file-title[data-index]");
    if (!rows)
      return;
    rows.forEach((row) => {
      const indexStr = row.getAttribute("data-index");
      if (indexStr === null)
        return;
      const index = parseInt(indexStr, 10);
      const item = this.allItems[index];
      if (!item)
        return;
      const isActive = item.file.path === this.activeFilePath;
      row.classList.toggle("is-active", isActive);
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
    this.registerView(VIEW_TYPE_DATE_BROWSER, (leaf) => new DailyNotesView(leaf, this));
    this.addRibbonIcon("calendar", "Open Date Browser", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-date-browser-view",
      name: "Open Date Browser view",
      callback: () => {
        this.activateView();
      }
    });
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
      this.registerDomEvent(window, "focus", () => this.refreshView());
    };
    if (this.app.workspace.layoutReady) {
      onReady();
    } else {
      this.app.workspace.onLayoutReady(() => onReady());
    }
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DATE_BROWSER);
  }
  async initLeaf() {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);
    if (leaves.length === 0) {
      await ((_a = this.app.workspace.getLeftLeaf(false)) == null ? void 0 : _a.setViewState({
        type: VIEW_TYPE_DATE_BROWSER,
        active: true
      }));
    }
  }
  async activateView() {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);
    if (leaves.length === 0) {
      await ((_a = this.app.workspace.getLeftLeaf(false)) == null ? void 0 : _a.setViewState({
        type: VIEW_TYPE_DATE_BROWSER,
        active: true
      }));
    }
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER)[0];
    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }
  refreshView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DATE_BROWSER);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof DailyNotesView) {
        view.redraw();
      }
    }
  }
};
