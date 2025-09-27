import { ZGComputeBroker, ServiceMetadata } from "./types";
export declare class ZGComputeBrokerImpl implements ZGComputeBroker {
    private rpcUrl;
    constructor(rpcUrl?: string);
    inference: {
        getServiceMetadata(providerAddress: string): Promise<ServiceMetadata>;
        getRequestHeaders(providerAddress: string, content: string): Promise<Record<string, string>>;
    };
}
export declare function createZGComputeNetworkBroker(rpcUrl?: string): ZGComputeBroker;
//# sourceMappingURL=ZGComputeBroker.d.ts.map