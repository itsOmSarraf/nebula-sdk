"use strict";
// Tools directory for future extensions
// This can include integrations with Hedera, other blockchains, or external APIs
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
// Placeholder for future tool implementations
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    get(name) {
        return this.tools.get(name);
    }
    list() {
        return Array.from(this.tools.values());
    }
    async execute(name, params) {
        const tool = this.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }
        return tool.execute(params);
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=index.js.map