import type { VaultAdapter, GenericFile } from "../../src/interfaces/VaultAdapter";

export class FakeFile implements GenericFile {
  extension = "md";

  constructor(
    public path: string,
    public basename: string
  ) {}
}

export class FakeVaultAdapter implements VaultAdapter<FakeFile> {
  private fileContents: Map<string, string> = new Map();

  constructor(private files: FakeFile[] = []) {}

  getMarkdownFiles(): FakeFile[] {
    return this.files;
  }

  async readFile(file: FakeFile): Promise<string> {
    return this.fileContents.get(file.path) || "";
  }

  // Test helpers
  addFile(basename: string, folder = "notes"): FakeFile {
    const file = new FakeFile(`${folder}/${basename}.md`, basename);
    this.files.push(file);
    return file;
  }

  setFileContent(file: FakeFile, content: string): void {
    this.fileContents.set(file.path, content);
  }
}
