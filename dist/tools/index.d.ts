export interface Tool {
    name: string;
    description: string;
    execute(params: any): Promise<any>;
}
export declare class ToolRegistry {
    private tools;
    register(tool: Tool): void;
    get(name: string): Tool | undefined;
    list(): Tool[];
    execute(name: string, params: any): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map