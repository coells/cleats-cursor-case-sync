import assert from "node:assert/strict";
import test from "node:test";

import {
    applyContentChangesToSpans,
    CaseType,
    createTrackedSpans,
    detectCaseType,
    isTrackableSelectionSet,
    toTrackedSpan,
    updateTrackedSpanWithChange,
    type ContentChangeLike,
    type SelectionLike,
} from "../../src/core/caseSyncModel.js";

/**
 * Unit tests for pure case-sync model logic.
 * Focus: casing detection, trackability checks, span updates, and edit propagation.
 */

/**
 * Creates a single-line selection stub used by model tests.
 */
function selection(startLine: number, startCharacter: number, endCharacter: number): SelectionLike {
    return {
        start: { line: startLine, character: startCharacter },
        end: { line: startLine, character: endCharacter },
        isSingleLine: true,
        isEmpty: startCharacter === endCharacter,
    };
}

void test("detectCaseType classifies supported shapes", () => {
    assert.equal(detectCaseType("lower_case"), CaseType.Lower);
    assert.equal(detectCaseType("a"), CaseType.Lower);
    assert.equal(detectCaseType("UPPER_CASE"), CaseType.Upper);
    assert.equal(detectCaseType("Z"), CaseType.Upper);
    assert.equal(detectCaseType("TitleCase"), CaseType.Capitalized);
    assert.equal(detectCaseType("camelCase"), CaseType.Uncapitalized);
    assert.equal(detectCaseType("snake-case"), CaseType.Mixed);
});

void test("isTrackableSelectionSet validates line and length consistency", () => {
    const valid = [selection(0, 1, 5), selection(1, 2, 6)];
    const invalidLength = [selection(0, 1, 5), selection(1, 2, 7)];

    assert.equal(isTrackableSelectionSet(valid, 2, 10), true);
    assert.equal(isTrackableSelectionSet(invalidLength, 2, 10), false);
    assert.equal(isTrackableSelectionSet(valid, 3, 10), false);
});

void test("createTrackedSpans sorts selections and maps text", () => {
    const selections = [selection(3, 0, 5), selection(1, 0, 5)];
    const words = ["later", "first"];

    const spans = createTrackedSpans(selections, () => words.shift() ?? "");

    assert.equal(spans.length, 2);
    assert.deepEqual(spans[0].start, { line: 1, character: 0 });
    assert.deepEqual(spans[1].start, { line: 3, character: 0 });
});

void test("updateTrackedSpanWithChange preserves lower-case style", () => {
    const original = toTrackedSpan({ line: 0, character: 0 }, "lowercase");
    const updated = updateTrackedSpanWithChange(
        original,
        "TEST",
        {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 5 },
            isSingleLine: true,
        },
        0,
    );

    assert.equal(updated.text, "test");
    assert.equal(updated.caseType, CaseType.Lower);
});

void test("applyContentChangesToSpans computes edits with offsets", () => {
    const spans = [toTrackedSpan({ line: 0, character: 0 }, "foo"), toTrackedSpan({ line: 0, character: 6 }, "BAR")];

    const changes: ContentChangeLike[] = [
        {
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 3 },
                isSingleLine: true,
            },
            rangeOffset: 0,
            rangeLength: 3,
            text: "te",
        },
        {
            range: {
                start: { line: 0, character: 6 },
                end: { line: 0, character: 9 },
                isSingleLine: true,
            },
            rangeOffset: 6,
            rangeLength: 3,
            text: "qa",
        },
    ];

    const result = applyContentChangesToSpans(spans, changes);

    assert.equal(result.nextSpans[0].text, "te");
    assert.equal(result.nextSpans[1].text, "QA");
    assert.equal(result.nextSpans[1].start.character, 5);
    assert.equal(result.edits.length, 2);
});
