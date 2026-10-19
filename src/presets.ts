export type WrapPreset = {
  label: string;
  description?: string;
  detail?: string;
  before: string;
  after: string;
};

export type MarkType =
  | "underline"
  | "circle"
  | "box"
  | "highlight"
  | "strike-through"
  | "crossed-off"
  | "bracket";

export type MarkBracket = "left" | "right" | "both";

export const MARK_TYPES: MarkType[] = [
  "underline",
  "circle",
  "box",
  "highlight",
  "strike-through",
  "crossed-off",
  "bracket",
];

export const MARK_COLORS: string[] = [
  // Semantic
  "default",
  "note",
  "tip",
  "info",
  "warning",
  "danger",
  "success",
  "accent",
  // Tailwind *-500 names
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  // Component default coral
  "#F08F87",
];

export const MARK_BRACKETS: MarkBracket[] = ["left", "right", "both"];

const FENCE_LANGS = [
  "ts",
  "tsx",
  "mdx",
  "md",
  "bash",
  "json",
  "css",
  "html",
  "csharp",
] as const;

/** Build Mark open/close tags matching site MDX attribute style. */
export function markWrap(
  type: MarkType,
  color: string,
  brackets?: MarkBracket
): { before: string; after: string } {
  const attrs: string[] = [`type="${type}"`];

  if (type === "bracket" && brackets) {
    if (brackets === "both") {
      attrs.push(`brackets={['left', 'right']}`);
    } else {
      attrs.push(`brackets="${brackets}"`);
    }
  }

  attrs.push(`color="${color}"`);

  return {
    before: `<Mark ${attrs.join(" ")}>`,
    after: `</Mark>`,
  };
}

/** Outer fence length long enough to nest any backticks in `text`. */
export function fenceForSelection(
  text: string,
  lang?: string
): { before: string; after: string } {
  const matches = text.match(/`+/g);
  const longest = matches
    ? Math.max(...matches.map((m) => m.length))
    : 0;
  const ticks = "`".repeat(Math.max(3, longest + 1));
  const langPart = lang && lang.trim() ? lang.trim() : "";
  return {
    before: `${ticks}${langPart}\n`,
    after: `\n${ticks}`,
  };
}

function fencePreset(lang: string | undefined): WrapPreset {
  const ticks = "```";
  const labelLang = lang ?? "(plain)";
  const before = lang ? `${ticks}${lang}\n` : `${ticks}\n`;
  return {
    label: `Code fence · ${labelLang}`,
    description: lang ? `\`\`\`${lang} … \`\`\`` : "``` … ```",
    detail: "Code fence",
    before,
    after: `\n${ticks}`,
  };
}

/** Inner formats nested inside `<Mark>` (markdown / HTML — not the Mark component). */
const INNER_FORMATS: { id: string; label: string; before: string; after: string }[] = [
  { id: "bold", label: "Bold", before: "**", after: "**" },
  { id: "italic", label: "Italic", before: "*", after: "*" },
  { id: "underline", label: "Underline", before: "<u>", after: "</u>" },
];

function buildMarkdownPresets(): WrapPreset[] {
  return [
    {
      label: "Bold",
      description: "**text**",
      detail: "Markdown",
      before: "**",
      after: "**",
    },
    {
      label: "Italic",
      description: "*text*",
      detail: "Markdown",
      before: "*",
      after: "*",
    },
    {
      label: "Bold+Italic",
      description: "***text***",
      detail: "Markdown",
      before: "***",
      after: "***",
    },
    {
      label: "Inline code",
      description: "`text`",
      detail: "Markdown",
      before: "`",
      after: "`",
    },
    {
      label: "Strikethrough",
      description: "~~text~~",
      detail: "Markdown",
      before: "~~",
      after: "~~",
    },
    {
      label: "HTML underline",
      description: "<u>text</u>",
      detail: "HTML",
      before: "<u>",
      after: "</u>",
    },
    {
      label: "HTML mark",
      description: "<mark>text</mark>",
      detail: "HTML",
      before: "<mark>",
      after: "</mark>",
    },
  ];
}

/**
 * Markdown / HTML combos only (no `<Mark>` component).
 * Underline here is always `<u>`, never the Mark stroke type.
 */
function buildFormatComboPresets(): WrapPreset[] {
  return [
    {
      label: "Bold + Underline",
      description: "**<u>text</u>**",
      detail: "Combo",
      before: "**<u>",
      after: "</u>**",
    },
    {
      label: "Italic + Underline",
      description: "*<u>text</u>*",
      detail: "Combo",
      before: "*<u>",
      after: "</u>*",
    },
    {
      label: "Bold + Italic + Underline",
      description: "***<u>text</u>***",
      detail: "Combo",
      before: "***<u>",
      after: "</u>***",
    },
    {
      label: "Bold + Strikethrough",
      description: "**~~text~~**",
      detail: "Combo",
      before: "**~~",
      after: "~~**",
    },
    {
      label: "Italic + Strikethrough",
      description: "*~~text~~*",
      detail: "Combo",
      before: "*~~",
      after: "~~*",
    },
    {
      label: "Underline + Strikethrough",
      description: "<u>~~text~~</u>",
      detail: "Combo",
      before: "<u>~~",
      after: "~~</u>",
    },
    {
      label: "Bold + HTML mark",
      description: "**<mark>text</mark>**",
      detail: "Combo",
      before: "**<mark>",
      after: "</mark>**",
    },
    {
      label: "Italic + HTML mark",
      description: "*<mark>text</mark>*",
      detail: "Combo",
      before: "*<mark>",
      after: "</mark>*",
    },
    {
      label: "Underline + HTML mark",
      description: "<u><mark>text</mark></u>",
      detail: "Combo",
      before: "<u><mark>",
      after: "</mark></u>",
    },
    {
      label: "Bold + Italic + HTML mark",
      description: "***<mark>text</mark>***",
      detail: "Combo",
      before: "***<mark>",
      after: "</mark>***",
    },
  ];
}

function nestInner(
  outer: { before: string; after: string },
  inner: { before: string; after: string }
): { before: string; after: string } {
  return {
    before: outer.before + inner.before,
    after: inner.after + outer.after,
  };
}

function buildFencePresets(): WrapPreset[] {
  return [
    fencePreset(undefined),
    ...FENCE_LANGS.map((lang) => fencePreset(lang)),
  ];
}

function pushMarkVariant(
  presets: WrapPreset[],
  typeLabel: string,
  detailGroup: string,
  outer: { before: string; after: string },
  inner?: { id: string; label: string; before: string; after: string }
): void {
  if (!inner) {
    presets.push({
      label: `Mark · ${typeLabel}`,
      description: `${outer.before}…${outer.after}`,
      detail: `Mark / ${detailGroup}`,
      before: outer.before,
      after: outer.after,
    });
    return;
  }

  const nested = nestInner(outer, inner);
  presets.push({
    label: `Mark+${inner.label} · ${typeLabel}`,
    description: `${nested.before}…${nested.after}`,
    detail: `Mark+${inner.label} / ${detailGroup}`,
    before: nested.before,
    after: nested.after,
  });
}

function buildMarkPresets(): WrapPreset[] {
  const presets: WrapPreset[] = [];
  const nonBracket = MARK_TYPES.filter((t) => t !== "bracket");
  const variants: (undefined | (typeof INNER_FORMATS)[number])[] = [
    undefined,
    ...INNER_FORMATS,
  ];

  for (const inner of variants) {
    for (const type of nonBracket) {
      for (const color of MARK_COLORS) {
        pushMarkVariant(
          presets,
          `${type} · ${color}`,
          type,
          markWrap(type, color),
          inner
        );
      }
    }

    for (const side of MARK_BRACKETS) {
      for (const color of MARK_COLORS) {
        pushMarkVariant(
          presets,
          `bracket (${side}) · ${color}`,
          "bracket",
          markWrap("bracket", color, side),
          inner
        );
      }
    }
  }

  return presets;
}

/** Built-in presets: markdown → combos → fences → Mark (+ nested formats). */
export const BUILTIN_PRESETS: WrapPreset[] = [
  ...buildMarkdownPresets(),
  ...buildFormatComboPresets(),
  ...buildFencePresets(),
  ...buildMarkPresets(),
];

export type UserPresetConfig = {
  label: string;
  description?: string;
  detail?: string;
  wrap: string | { before: string; after: string };
};

export function parseUserPreset(config: UserPresetConfig): WrapPreset | undefined {
  let before: string;
  let after: string;

  if (typeof config.wrap === "string") {
    const marker = "{text}";
    const idx = config.wrap.indexOf(marker);
    if (idx === -1) {
      return undefined;
    }
    before = config.wrap.slice(0, idx);
    after = config.wrap.slice(idx + marker.length);
  } else {
    before = config.wrap.before;
    after = config.wrap.after;
  }

  return {
    label: config.label,
    description: config.description,
    detail: config.detail ?? "User",
    before,
    after,
  };
}
