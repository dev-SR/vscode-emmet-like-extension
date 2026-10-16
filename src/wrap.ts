import * as vscode from "vscode";

export function getActiveEditor(): vscode.TextEditor | undefined {
  return vscode.window.activeTextEditor;
}

/** Non-empty selections on the active editor (all multi-cursors). */
export function getNonEmptySelections(
  editor: vscode.TextEditor
): vscode.Selection[] {
  return editor.selections.filter((s) => !s.isEmpty);
}

export async function requireSelections(): Promise<{
  editor: vscode.TextEditor;
  selections: vscode.Selection[];
} | undefined> {
  const editor = getActiveEditor();
  if (!editor) {
    void vscode.window.showWarningMessage("No active editor");
    return undefined;
  }

  const selections = getNonEmptySelections(editor);
  if (selections.length === 0) {
    void vscode.window.showWarningMessage("Select text to wrap");
    return undefined;
  }

  return { editor, selections };
}

export async function wrapSelections(
  editor: vscode.TextEditor,
  selections: vscode.Selection[],
  before: string,
  after: string
): Promise<boolean> {
  // Apply from bottom to top so earlier ranges stay valid.
  const ordered = [...selections].sort(
    (a, b) => b.start.compareTo(a.start)
  );

  return editor.edit((editBuilder) => {
    for (const selection of ordered) {
      const text = editor.document.getText(selection);
      editBuilder.replace(selection, `${before}${text}${after}`);
    }
  });
}

/** Wrap using a per-selection transform (e.g. dynamic fence length). */
export async function wrapSelectionsWith(
  editor: vscode.TextEditor,
  selections: vscode.Selection[],
  transform: (text: string) => { before: string; after: string }
): Promise<boolean> {
  const ordered = [...selections].sort(
    (a, b) => b.start.compareTo(a.start)
  );

  return editor.edit((editBuilder) => {
    for (const selection of ordered) {
      const text = editor.document.getText(selection);
      const { before, after } = transform(text);
      editBuilder.replace(selection, `${before}${text}${after}`);
    }
  });
}
