import * as vscode from "vscode";

export type UsageEntry = {
  count: number;
  lastUsed: number;
};

export type UsageStats = Record<string, UsageEntry>;

const STORAGE_KEY = "wrapSelection.usage";

export const RECENT_LIMIT = 10;
export const FREQUENT_LIMIT = 8;

export function loadUsage(context: vscode.ExtensionContext): UsageStats {
  const raw = context.globalState.get<UsageStats>(STORAGE_KEY);
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw;
}

export async function recordUsage(
  context: vscode.ExtensionContext,
  key: string
): Promise<void> {
  const stats = loadUsage(context);
  const prev = stats[key];
  stats[key] = {
    count: (prev?.count ?? 0) + 1,
    lastUsed: Date.now(),
  };
  await context.globalState.update(STORAGE_KEY, stats);
}

export function presetKey(label: string, detail?: string): string {
  return detail ? `${detail}::${label}` : label;
}

export type SortMode = "recentThenFrequent" | "default";

export function getSortMode(): SortMode {
  const mode = vscode.workspace
    .getConfiguration("wrapSelection")
    .get<string>("sortBy", "recentThenFrequent");
  return mode === "default" ? "default" : "recentThenFrequent";
}

/**
 * Reorder items: Recent → Frequent → All (original order).
 * Separators are inserted when sections are non-empty.
 * Items without usage stay in their relative original order in "All".
 */
export function sortByUsage<T extends { key: string }>(
  items: T[],
  stats: UsageStats,
  recentLimit = RECENT_LIMIT,
  frequentLimit = FREQUENT_LIMIT
): { section: "recent" | "frequent" | "all"; item: T }[] {
  const withStats = items
    .map((item) => ({ item, entry: stats[item.key] }))
    .filter((x): x is { item: T; entry: UsageEntry } => !!x.entry);

  const recent = [...withStats]
    .sort((a, b) => b.entry.lastUsed - a.entry.lastUsed)
    .slice(0, recentLimit)
    .map((x) => x.item);

  const recentKeys = new Set(recent.map((i) => i.key));

  const frequent = [...withStats]
    .filter((x) => !recentKeys.has(x.item.key))
    .sort(
      (a, b) =>
        b.entry.count - a.entry.count ||
        b.entry.lastUsed - a.entry.lastUsed
    )
    .slice(0, frequentLimit)
    .map((x) => x.item);

  const pinnedKeys = new Set([
    ...recent.map((i) => i.key),
    ...frequent.map((i) => i.key),
  ]);

  const rest = items.filter((i) => !pinnedKeys.has(i.key));

  const out: { section: "recent" | "frequent" | "all"; item: T }[] = [];
  for (const item of recent) {
    out.push({ section: "recent", item });
  }
  for (const item of frequent) {
    out.push({ section: "frequent", item });
  }
  for (const item of rest) {
    out.push({ section: "all", item });
  }
  return out;
}
