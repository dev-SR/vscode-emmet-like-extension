import * as vscode from "vscode";
import { fenceForSelection } from "./presets";

export async function promptFenceLang(): Promise<string | undefined> {
  const lang = await vscode.window.showInputBox({
    title: "Code fence language",
    prompt: "Language tag for the fence (leave empty for plain ```)",
    placeHolder: "ts",
  });
  // undefined = cancelled; "" = plain fence
  return lang;
}

export function fenceTransform(lang: string | undefined) {
  return (text: string) => fenceForSelection(text, lang);
}
