import * as vscode from "vscode";
import {
  MARK_BRACKETS,
  MARK_COLORS,
  MARK_TYPES,
  markWrap,
  type MarkBracket,
  type MarkType,
} from "./presets";

const CUSTOM_COLOR_LABEL = "Enter hex / CSS…";

export async function promptMarkWrap(): Promise<
  { before: string; after: string } | undefined
> {
  const typePick = await vscode.window.showQuickPick(
    MARK_TYPES.map((t) => ({
      label: t,
      description: t === "bracket" ? "will ask for brackets" : undefined,
    })),
    {
      title: "Mark type",
      placeHolder: "Select Mark type",
      matchOnDescription: true,
    }
  );
  if (!typePick) {
    return undefined;
  }
  const type = typePick.label as MarkType;

  const colorItems = [
    ...MARK_COLORS.map((c) => ({ label: c })),
    {
      label: CUSTOM_COLOR_LABEL,
      description: "e.g. #2563eb or rgb(14 165 233)",
    },
  ];

  const colorPick = await vscode.window.showQuickPick(colorItems, {
    title: "Mark color",
    placeHolder: "Select color preset or enter custom",
    matchOnDescription: true,
  });
  if (!colorPick) {
    return undefined;
  }

  let color = colorPick.label;
  if (color === CUSTOM_COLOR_LABEL) {
    const custom = await vscode.window.showInputBox({
      title: "Custom Mark color",
      prompt: "CSS color (hex, rgb(), named…)",
      placeHolder: "#F08F87",
      validateInput: (v) =>
        v.trim().length === 0 ? "Color cannot be empty" : undefined,
    });
    if (custom === undefined) {
      return undefined;
    }
    color = custom.trim();
  }

  let brackets: MarkBracket | undefined;
  if (type === "bracket") {
    const bracketPick = await vscode.window.showQuickPick(
      MARK_BRACKETS.map((b) => ({
        label: b,
        description: b === "right" ? "default" : undefined,
      })),
      {
        title: "Mark brackets",
        placeHolder: "Select brackets (default: right)",
        matchOnDescription: true,
      }
    );
    if (!bracketPick) {
      return undefined;
    }
    brackets = bracketPick.label as MarkBracket;
  }

  return markWrap(type, color, brackets ?? "right");
}
