import { App, MarkdownView } from 'obsidian';

export class CursorJumper {
  constructor(private app: App) {}

  async jumpToNextCursorLocation(): Promise<void> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    if (!editor) return;

    // Move cursor to end of file
    const lastLine = editor.lastLine();
    const lastLineLength = editor.getLine(lastLine).length;
    editor.setCursor({ line: lastLine, ch: lastLineLength });
  }
}
