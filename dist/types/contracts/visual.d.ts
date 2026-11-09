/** Declarative visual changes shared by the editor, save endpoint and browser SDK. */
export type VisualOperation = {
    selector: string;
    type: "text" | "class" | "visibility" | "attribute" | "style";
    value: string | boolean;
    property?: string;
};
export declare const visualStyleProperties: readonly ["color", "background-color", "font-size", "font-weight", "line-height", "letter-spacing", "border-radius", "padding", "margin", "text-align", "max-width"];
export declare function parseVisualOperations(input: unknown): VisualOperation[];
