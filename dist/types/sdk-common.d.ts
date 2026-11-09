import type { PublicConfig, TrackingEvent } from "./contracts/index.js";
export type ClientOptions = {
    projectKey: string;
    environment: string;
    visitorId: string;
    endpoint: string;
    consent?: boolean;
    serverKey?: string;
    config?: PublicConfig;
    fetch?: typeof fetch;
    refreshIntervalMs?: number;
    retryLimit?: number;
    url?: string;
    attributes?: Record<string, string | number | boolean>;
    onExposure?: (experiment: string, variant: string) => void;
};
export type EventDiagnostic = {
    time: string;
    state: "queued" | "accepted" | "pending" | "suppressed" | "invalid" | "forwarded";
    name: string;
    kind: string;
    value?: number;
    currency?: string;
    detail?: string;
};
export declare class ABClient {
    protected eventDiagnostic(_entry: EventDiagnostic, _event?: TrackingEvent): void;
    protected reportEvent(state: EventDiagnostic["state"], event: Partial<TrackingEvent>, detail?: string): void;
    protected readonly options: ClientOptions;
    protected config: PublicConfig | null;
    protected evaluators: Map<string, (visitor: string) => string | null>;
    private queue;
    private exposures;
    private etag;
    private timer;
    private flushing;
    private refreshing;
    private consent;
    private initialized;
    private admissionRequired;
    private accessUntil;
    private admittedUntil;
    protected accessSnapshot(): {
        required: boolean;
        until: number | null;
    };
    protected restoreAccess(access: {
        required: boolean;
        until: number | null;
    }): void;
    protected readAccess(headers: Headers): void;
    protected authorizeAdmission(): Promise<void>;
    private accessAllowed;
    constructor(options: ClientOptions);
    protected acceptConfig(input: unknown): boolean;
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
            experience?: import("./contracts/index.js").Experience | undefined;
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
    init(): Promise<this>;
    start(): void;
    refresh(): Promise<void>;
    private download;
    setAttributes(attributes: Record<string, string | number | boolean>): void;
    getPayload(experimentKey: string): Record<string, import("zod").JSONType> | null;
    getEligibility(experimentKey: string): {
        page: boolean;
        audience: boolean;
        schedule: boolean;
        exclusion: boolean;
        eligible: boolean;
    };
    protected eligible(experimentKey: string): boolean;
    getVariant(experimentKey: string, fallback?: string): string;
    /** Evaluate an already loaded snapshot without granting delivery or analytics access. */
    protected getLocalAssignment(experimentKey: string): string | null;
    setConsent(granted: boolean): void;
    isParticipant(key: string): boolean;
    trackExposure(key: string, variant: string): void;
    track(name: string, properties?: {
        eventId?: string;
        value?: number;
        currency?: string;
    }): boolean;
    private enqueue;
    flush(): Promise<void>;
    private send;
    close(): Promise<void>;
}
export type { PublicConfig, TrackingEvent };
