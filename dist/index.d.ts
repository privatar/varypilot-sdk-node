import { ABClient, type ClientOptions } from "./types/sdk-common.js";
export type { ClientOptions } from "./types/sdk-common.js";
export { ABClient };
export declare class ServerClient extends ABClient {
    private readonly repository;
    constructor(options: ClientOptions);
    private adopt;
    start(): void;
    refresh(force?: boolean): Promise<void>;
    getVariant(key: string, fallback?: string): string;
    trackExposure(key: string, variant: string): void;
    getConfig(): {
        schemaVersion: 1 | 2;
        projectKey: string;
        environment: string;
        version: number;
        experiments: {
            id: string;
            key: string;
            status: "completed" | "draft" | "paused" | "running";
            allocationVersion: number;
            trafficAllocation: number;
            experience?: import("./types/contracts/index.js").Experience | undefined;
            targeting?: {
                url: string;
                match: "contains" | "equals" | "starts-with";
            } | undefined;
            variants: {
                key: string;
                weight: number;
                payload?: Record<string, import("zod").JSONType> | undefined;
            }[];
        }[];
    } | null;
}
/** Construct per visitor/request. Warm requests reuse the shared snapshot without network I/O. */
export declare const createABServerClient: (options: ClientOptions) => ServerClient;
/** Call after closing event clients during a controlled application shutdown. */
export declare function shutdownABServerSDK(): void;
