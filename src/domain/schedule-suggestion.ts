export type ScheduleSuggestionSectionKind = "preferred" | "fallback";

export interface ScheduleSuggestion {
    start: string;
    end: string;
    reason: string;
}

export interface ScheduleSuggestionSection {
    kind: ScheduleSuggestionSectionKind;
    title: string;
    description: string;
    suggestions: ScheduleSuggestion[];
}
