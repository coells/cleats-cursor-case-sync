import * as vscode from "vscode";

import {
    applyContentChangesToSpans,
    createTrackedSpans,
    DEFAULT_MAX_SELECTIONS,
    DEFAULT_MIN_SELECTIONS,
    isTrackableSelectionSet,
    type SelectionLike,
    type TrackedSpan,
} from "./core/caseSyncModel.js";

interface TrackedDocument {
    readonly editor: vscode.TextEditor;
    spans: TrackedSpan[];
}

const EXTENSION_NAMESPACE = "cleatsCursorCaseSync";

/**
 * Reads a numeric extension setting and falls back to a safe default.
 */
function getSettingNumber(key: "minSelections" | "maxSelections", fallback: number): number {
    const value = vscode.workspace.getConfiguration(EXTENSION_NAMESPACE).get<number>(key, fallback);
    return Number.isFinite(value) ? value : fallback;
}

/**
 * Creates a replacement range that matches the tracked span's current text length.
 */
function createRange(start: TrackedSpan["start"], text: string): vscode.Range {
    const startPosition = new vscode.Position(start.line, start.character);
    return new vscode.Range(startPosition, startPosition.translate(0, text.length));
}

/**
 * Coordinates editor events and synchronizes case-preserving multi-selection edits.
 */
export class CaseSyncController {
    private readonly trackedDocuments = new Map<vscode.TextDocument, TrackedDocument>();
    private active: TrackedDocument | undefined;

    /**
     * Switches active tracked document when the focused editor changes.
     */
    public onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
        this.updateActiveEditor(editor);
        this.updateActiveSpans(editor?.selections ?? []);
    }

    /**
     * Refreshes tracked spans when user selections change.
     */
    public onDidChangeTextEditorSelection(event: vscode.TextEditorSelectionChangeEvent): void {
        this.updateActiveEditor(event.textEditor);
        this.updateActiveSpans(event.selections);
    }

    /**
     * Applies synchronization only for user edits (skips undo/redo reasons).
     */
    public onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
        if (event.reason !== undefined) {
            return;
        }

        this.applyTextChanges(event.contentChanges);
    }

    /**
     * Releases tracked state for closed documents.
     */
    public onDidCloseTextDocument(document: vscode.TextDocument): void {
        if (this.active?.editor.document === document) {
            this.active = undefined;
        }

        this.trackedDocuments.delete(document);
    }

    /**
     * Ensures the active editor has an associated tracked document record.
     */
    private updateActiveEditor(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            this.active = undefined;
            return;
        }

        let trackedDocument = this.trackedDocuments.get(editor.document);
        if (!trackedDocument) {
            trackedDocument = { editor, spans: [] };
            this.trackedDocuments.set(editor.document, trackedDocument);
        }

        this.active = trackedDocument;
    }

    /**
     * Validates selection shape and rebuilds tracked spans for synchronized edits.
     */
    private updateActiveSpans(selections: readonly vscode.Selection[]): void {
        if (!this.active) {
            return;
        }

        const minSelections = getSettingNumber("minSelections", DEFAULT_MIN_SELECTIONS);
        const maxSelections = getSettingNumber("maxSelections", DEFAULT_MAX_SELECTIONS);
        const boundedMin = minSelections;
        const boundedMax = Math.max(boundedMin, maxSelections);

        if (!isTrackableSelectionSet(selections as readonly SelectionLike[], boundedMin, boundedMax)) {
            this.active.spans = [];
            return;
        }

        // Keep existing spans while typing (selections usually collapse to cursors).
        if (selections.every((selection) => selection.isEmpty)) {
            return;
        }

        const { document } = this.active.editor;
        this.active.spans = createTrackedSpans(selections as readonly SelectionLike[], (selection) =>
            document.getText(selection as vscode.Range),
        );
    }

    /**
     * Updates tracked spans from document changes and applies any mirrored edits.
     */
    private applyTextChanges(changes: readonly vscode.TextDocumentContentChangeEvent[]): void {
        if (!this.active) {
            return;
        }

        const result = applyContentChangesToSpans(this.active.spans, changes);
        this.active.spans = result.nextSpans;

        if (result.edits.length === 0) {
            return;
        }

        const editor = this.active.editor;
        void editor.edit(
            (editBuilder) => {
                result.edits.forEach((span) => {
                    editBuilder.replace(createRange(span.start, span.text), span.text);
                });
            },
            {
                undoStopAfter: false,
                undoStopBefore: false,
            },
        );
    }
}
