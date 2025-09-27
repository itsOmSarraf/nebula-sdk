import { ethers } from "ethers";
import { ZGStorageClient } from "./types";
export declare class ZGStorageClientImpl implements ZGStorageClient {
    private indexer;
    private kvClient;
    private rpcUrl;
    private signer;
    private streamId;
    constructor(indexerRpc: string, kvRpc: string, rpcUrl: string, signer: ethers.Wallet, streamId?: string);
    upload(data: string | Buffer, fileName: string): Promise<string>;
    download(rootHash: string): Promise<Buffer>;
    uploadKV(streamId: string, key: string, value: any): Promise<string>;
    downloadKV(streamId: string, key: string): Promise<any>;
}
//# sourceMappingURL=ZGStorageClient.d.ts.map