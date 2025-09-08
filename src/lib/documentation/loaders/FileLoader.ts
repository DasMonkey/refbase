// Strategy Pattern for different loading mechanisms
export interface FileLoader {
  loadFile(filename: string): Promise<string>;
}

export class HttpFileLoader implements FileLoader {
  constructor(private basePath: string = '/docs') {}

  async loadFile(filename: string): Promise<string> {
    const response = await fetch(`${this.basePath}/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load file: ${filename} (${response.status})`);
    }
    
    return response.text();
  }
}

// Future: Could add LocalFileLoader, S3FileLoader, etc.
export class MockFileLoader implements FileLoader {
  constructor(private mockFiles: Record<string, string>) {}

  async loadFile(filename: string): Promise<string> {
    const content = this.mockFiles[filename];
    if (!content) {
      throw new Error(`Mock file not found: ${filename}`);
    }
    return content;
  }
}