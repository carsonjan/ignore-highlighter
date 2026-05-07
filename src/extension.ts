import * as vscode from "vscode";
import ignore, { Ignore } from "ignore";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    const decorationProvider = new IgnoreDecorationProvider();

    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(decorationProvider),
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            decorationProvider.updateActiveIgnoreFile(editor?.document);
        }),
        vscode.workspace.onDidChangeTextDocument((event) => {
            decorationProvider.onDocumentChanged(event.document);
        }),
    );

    // Initialize with current editor
    decorationProvider.updateActiveIgnoreFile(
        vscode.window.activeTextEditor?.document,
    );
}

class IgnoreDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations: vscode.EventEmitter<
        vscode.Uri | vscode.Uri[] | undefined
    > = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations: vscode.Event<
        vscode.Uri | vscode.Uri[] | undefined
    > = this._onDidChangeFileDecorations.event;

    private currentIgnore: Ignore | null = null;
    private activeIgnoreFileUri: vscode.Uri | null = null;
    private activeIgnoreFileDir: string | null = null;

    updateActiveIgnoreFile(document: vscode.TextDocument | undefined) {
        if (document && this.isIgnoreFile(document.fileName)) {
            const config = vscode.workspace.getConfiguration("ignoreHighlighter");
            const maxLines = config.get<number>("maxIgnoreLines", 5000);

            if (document.lineCount > maxLines) {
                vscode.window.showErrorMessage(
                    `Ignore file is too large (${document.lineCount} lines). The limit is ${maxLines} lines. You can increase this in settings if needed.`,
                );
                return;
            }

            const text = document.getText();

            this.activeIgnoreFileUri = document.uri;
            this.activeIgnoreFileDir = path.dirname(document.uri.fsPath);
            this.currentIgnore = ignore().add(text);
            this._onDidChangeFileDecorations.fire(undefined); // Refresh all
        } else {
            if (this.currentIgnore !== null) {
                this.currentIgnore = null;
                this.activeIgnoreFileUri = null;
                this.activeIgnoreFileDir = null;
                this._onDidChangeFileDecorations.fire(undefined);
            }
        }
    }

    onDocumentChanged(document: vscode.TextDocument) {
        if (
            this.activeIgnoreFileUri &&
            document.uri.toString() === this.activeIgnoreFileUri.toString()
        ) {
            const config = vscode.workspace.getConfiguration("ignoreHighlighter");
            const maxLines = config.get<number>("maxIgnoreLines", 5000);

            if (document.lineCount > maxLines) {
                return; // Silent on edit to avoid spamming popups
            }
            const text = document.getText();
            this.currentIgnore = ignore().add(text);
            this._onDidChangeFileDecorations.fire(undefined);
        }
    }

    private isIgnoreFile(fileName: string): boolean {
        const baseName = path.basename(fileName);
        // Added 'i' flag for case-insensitivity (crucial for Windows/macOS)
        return /^\..*ignore$/i.test(baseName);
    }

    provideFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken,
    ): vscode.FileDecoration | undefined {
        if (!this.currentIgnore || !this.activeIgnoreFileDir) {
            return undefined;
        }

        const filePath = uri.fsPath;

        // Robust cross-platform relative path calculation
        // path.relative handles different drives on Windows (returns absolute path)
        // and provides '..' prefixes for paths outside the directory.
        let relativePath = path.relative(this.activeIgnoreFileDir, filePath);

        // 1. Check if outside or on a different drive
        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            return undefined;
        }

        // 2. The ignore package expects forward slashes regardless of OS
        if (path.sep !== "/") {
            relativePath = relativePath.split(path.sep).join("/");
        }

        // 3. Ignore the directory itself
        if (!relativePath || relativePath === "." || relativePath === "/") {
            return undefined;
        }

        // The ignore package's .ignores() method
        if (this.currentIgnore.ignores(relativePath)) {
            return {
                badge: "∅",
                tooltip: "Ignored by active ignore file",
                color: new vscode.ThemeColor(
                    "ignoreHighlighter.ignoredFileForeground",
                ),
                propagate: true,
            };
        }

        return undefined;
    }
}

export function deactivate() {}
