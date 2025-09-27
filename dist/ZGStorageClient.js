"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZGStorageClientImpl = void 0;
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
class ZGStorageClientImpl {
    constructor(indexerRpc, kvRpc, rpcUrl, signer, streamId = "0x000000000000000000000000000000000000000000000000000000000000f2bd" // Default stream ID
    ) {
        this.indexer = new _0g_ts_sdk_1.Indexer(indexerRpc);
        this.kvClient = new _0g_ts_sdk_1.KvClient(kvRpc);
        this.rpcUrl = rpcUrl;
        this.signer = signer;
        this.streamId = streamId;
    }
    async upload(data, fileName) {
        try {
            // Create a temporary file from the data
            const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
            const file = new _0g_ts_sdk_1.ZgFile(buffer);
            // Generate Merkle tree
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                await file.close();
                throw new Error(`Error generating Merkle tree: ${treeErr}`);
            }
            const rootHash = tree?.rootHash();
            if (!rootHash) {
                await file.close();
                throw new Error('Failed to generate root hash');
            }
            // Upload to 0G Storage
            const [tx, uploadErr] = await this.indexer.upload(file, this.rpcUrl, this.signer);
            if (uploadErr !== null) {
                await file.close();
                throw new Error(`Upload error: ${uploadErr}`);
            }
            await file.close();
            return rootHash;
        }
        catch (error) {
            throw new Error(`Storage upload failed: ${error}`);
        }
    }
    async download(rootHash) {
        try {
            // Create a temporary file path for download
            const tempPath = `/tmp/0g-download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Download with proof verification
            const err = await this.indexer.download(rootHash, tempPath, true);
            if (err !== null) {
                throw new Error(`Download error: ${err}`);
            }
            // Read the downloaded file
            const fs = await import('fs');
            const data = fs.readFileSync(tempPath);
            // Clean up temporary file
            try {
                fs.unlinkSync(tempPath);
            }
            catch (cleanupErr) {
                // Ignore cleanup errors
            }
            return data;
        }
        catch (error) {
            throw new Error(`Storage download failed: ${error}`);
        }
    }
    async uploadKV(streamId, key, value) {
        try {
            // Select nodes for KV storage
            const [nodes, err] = await this.indexer.selectNodes(1);
            if (err !== null) {
                throw new Error(`Error selecting nodes: ${err}`);
            }
            // Create batcher for KV operations  
            // Note: Batcher constructor may need different parameters based on actual 0G SDK
            const batcher = new _0g_ts_sdk_1.Batcher(1, nodes, this.rpcUrl);
            // Convert key and value to bytes
            const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
            const valueBytes = Uint8Array.from(Buffer.from(JSON.stringify(value), 'utf-8'));
            // Set the key-value pair
            batcher.streamDataBuilder.set(streamId || this.streamId, keyBytes, valueBytes);
            // Execute the batch
            const result = await batcher.exec();
            if (result && typeof result === 'object' && 'txHash' in result) {
                return result.txHash;
            }
            return result || '';
        }
        catch (error) {
            throw new Error(`KV upload failed: ${error}`);
        }
    }
    async downloadKV(streamId, key) {
        try {
            const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
            const encodedKey = Buffer.from(keyBytes).toString('base64');
            const value = await this.kvClient.getValue(streamId || this.streamId, encodedKey);
            if (!value) {
                return null;
            }
            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(String(value));
            }
            catch {
                return String(value);
            }
        }
        catch (error) {
            // Return null if key doesn't exist or other error
            return null;
        }
    }
}
exports.ZGStorageClientImpl = ZGStorageClientImpl;
//# sourceMappingURL=ZGStorageClient.js.map