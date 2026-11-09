export type PageRule = {
    url: string;
    match: "contains" | "equals" | "starts-with";
};
export type AudienceRule = {
    key: string;
    operator: "eq" | "neq" | "contains" | "gte" | "lte" | "exists";
    value: string | number | boolean;
};
export type Experience = {
    mode?: "ab" | "multipage" | "multivariate" | "personalization";
    pages?: PageRule[];
    audience?: AudienceRule[];
    schedule?: {
        startsAt?: string;
        endsAt?: string;
    };
    exclusion?: {
        group: string;
        from: number;
        to: number;
    };
    factors?: {
        name: string;
        options: string[];
    }[];
    guardrail?: {
        enabled: boolean;
        action: "notify" | "pause";
        minimumVisitors: number;
        lossPercent: number;
    };
};
export declare function parseExperience(value: unknown): Experience;
export declare function matchesAudience(rules: AudienceRule[] | undefined, attributes?: Record<string, string | number | boolean>): boolean;
export declare function withinSchedule(schedule: Experience["schedule"], now?: number): boolean;
export declare function factorCombinations(factors: NonNullable<Experience["factors"]>): Record<string, string>[];
