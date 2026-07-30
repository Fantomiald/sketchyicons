// Builds Shelfmate's icon set by taking lucide's geometry and drawing it by hand.
//
// The shapes come from lucide (ISC, © Lucide Icons and Contributors) because
// getting 82 glyphs right from nothing is weeks of work and theirs are already
// right. What they lack is a hand, so it is added here: straight runs bow into
// quadratics with an off-centre control point, every coordinate drifts a
// little, and the drift is seeded per icon so a rebuild produces exactly the
// same drawing.
//
// Nothing is written into src/ unless you ask for it:
//
//   node tools/roughen-icons.mjs --out /tmp/icons.tsx --json /tmp/icons.json
//   node tools/roughen-icons.mjs --out src/components/ui/icons.tsx   (when adopting)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const LUCIDE = new URL("../node_modules/lucide-react-native/dist/esm/icons", import.meta.url)
  .pathname;

const arg = (flag) => {
  const at = process.argv.indexOf(flag);
  return at > -1 ? process.argv[at + 1] : null;
};

const OUT = arg("--out");
const JSON_OUT = arg("--json");

if (!OUT && !JSON_OUT) {
  console.error("pass --out <file.tsx> and/or --json <file.json>");
  process.exit(1);
}

/** Every icon the app imports from lucide, as counted across src/. */
const COMPONENTS = [
  "AlertCircle", "ArrowRight", "ArrowUpRight", "AtSign", "Ban", "Bell", "BellOff",
  "BookCheck", "BookMarked", "BookOpen", "BookX", "Calendar", "CalendarDays", "Camera",
  "Check", "CheckCheck", "ChevronDown", "ChevronLeft", "ChevronRight", "CircleX", "Clock",
  "Compass", "Copy", "CornerUpLeft", "Crown", "Ellipsis", "EllipsisVertical",
  "ExternalLink", "EyeOff", "Feather", "FileText", "Flag", "Flame", "Globe", "Hash",
  "Heart", "HelpCircle", "Home", "ImageIcon", "ImagePlus", "ImageUp", "Images", "Info",
  "Lock", "LogOut", "Mail", "MapPin",
  "MessageCircle", "MessageCircleOff", "MessageSquare", "MessagesSquare", "Monitor",
  "Moon", "Pencil", "PenLine", "Plus", "PlusCircle", "Quote", "Radio", "Reply",
  "RotateCcw", "Search", "SearchX", "Send", "Settings", "Share2", "Shield", "ShieldCheck",
  "ShieldOff", "SmilePlus", "StickyNote", "Sun", "TicketCheck", "Trash2", "Trophy",
  "User", "UserPlus", "UserRoundPlus", "Users", "Video", "Vote", "WifiOff", "X",
  "Star", "Radio",
];

/** Lucide renamed these; the old export is an alias with no file of its own. */
const ALIASES = {
  ImageIcon: "image",
  AlertCircle: "circle-alert",
  HelpCircle: "circle-question-mark",
  PlusCircle: "circle-plus",
  Home: "house",
};

const kebab = (name) =>
  name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])(\d)/g, "$1-$2")
    .toLowerCase();

/**
 * How much hand each glyph can take.
 *
 * The rule: the simpler and more symmetric a shape, the less wobble it
 * tolerates. Everyone knows exactly what a plus or a chevron looks like, so a
 * shaky one reads as broken rather than as drawn — while a bin, a trophy or a
 * quill can wander and still look deliberate. Chrome is quiet, content has a
 * hand.
 */
const HAND = {
  quiet: { drift: 0.14, bow: 0.3 },
  some: { drift: 0.4, bow: 0.75 },
  loose: { drift: 0.8, bow: 1.5 },
};

const QUIET = new Set([
  "ArrowRight", "ArrowUpRight", "Check", "CheckCheck", "ChevronDown", "ChevronLeft",
  "ChevronRight", "CornerUpLeft", "Ellipsis", "EllipsisVertical", "ExternalLink", "Hash",
  "Home", "Info", "Lock", "Plus", "PlusCircle", "Search", "SearchX", "Settings", "Shield",
  "ShieldCheck", "ShieldOff", "Star", "X", "AlertCircle", "HelpCircle", "Ban", "Clock",
  "RotateCcw", "AtSign", "CircleX",
  // Both are built from runs far shorter than the drift they were given: the
  // quote marks are 1-unit segments between arcs, and smile-plus draws its eyes
  // as 0.01-unit lines and its cross as two 6-unit strokes. A segment cannot
  // wander further than its own length and still be the shape it was.
  "Quote",
  "SmilePlus",
]);

const LOOSE = new Set(["Flame", "Trophy", "Crown", "Feather", "Heart"]);

/** Icons that have a solid state, so the component may fill them. */
const FILLABLE = new Set(["Star", "Heart", "Flag"]);

/** How many numbers each path command takes. */
const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

// ── Reading lucide ──────────────────────────────────────────────────────

const num = (source, key) => {
  const match = source.match(new RegExp(`${key}:\\s*"?(-?[\\d.]+)"?`));
  return match ? Number(match[1]) : null;
};

function elementsOf(file) {
  const source = readFileSync(file, "utf8");
  const body = source.slice(source.indexOf("createLucideIcon("));
  const out = [];

  for (const match of body.matchAll(
    /\[\s*"(path|circle|line|rect|polyline|polygon|ellipse)",\s*\{([\s\S]*?)\}\s*\]/g,
  )) {
    const [, kind, attrs] = match;
    if (kind === "path") {
      const d = attrs.match(/d:\s*"([^"]+)"/);
      if (d) out.push(d[1]);
      continue;
    }
    if (kind === "circle" || kind === "ellipse") {
      const cx = num(attrs, "cx");
      const cy = num(attrs, "cy");
      const rx = kind === "circle" ? num(attrs, "r") : num(attrs, "rx");
      const ry = kind === "circle" ? num(attrs, "r") : num(attrs, "ry");
      const kx = rx * 0.5523;
      const ky = ry * 0.5523;
      out.push(
        `M${cx} ${cy - ry}C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
          `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
          `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}` +
          `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}Z`,
      );
      continue;
    }
    if (kind === "line") {
      out.push(
        `M${num(attrs, "x1")} ${num(attrs, "y1")}L${num(attrs, "x2")} ${num(attrs, "y2")}`,
      );
      continue;
    }
    if (kind === "rect") {
      const x = num(attrs, "x");
      const y = num(attrs, "y");
      const w = num(attrs, "width");
      const h = num(attrs, "height");
      out.push(`M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`);
      continue;
    }
    const points = attrs.match(/points:\s*"([^"]+)"/);
    if (points) {
      const pairs = points[1].trim().split(/[\s,]+/).map(Number);
      let d = `M${pairs[0]} ${pairs[1]}`;
      for (let i = 2; i < pairs.length; i += 2) d += `L${pairs[i]} ${pairs[i + 1]}`;
      out.push(kind === "polygon" ? `${d}Z` : d);
    }
  }
  return out;
}

// ── Drawing it by hand ──────────────────────────────────────────────────

function makeRandom(seedText) {
  let seed = 2166136261;
  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100000) / 100000;
  };
}

const round = (n) => Math.round(n * 100) / 100;
const inside = (n) => round(Math.min(23.2, Math.max(0.8, n)));

function roughen(d, random, drift, bow) {
  const wobble = () => (random() - 0.5) * 2 * drift;
  // SVG lets numbers run together when the decimal point separates them:
  // "3.5.7" is 3.5 then 0.7. A greedy [\d.]+ eats both into one token, which
  // becomes NaN, which react-native-svg reports as "invalid number" and then
  // draws nothing at all. Lucide uses this form.
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];

  let out = "";
  let at = 0;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let command = "";

  const take = () => {
    const value = Number(tokens[at++]);
    if (!Number.isFinite(value)) throw new Error(`bad number in path: ${d}`);
    return value;
  };
  const point = (relative) => {
    const x = take();
    const y = take();
    return relative ? [cx + x, cy + y] : [x, y];
  };

  while (at < tokens.length) {
    if (/[A-Za-z]/.test(tokens[at])) command = tokens[at++];
    const lower = command.toLowerCase();
    const relative = command === lower && command !== "Z";

    if (lower === "z") {
      // Closed by hand: the last stroke comes back to just past where it
      // started rather than snapping shut, so the corner shows a join.
      out +=
        `Q${round((cx + startX) / 2 + wobble())} ${round((cy + startY) / 2 + wobble())} ` +
        `${round(startX + wobble())} ${round(startY + wobble())}`;
      cx = startX;
      cy = startY;
      continue;
    }

    if (lower === "m") {
      const [x, y] = point(relative);
      out += `M${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      startX = x;
      startY = y;
      command = relative ? "l" : "L";
      continue;
    }

    if (lower === "l" || lower === "h" || lower === "v") {
      let x;
      let y;
      if (lower === "h") {
        const value = take();
        x = relative ? cx + value : value;
        y = cy;
      } else if (lower === "v") {
        const value = take();
        x = cx;
        y = relative ? cy + value : value;
      } else {
        [x, y] = point(relative);
      }
      // A straight run is what gives a set away, so it bows: the control point
      // sits off the midpoint, perpendicular to the line, by a fraction of its
      // own length. Long runs bow more than short ones.
      const dx = x - cx;
      const dy = y - cy;
      const length = Math.hypot(dx, dy) || 1;
      const swing = 0.35 + Math.min(length * 0.14, 1.5);
      const lean = ((random() - 0.5) * 2 * bow + (random() < 0.5 ? -0.35 : 0.35)) * swing;
      const mx = cx + dx / 2 + (-dy / length) * lean;
      const my = cy + dy / 2 + (dx / length) * lean;
      out += `Q${inside(mx)} ${inside(my)} ${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      continue;
    }

    if (lower === "c") {
      const [x1, y1] = point(relative);
      const [x2, y2] = point(relative);
      const [x, y] = point(relative);
      out +=
        `C${inside(x1 + wobble())} ${inside(y1 + wobble())} ` +
        `${inside(x2 + wobble())} ${inside(y2 + wobble())} ` +
        `${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      continue;
    }

    if (lower === "s" || lower === "q") {
      const [x1, y1] = point(relative);
      const [x, y] = point(relative);
      out +=
        `${lower === "s" ? "S" : "Q"}${inside(x1 + wobble())} ${inside(y1 + wobble())} ` +
        `${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      continue;
    }

    if (lower === "t") {
      const [x, y] = point(relative);
      out += `T${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      continue;
    }

    if (lower === "a") {
      const rx = take();
      const ry = take();
      const rotation = take();
      const large = take();
      const sweep = take();
      const [x, y] = point(relative);
      // Radii are left alone: nudging them turns a smooth arc into a kink.
      out +=
        `A${round(rx)} ${round(ry)} ${rotation} ${large} ${sweep} ` +
        `${inside(x + wobble())} ${inside(y + wobble())}`;
      cx = x;
      cy = y;
      continue;
    }

    at += 1;
  }

  return out;
}

// ── Checking ────────────────────────────────────────────────────────────

/** Walks a finished path the way a renderer does, and refuses anything odd. */
function validate(name, d) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
  if (!tokens.length) throw new Error(`${name}: empty path`);
  if (!/[Mm]/.test(tokens[0])) throw new Error(`${name}: path does not start with a moveto`);

  let at = 0;
  let command = "";
  let x = 0;
  let y = 0;

  const next = () => {
    const value = Number(tokens[at++]);
    if (!Number.isFinite(value)) throw new Error(`${name}: not a number in ${d}`);
    return value;
  };

  while (at < tokens.length) {
    if (/[A-Za-z]/.test(tokens[at])) command = tokens[at++];
    const lower = command.toLowerCase();
    const relative = command === lower && command !== "Z";
    if (lower === "z") continue;

    const need = ARGS[lower];
    if (need === undefined) throw new Error(`${name}: unknown command "${command}"`);

    // Only the point the pen ends on is bounded. Control points and relative
    // offsets are allowed to reach outside — that is how a curve is written.
    const args = [];
    for (let i = 0; i < need; i += 1) args.push(next());

    if (lower === "h") x = relative ? x + args[0] : args[0];
    else if (lower === "v") y = relative ? y + args[0] : args[0];
    else {
      x = relative ? x + args[need - 2] : args[need - 2];
      y = relative ? y + args[need - 1] : args[need - 1];
    }

    if (x < -1 || x > 25 || y < -1 || y > 25) {
      throw new Error(`${name}: the pen leaves the frame at ${x}, ${y}`);
    }
  }
}

// ── Emitting ────────────────────────────────────────────────────────────

const entries = [];
const missing = [];

for (const component of [...new Set(COMPONENTS)].sort()) {
  const file = ALIASES[component] ?? kebab(component);
  const path = `${LUCIDE}/${file}.js`;
  if (!existsSync(path)) {
    missing.push(`${component} (${file}.js)`);
    continue;
  }
  const source = elementsOf(path);
  if (!source.length) {
    missing.push(`${component} (empty)`);
    continue;
  }
  const key = QUIET.has(component) ? "quiet" : LOOSE.has(component) ? "loose" : "some";
  const hand = HAND[key];
  const random = makeRandom(component);
  const drawn = source.map((d) => roughen(d, random, hand.drift, hand.bow));
  for (const path of drawn) validate(component, path);
  entries.push({ component, hand: key, source, drawn });
}

if (missing.length) {
  console.error("missing or empty:\n  " + missing.join("\n  "));
  process.exit(1);
}

const body = entries
  .map(({ component, drawn }) => {
    const list = drawn.map((d) => `  "${d}",`).join("\n");
    const fill = FILLABLE.has(component) ? ", true" : "";
    return `export const ${component} = draw("${component}", [\n${list}\n]${fill});`;
  })
  .join("\n\n");

const component = `import React from "react";
import Svg, { Path } from "react-native-svg";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Shelfmate's icons: lucide's geometry, drawn by hand.
 *
 * Generated — regenerate with \`node tools/roughen-icons.mjs\` rather than
 * editing paths here. The shapes come from lucide (ISC, © Lucide Icons and
 * Contributors); the hand is added by the script: every straight run bows into
 * a curve with an off-centre control point and every coordinate drifts a
 * fraction of a unit, seeded per icon so a rebuild draws the same glyph.
 *
 * The props match lucide's — size, color, strokeWidth, fill — so swapping the
 * app over is an import change and nothing else.
 */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Only the glyphs with a solid state read this: star, heart, flag. */
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

export type IconComponent = (props: IconProps) => React.ReactElement;

function draw(name: string, paths: string[], fillable = false): IconComponent {
  const Icon = ({
    size = 24,
    color = "#2B2521",
    strokeWidth = 2,
    fill = "none",
    style,
  }: IconProps) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      pointerEvents="none"
      style={style}
    >
      {paths.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fillable ? fill : "none"}
        />
      ))}
    </Svg>
  );
  Icon.displayName = name;
  return Icon;
}

${body}
`;

if (OUT) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, component);
  console.log(`wrote ${entries.length} icons to ${OUT}`);
}

if (JSON_OUT) {
  mkdirSync(dirname(JSON_OUT), { recursive: true });
  writeFileSync(JSON_OUT, JSON.stringify(entries, null, 2));
  console.log(`dumped ${entries.length} icons to ${JSON_OUT}`);
}
