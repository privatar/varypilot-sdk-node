export { type AudienceRule, type Experience, factorCombinations, matchesAudience, type PageRule, parseExperience, withinSchedule, } from "./experience.js";
import { z } from "zod";
export { parseVisualOperations, type VisualOperation, visualStyleProperties, } from "./visual.js";
export declare const BUCKET_COUNT = 10000;
export declare const MAX_ALLOCATION_VERSION = 2147483647;
export declare const DEFAULT_CONVERSION_WINDOW_DAYS = 7;
export declare function isUnicodeScalarString(value: string): boolean;
export declare const identifierSchema: z.ZodString;
export declare const experimentStatusSchema: z.ZodEnum<{
    completed: "completed";
    draft: "draft";
    paused: "paused";
    running: "running";
}>;
export declare const environmentSchema: z.ZodString;
export declare const memberRoleSchema: z.ZodEnum<{
    admin: "admin";
    owner: "owner";
    viewer: "viewer";
}>;
export declare const variantSchema: z.ZodObject<{
    key: z.ZodString;
    weight: z.ZodNumber;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
}, z.core.$strict>;
export declare const experimentSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        draft: "draft";
        paused: "paused";
        running: "running";
    }>;
    allocationVersion: z.ZodNumber;
    trafficAllocation: z.ZodNumber;
    experience: z.ZodOptional<z.ZodPipe<z.ZodUnknown, z.ZodTransform<import("./experience.js").Experience, unknown>>>;
    targeting: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        match: z.ZodEnum<{
            contains: "contains";
            equals: "equals";
            "starts-with": "starts-with";
        }>;
    }, z.core.$strict>>;
    variants: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        weight: z.ZodNumber;
        payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const publicConfigSchema: z.ZodObject<{
    schemaVersion: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>]>;
    projectKey: z.ZodString;
    environment: z.ZodString;
    version: z.ZodNumber;
    experiments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        status: z.ZodEnum<{
            completed: "completed";
            draft: "draft";
            paused: "paused";
            running: "running";
        }>;
        allocationVersion: z.ZodNumber;
        trafficAllocation: z.ZodNumber;
        experience: z.ZodOptional<z.ZodPipe<z.ZodUnknown, z.ZodTransform<import("./experience.js").Experience, unknown>>>;
        targeting: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            match: z.ZodEnum<{
                contains: "contains";
                equals: "equals";
                "starts-with": "starts-with";
            }>;
        }, z.core.$strict>>;
        variants: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            weight: z.ZodNumber;
            payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodJSONSchema>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const experimentPlanSchema: z.ZodObject<{
    primaryGoalId: z.ZodUUID;
    hypothesis: z.ZodString;
    significanceLevel: z.ZodDefault<z.ZodNumber>;
    minimumDetectableEffect: z.ZodNumber;
    plannedSampleSize: z.ZodOptional<z.ZodNumber>;
    plannedDurationDays: z.ZodOptional<z.ZodNumber>;
    conversionWindowDays: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type Experiment = z.infer<typeof experimentSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type ExperimentPlan = z.infer<typeof experimentPlanSchema>;
export type Environment = z.infer<typeof environmentSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export declare const publicGoalSchema: z.ZodObject<{
    id: z.ZodUUID;
    event: z.ZodString;
    kind: z.ZodEnum<{
        conversion: "conversion";
        custom: "custom";
        revenue: "revenue";
    }>;
    currency: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const trackingEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    type: z.ZodEnum<{
        conversion: "conversion";
        custom: "custom";
        exposure: "exposure";
    }>;
    visitorId: z.ZodString;
    occurredAt: z.ZodISODateTime;
    experimentId: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodString>;
    allocationVersion: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const eventBatchSchema: z.ZodObject<{
    projectKey: z.ZodString;
    environment: z.ZodString;
    events: z.ZodArray<z.ZodObject<{
        eventId: z.ZodString;
        type: z.ZodEnum<{
            conversion: "conversion";
            custom: "custom";
            exposure: "exposure";
        }>;
        visitorId: z.ZodString;
        occurredAt: z.ZodISODateTime;
        experimentId: z.ZodOptional<z.ZodString>;
        variant: z.ZodOptional<z.ZodString>;
        allocationVersion: z.ZodOptional<z.ZodNumber>;
        name: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type TrackingEvent = z.infer<typeof trackingEventSchema>;
export type EventBatch = z.infer<typeof eventBatchSchema>;
