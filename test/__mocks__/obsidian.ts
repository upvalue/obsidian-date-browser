// Minimal mock for Obsidian API - only what we need for imports
export class Plugin {}
export class ItemView {
  containerEl = { children: [null, { empty: () => {}, addClass: () => {}, createDiv: () => ({}) }] };
  app = { workspace: {} };
  constructor(public leaf: WorkspaceLeaf) {}
}
export class WorkspaceLeaf {}
export const Keymap = { isModEvent: () => false };
export interface TFile {
  basename: string;
  extension: string;
  path: string;
}
