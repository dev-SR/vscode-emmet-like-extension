import * as vscode from "vscode";
import { promptFenceLang, fenceTransform } from "./fenceWizard";
import { promptMarkWrap } from "./markWizard";
import {
  BUILTIN_PRESETS,
  parseUserPreset,
  type UserPresetConfig,
  type WrapPreset,
} from "./presets";
import {
  getSortMode,
  loadUsage,
  presetKey,
  recordUsage,
  sortByUsage,
} from "./usage";
import { requireSelections, wrapSelections, wrapSelectionsWith } from "./wrap";

const CUSTOM_MARK_ID = "__custom_mark__";
const CUSTOM_FENCE_ID = "__custom_fence__";

type PickItem = vscode.QuickPickItem & {
  kind?: vscode.QuickPickItemKind;
  preset?: WrapPreset;
  special?: typeof CUSTOM_MARK_ID | typeof CUSTOM_FENCE_ID;
  usageKey?: string;
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

function wizardItems(): PickItem[] {
  return [
    {
      label: "Custom Code Fence…",
      description: "Ask for language, then wrap with ```lang",
      detail: "Wizard",
      special: CUSTOM_FENCE_ID,
      usageKey: CUSTOM_FENCE_ID,
    },
    {
      label: "Custom Mark…",
      description: "Pick type, color, brackets",
      detail: "Wizard",
      special: CUSTOM_MARK_ID,
      usageKey: CUSTOM_MARK_ID,
    },
  ];
}

function buildPresetItems(): PickItem[] {
  const items: PickItem[] = [];

  for (const preset of BUILTIN_PRESETS) {
    items.push({
      label: preset.label,
      description: preset.description,
      detail: preset.detail,
      preset,
      usageKey: presetKey(preset.label, preset.detail),
    });
  }

  for (const preset of loadUserPresets()) {
    items.push({
      label: preset.label,
      description: preset.description,
      detail: preset.detail,
      preset,
      usageKey: presetKey(preset.label, preset.detail),
    });
  }

  return items;
}

function separator(label: string): PickItem {
  return {
    label,
    kind: vscode.QuickPickItemKind.Separator,
  };
}

function buildPickItems(context: vscode.ExtensionContext): PickItem[] {
  const presets = buildPresetItems();
  const wizards = wizardItems();
  const mode = getSortMode();

  if (mode === "default") {
    return [...presets, ...wizards];
  }

  const stats = loadUsage(context);
  const keyed = presets
    .filter((p): p is PickItem & { usageKey: string } => !!p.usageKey)
    .map((p) => ({ ...p, key: p.usageKey }));

  const sorted = sortByUsage(keyed, stats);
  const out: PickItem[] = [];
  let lastSection: "recent" | "frequent" | "all" | undefined;
  let hasPinned = false;

  for (const { section, item } of sorted) {
    if (section !== lastSection) {
      if (section === "recent") {
        out.push(separator("Recently used"));
        hasPinned = true;
      } else if (section === "frequent") {
        out.push(separator("Frequently used"));
        hasPinned = true;
      } else if (section === "all" && hasPinned) {
        out.push(separator("All presets"));
      }
      lastSection = section;
    }
    out.push(item);
  }

  out.push(separator("Wizards"));
  out.push(...wizards);
  return out;
}

async function applyPicked(
  context: vscode.ExtensionContext,
  ctx: { editor: vscode.TextEditor; selections: vscode.Selection[] },
  picked: PickItem
): Promise<void> {
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
    if (picked.usageKey) {
      await recordUsage(context, picked.usageKey);
    }
    return;
  }

  if (picked.special === CUSTOM_MARK_ID) {
    const wrap = await promptMarkWrap();
    if (!wrap) {
      return;
    }
    await wrapSelections(ctx.editor, ctx.selections, wrap.before, wrap.after);
    if (picked.usageKey) {
      await recordUsage(context, picked.usageKey);
    }
    return;
  }

  if (picked.preset) {
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
    } else {
      await wrapSelections(
        ctx.editor,
        ctx.selections,
        picked.preset.before,
        picked.preset.after
      );
    }
    if (picked.usageKey) {
      await recordUsage(context, picked.usageKey);
    }
  }
}

async function wrapSelectionCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const ctx = await requireSelections();
  if (!ctx) {
    return;
  }

  const picked = await vscode.window.showQuickPick(buildPickItems(context), {
    title: "Wrap Selection",
    placeHolder: "Search presets (Bold, fence ts, circle warning…)",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!picked || picked.kind === vscode.QuickPickItemKind.Separator) {
    return;
  }

  await applyPicked(context, ctx, picked);
}

async function wrapMarkCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const ctx = await requireSelections();
  if (!ctx) {
    return;
  }

  const wrap = await promptMarkWrap();
  if (!wrap) {
    return;
  }

  await wrapSelections(ctx.editor, ctx.selections, wrap.before, wrap.after);
  // Record under a synthetic key so "Wrap with Mark…" usage can surface as Custom Mark.
  await recordUsage(context, CUSTOM_MARK_ID);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("wrapSelection.wrap", () => {
      void wrapSelectionCommand(context);
    }),
    vscode.commands.registerCommand("wrapSelection.wrapMark", () => {
      void wrapMarkCommand(context);
    })
  );
}

export function deactivate(): void {}
