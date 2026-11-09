export { type AudienceRule, type Experience, factorCombinations, matchesAudience, type PageRule, parseExperience, withinSchedule, } from "./experience.js";
import type { Experiment, PublicConfig, TrackingEvent } from "./index.js";
export declare function validIdentifier(value: unknown): value is string;
export declare function parseExperiment(input: unknown): Experiment;
export declare function parsePublicConfig(input: unknown): PublicConfig;
export declare function parseTrackingEvent(input: unknown): TrackingEvent;
export declare function matchesTarget(url: string | undefined, target: Experiment["targeting"]): boolean;
export { parseVisualOperations, type VisualOperation, visualStyleProperties, } from "./visual.js";
