import * as vscode from "vscode";

import { CaseSyncController } from "./controller.js";

/**
 * Activates case-sync listeners for editor and document lifecycle events.
 */
export function activate(context: vscode.ExtensionContext): void {
    const controller = new CaseSyncController();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(controller.onDidChangeActiveTextEditor, controller),
        vscode.window.onDidChangeTextEditorSelection(controller.onDidChangeTextEditorSelection, controller),
        vscode.workspace.onDidChangeTextDocument(controller.onDidChangeTextDocument, controller),
        vscode.workspace.onDidCloseTextDocument(controller.onDidCloseTextDocument, controller),
    );
}

/**
 * Deactivation hook (no-op because listeners are disposed via subscriptions).
 */
export function deactivate(): void {}
