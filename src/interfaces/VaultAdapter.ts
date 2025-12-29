import type { TFile, Vault } from "obsidian";

/**
 * Minimal interface for vault operations needed by this plugin.
 * Abstracted for testability.
 */
export interface GenericFile {
  basename: string;
  extension: string;
  path: string;
}

export interface VaultAdapter<TFileType extends GenericFile = GenericFile> {
  getMarkdownFiles(): TFileType[];
  readFile(file: TFileType): Promise<string>;
}

/**
 * Production implementation using Obsidian's Vault
 */
export class ObsidianVaultAdapter implements VaultAdapter<TFile> {
  constructor(private vault: Vault) {}

  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles();
  }

  async readFile(file: TFile): Promise<string> {
    return await this.vault.cachedRead(file);
  }
}
