// Tools directory for future extensions
// This can include integrations with Hedera, other blockchains, or external APIs

export interface Tool {
  name: string;
  description: string;
  execute(params: any): Promise<any>;
}

// Placeholder for future tool implementations
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(name: string, params: any): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }
    return tool.execute(params);
  }
}
