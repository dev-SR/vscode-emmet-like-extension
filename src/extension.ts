import * as vscode from "vscode";
import { promptFenceLang, fenceTransform } from "./fenceWizard";
import { promptMarkWrap } from "./markWizard";
import {
  BUILTIN_PRESETS,
  parseUserPreset,
  type UserPresetConfig,
  type WrapPreset,
} from "./presets";
import { requireSelections, wrapSelections, wrapSelectionsWith } from "./wrap";

const CUSTOM_MARK_ID = "__custom_mark__";
const CUSTOM_FENCE_ID = "__custom_fence__";

type PickItem = vscode.QuickPickItem & {
  kind?: vscode.QuickPickItemKind;
  preset?: WrapPreset;
  special?: typeof CUSTOM_MARK_ID | typeof CUSTOM_FENCE_ID;
};

function loadUserPresets(): WrapPreset[] {
  const raw = vscode.workspace
    .getConfiguration("wrapSelection")
    .get<UserPresetConfig[]>("presets", []);

  const out: WrapPreset[] = [];
  for (const item of raw) {
    if (!item || typeof item.label !== "string") {
      continue;
    }
    const parsed = parseUserPreset(item);
    if (parsed) {
      out.push(parsed);
    }
  }
  return out;
}

function buildPickItems(): PickItem[] {
  const items: PickItem[] = [];

  for (const preset of BUILTIN_PRESETS) {
    items.push({
      label: preset.label,
      description: preset.description,
      detail: preset.detail,
      preset,
    });
  }

  for (const preset of loadUserPresets()) {
    items.push({
      label: preset.label,
      description: preset.description,
      detail: preset.detail,
      preset,
    });
  }

  items.push({
    label: "Custom Code Fence…",
    description: "Ask for language, then wrap with ```lang",
    detail: "Wizard",
    special: CUSTOM_FENCE_ID,
  });

  items.push({
    label: "Custom Mark…",
    description: "Pick type, color, brackets",
    detail: "Wizard",
    special: CUSTOM_MARK_ID,
  });

  return items;
}

async function wrapSelectionCommand(): Promise<void> {
  const ctx = await requireSelections();
  if (!ctx) {
    return;
  }

  const picked = await vscode.window.showQuickPick(buildPickItems(), {
    title: "Wrap Selection",
    placeHolder: "Search presets (Bold, fence ts, circle warning…)",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!picked) {
    return;
  }

  if (picked.special === CUSTOM_FENCE_ID) {
    const lang = await promptFenceLang();
    if (lang === undefined) {
      return;
    }
    await wrapSelectionsWith(
      ctx.editor,
      ctx.selections,
      fenceTransform(lang.trim() === "" ? undefined : lang.trim())
    );
    return;
  }

  if (picked.special === CUSTOM_MARK_ID) {
    const wrap = await promptMarkWrap();
    if (!wrap) {
      return;
    }
    await wrapSelections(ctx.editor, ctx.selections, wrap.before, wrap.after);
    return;
  }

  if (picked.preset) {
    // Built-in fence presets use fixed ```; bump length when selection nests fences.
    if (picked.preset.detail === "Code fence") {
      const langMatch = /^Code fence · (.+)$/.exec(picked.preset.label);
      const langLabel = langMatch?.[1];
      const lang =
        !langLabel || langLabel === "(plain)" ? undefined : langLabel;
      await wrapSelectionsWith(
        ctx.editor,
        ctx.selections,
        fenceTransform(lang)
      );
      return;
    }

    await wrapSelections(
      ctx.editor,
      ctx.selections,
      picked.preset.before,
      picked.preset.after
    );
  }
}

async function wrapMarkCommand(): Promise<void> {
  const ctx = await requireSelections();
  if (!ctx) {
    return;
  }

  const wrap = await promptMarkWrap();
  if (!wrap) {
    return;
  }

  await wrapSelections(ctx.editor, ctx.selections, wrap.before, wrap.after);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("wrapSelection.wrap", () => {
      void wrapSelectionCommand();
    }),
    vscode.commands.registerCommand("wrapSelection.wrapMark", () => {
      void wrapMarkCommand();
    })
  );
}

export function deactivate(): void {}
