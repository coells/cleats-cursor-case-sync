export const DEFAULT_MIN_SELECTIONS = 2;
export const DEFAULT_MAX_SELECTIONS = 200;

/**
 * Supported casing styles used to normalize synchronized edits.
 */
export enum CaseType {
    Mixed,
    Lower,
    Upper,
    Capitalized,
    Uncapitalized,
}

export interface PointLike {
    readonly line: number;
    readonly character: number;
}

export interface RangeLike {
    readonly start: PointLike;
    readonly end: PointLike;
    readonly isSingleLine: boolean;
}

export interface SelectionLike extends RangeLike {
    readonly isEmpty: boolean;
}

export interface ContentChangeLike {
    readonly range: RangeLike;
    readonly rangeOffset: number;
    readonly rangeLength: number;
    readonly text: string;
}

export interface TrackedSpan {
    readonly start: PointLike;
    readonly text: string;
    readonly caseType: CaseType;
}

/**
 * Classifies text into one of the supported casing styles.
 */
export function detectCaseType(text: string): CaseType {
    if (/^[a-z][a-z0-9_]*$/.test(text)) {
        return CaseType.Lower;
    }

    if (/^[A-Z][A-Z0-9_]*$/.test(text)) {
        return CaseType.Upper;
    }

    if (/^[A-Z][a-zA-Z0-9_]*$/.test(text)) {
        return CaseType.Capitalized;
    }

    if (/^[a-z][a-zA-Z0-9_]*$/.test(text)) {
        return CaseType.Uncapitalized;
    }

    return CaseType.Mixed;
}

/**
 * Creates a tracked span snapshot from position and source text.
 */
export function toTrackedSpan(start: PointLike, text: string): TrackedSpan {
    return {
        start: { line: start.line, character: start.character },
        text,
        caseType: detectCaseType(text),
    };
}

function comparePoints(a: PointLike, b: PointLike): number {
    if (a.line !== b.line) {
        return a.line - b.line;
    }

    return a.character - b.character;
}

function translateOnLine(point: PointLike, characterOffset: number): PointLike {
    return {
        line: point.line,
        character: point.character + characterOffset,
    };
}

function selectionLength(selection: SelectionLike): number {
    return selection.end.character - selection.start.character;
}

/**
 * Applies the casing style represented by caseType to text.
 */
function normalizeCase(text: string, caseType: CaseType): string {
    if (caseType === CaseType.Lower) {
        return text.toLowerCase();
    }

    if (caseType === CaseType.Upper) {
        return text.toUpperCase();
    }

    if (caseType === CaseType.Capitalized) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    if (caseType === CaseType.Uncapitalized) {
        return text.charAt(0).toLowerCase() + text.slice(1);
    }

    return text;
}

/**
 * Returns whether selections are eligible for synchronized tracking.
 */
export function isTrackableSelectionSet(
    selections: readonly SelectionLike[],
    minSelections: number,
    maxSelections: number,
): boolean {
    if (selections.length < minSelections || selections.length > maxSelections) {
        return false;
    }

    const firstLength = selectionLength(selections[0]);
    return selections.every((selection) => selection.isSingleLine && selectionLength(selection) === firstLength);
}

/**
 * Converts editor selections into ordered tracked spans.
 */
export function createTrackedSpans(
    selections: readonly SelectionLike[],
    getText: (selection: SelectionLike) => string,
): TrackedSpan[] {
    if (selections.every((selection) => selection.isEmpty)) {
        return [];
    }

    return selections
        .slice()
        .sort((a, b) => comparePoints(a.start, b.start))
        .map((selection) => toTrackedSpan(selection.start, getText(selection)));
}

/**
 * Updates a tracked span for one content change while preserving original casing style.
 */
export function updateTrackedSpanWithChange(
    span: TrackedSpan,
    text: string,
    range: RangeLike,
    offset: number,
): TrackedSpan {
    if (
        !range.isSingleLine ||
        range.start.line !== span.start.line ||
        comparePoints(range.start, span.start) < 0 ||
        comparePoints(range.start, translateOnLine(span.start, span.text.length)) > 0
    ) {
        return span;
    }

    const insertionIndex = range.start.character - span.start.character;
    const baseText = span.text.slice(0, insertionIndex) + text;

    return {
        start: translateOnLine(span.start, offset),
        text: normalizeCase(baseText, span.caseType),
        caseType: span.caseType,
    };
}

/**
 * Applies ordered content changes to tracked spans and returns follow-up edits.
 */
export function applyContentChangesToSpans(
    spans: readonly TrackedSpan[],
    changes: readonly ContentChangeLike[],
): {
    readonly nextSpans: TrackedSpan[];
    readonly edits: TrackedSpan[];
} {
    if (spans.length !== changes.length) {
        return {
            nextSpans: spans.slice(),
            edits: [],
        };
    }

    let currentLine = -1;
    let currentOffset = 0;
    const nextSpans = spans.slice();
    const edits: TrackedSpan[] = [];

    changes
        .slice()
        .sort((a, b) => a.rangeOffset - b.rangeOffset)
        .forEach((change, index) => {
            if (change.range.start.line !== currentLine) {
                currentLine = change.range.start.line;
                currentOffset = 0;
            }

            const previousSpan = nextSpans[index];
            const updatedSpan = updateTrackedSpanWithChange(previousSpan, change.text, change.range, currentOffset);
            nextSpans[index] = updatedSpan;

            if (!previousSpan.text.startsWith(updatedSpan.text)) {
                edits.push(updatedSpan);
            }

            currentOffset += change.text.length - change.rangeLength;
        });

    return {
        nextSpans,
        edits,
    };
}
