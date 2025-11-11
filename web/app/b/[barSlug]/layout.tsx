import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { fetchJson, getApiUrl } from '@/lib/utils';

interface BarSettingsResponse {
  name: string;
  slug: string;
  theme: Record<string, string>;
  pricingPounds?: number | null;
}

interface BarLayoutProps {
  children: ReactNode;
  params: { barSlug: string };
}

type Hsl = {
  h: number;
  s: number;
  l: number;
};

const FALLBACK_THEME = {
  background: '#0b0b12',
  foreground: '#ffffff',
  primary: '#7c3aed',
  card: '#131321'
};

/**
 * Fetches the settings for a bar identified by its slug.
 *
 * @param barSlug - The bar's slug used to construct the settings API endpoint
 * @returns The fetched BarSettingsResponse
 * @throws Invokes `notFound()` and then throws the original error if the request fails, or a new `Error('Failed to load bar settings')` when the caught value is not an `Error`
 */
async function getBarSettings(barSlug: string): Promise<BarSettingsResponse> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/bars/${barSlug}/settings`;

  try {
    return await fetchJson<BarSettingsResponse>(url, { cache: 'no-store' });
  } catch (error) {
    notFound();
    throw error instanceof Error ? error : new Error('Failed to load bar settings');
  }
}

/**
 * Parse a CSS color string into an HSL object, using a fallback if parsing fails.
 *
 * Supports hexadecimal (e.g. `#abc` / `#aabbcc`), `hsl(...)`, space-separated `h s% l%`, and `rgb(...)` inputs.
 *
 * @param value - The input color string to parse. If `undefined` or not parseable, the `fallback` is used.
 * @param fallback - A guaranteed-valid color string to use when `value` is missing or cannot be parsed.
 * @returns An `Hsl` object with `h` in degrees [0,360), and `s` and `l` as fractions in [0,1].
 */
function parseColorToHsl(value: string | undefined, fallback: string): Hsl {
  if (!value) {
    return parseColorToHsl(fallback, fallback);
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith('#')) {
    return hexToHsl(normalized);
  }

  if (normalized.startsWith('hsl')) {
    const inside = normalized.slice(normalized.indexOf('(') + 1, normalized.lastIndexOf(')'));
    const parts = inside.split(/[,\s]+/).filter(Boolean);
    return parts.length >= 3
      ? {
          h: Number.parseFloat(parts[0]) || 0,
          s: clamp((parts[1] || '0').replace('%', ''), 0, 100) / 100,
          l: clamp((parts[2] || '0').replace('%', ''), 0, 100) / 100
        }
      : parseColorToHsl(fallback, fallback);
  }

  const spaceSeparated = normalized.split(/[\s]+/);
  if (spaceSeparated.length === 3 && spaceSeparated[1].includes('%')) {
    return {
      h: Number.parseFloat(spaceSeparated[0]) || 0,
      s: clamp(spaceSeparated[1].replace('%', ''), 0, 100) / 100,
      l: clamp(spaceSeparated[2].replace('%', ''), 0, 100) / 100
    };
  }

  if (normalized.startsWith('rgb')) {
    const inside = normalized.slice(normalized.indexOf('(') + 1, normalized.lastIndexOf(')'));
    const parts = inside.split(/[,\s]+/).filter(Boolean);
    if (parts.length >= 3) {
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseInt(part, 10) / 255);
      return rgbToHsl(r, g, b);
    }
  }

  return parseColorToHsl(fallback, fallback);
}

/**
 * Convert a hex color string to an HSL color object.
 *
 * @param value - Hex color string (with or without leading '#'); supports 3- or 6-digit hex notation
 * @returns HSL representation where `h` is in degrees [0, 360), and `s` and `l` are in the range [0, 1]
 */
function hexToHsl(value: string): Hsl {
  const hex = value.replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
  const r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
  const g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
  const b = Number.parseInt(expanded.slice(4, 6), 16) / 255;
  return rgbToHsl(r, g, b);
}

/**
 * Convert RGB components to an HSL color.
 *
 * @param r - Red component in the range 0 to 1
 * @param g - Green component in the range 0 to 1
 * @param b - Blue component in the range 0 to 1
 * @returns An `Hsl` object where `h` is hue in degrees [0,360), `s` is saturation in [0,1], and `l` is lightness in [0,1]
 */
function rgbToHsl(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
      default:
        h = 0;
    }

    h /= 6;
  }

  return { h: (h * 360) % 360, s, l };
}

/**
 * Constrains a numeric input to the inclusive range [min, max].
 *
 * @param value - A number or numeric string; non-numeric strings are treated as invalid and result in `min`.
 * @param min - Lower bound of the range.
 * @param max - Upper bound of the range.
 * @returns The input converted to a number and clamped between `min` and `max`.
 */
function clamp(value: string | number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
}

/**
 * Returns a new HSL color with its lightness increased or decreased by a given amount.
 *
 * @param color - Source HSL color; `h` is in degrees, `s` and `l` are in the range 0–1
 * @param amount - Amount to add to the color's lightness; may be negative to darken
 * @returns An HSL color with the same `h` and `s`, and `l` adjusted and clamped to 0–1
 */
function adjustLightness(color: Hsl, amount: number): Hsl {
  return { h: color.h, s: color.s, l: Math.min(Math.max(color.l + amount, 0), 1) };
}

/**
 * Adjusts an HSL color's lightness: lightens colors darker than midpoint and darkens colors lighter than midpoint.
 *
 * @param color - The source HSL color
 * @param amount - The amount to change lightness (0 to 1); added when `color.l < 0.5`, subtracted otherwise
 * @returns The resulting HSL color with adjusted lightness (clamped to the 0–1 range)
 */
function surface(color: Hsl, amount: number): Hsl {
  const delta = color.l < 0.5 ? amount : -amount;
  return adjustLightness(color, delta);
}

/**
 * Scale the saturation component of an HSL color by a multiplier.
 *
 * @param color - The source HSL color whose saturation will be adjusted.
 * @param factor - Multiplier applied to the saturation; values greater than 1 increase saturation, values between 0 and 1 decrease it.
 * @returns An `Hsl` with the same `h` and `l` as `color` and `s` scaled by `factor` and clamped to the range 0 to 1.
 */
function adjustSaturation(color: Hsl, factor: number): Hsl {
  return { h: color.h, s: Math.min(Math.max(color.s * factor, 0), 1), l: color.l };
}

/**
 * Format an HSL color into a space-separated string suitable for CSS custom properties.
 *
 * @param color - HSL components where `h` is in degrees and `s`/`l` are in the range 0–1
 * @returns A string in the form `h s% l%` with hue rounded to whole degrees and saturation/lightness as percentages rounded to one decimal place
 */
function toHslVar(color: Hsl): string {
  const h = Math.round(((color.h % 360) + 360) % 360);
  const s = Math.round(color.s * 1000) / 10;
  const l = Math.round(color.l * 1000) / 10;
  return `${h} ${s}% ${l}%`;
}

/**
 * Format an HSL triple as a CSS `hsl()` color string.
 *
 * @param color - HSL components: `h` in degrees, `s` and `l` as numbers in [0,1]
 * @returns A CSS color string like `hsl(120 50% 50%)`
 */
function toHslColor(color: Hsl): string {
  return `hsl(${toHslVar(color)})`;
}

/**
 * Choose a foreground HSL triplet appropriate for contrast against the given HSL background.
 *
 * @param color - Background color as an HSL object with `h`, `s`, and `l` components
 * @returns `'0 0% 12%'` for backgrounds with lightness greater than 0.6, `'0 0% 96%'` otherwise
 */
function readableForeground(color: Hsl): string {
  return color.l > 0.6 ? '0 0% 12%' : '0 0% 96%';
}

/**
 * Choose a subtle foreground HSL triplet based on the input color's lightness.
 *
 * @param color - HSL object where `h` is in degrees and `s`/`l` are in the range [0, 1]
 * @returns A string formatted as `h s% l%` suitable for use in CSS `hsl()`; returns `0 0% 35%` if `color.l > 0.6`, otherwise `0 0% 85%`
 */
function subtleForeground(color: Hsl): string {
  return color.l > 0.6 ? '0 0% 35%' : '0 0% 85%';
}

/**
 * Builds a set of CSS custom properties from a theme mapping, deriving sensible HSL-based fallbacks and color variants.
 *
 * @param theme - A mapping of semantic color keys (commonly `background`, `foreground`, `primary`, and optional `card`) to CSS color strings (hex, rgb, hsl, or space-separated H S L). Missing keys are filled from built-in defaults.
 * @returns A record whose keys are CSS custom property names (e.g. `--bg`, `--primary`, `--card`) and whose values are HSL-formatted strings suitable for inline `style` usage.
 */
function createThemeVars(theme: Record<string, string> = {}): Record<string, string> {
  const background = parseColorToHsl(theme.background, FALLBACK_THEME.background);
  const foreground = parseColorToHsl(theme.foreground, FALLBACK_THEME.foreground);
  const primary = parseColorToHsl(theme.primary, FALLBACK_THEME.primary);
  const providedCard = theme.card ? parseColorToHsl(theme.card, theme.card) : undefined;
  const cardBase = providedCard ?? adjustSaturation(surface(background, 0.08), 0.9);
  const secondary = adjustSaturation(surface(background, 0.05), 0.85);
  const muted = adjustSaturation(surface(background, 0.12), 0.6);
  const border = adjustSaturation(surface(background, 0.18), 0.55);
  const accent = adjustSaturation(surface(primary, 0.12), 0.85);

  return {
    '--bg': toHslColor(background),
    '--fg': toHslColor(foreground),
    '--primary': toHslVar(primary),
    '--primary-foreground': readableForeground(primary),
    '--background': toHslVar(background),
    '--foreground': toHslVar(foreground),
    '--secondary': toHslVar(secondary),
    '--secondary-foreground': readableForeground(secondary),
    '--muted': toHslVar(muted),
    '--muted-foreground': subtleForeground(muted),
    '--accent': toHslVar(accent),
    '--accent-foreground': readableForeground(accent),
    '--card': toHslVar(cardBase),
    '--card-foreground': readableForeground(cardBase),
    '--border': toHslVar(border),
    '--input': toHslVar(border),
    '--ring': toHslVar(primary),
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '0 0% 98%',
    '--radius': '0.75rem'
  };
}

/**
 * Server layout component that applies a bar's theme and renders its children.
 *
 * Fetches bar settings for the provided slug, derives CSS custom properties from the theme,
 * and wraps `children` in a full-page container with those variables applied.
 *
 * @param children - The content to render inside the themed layout.
 * @param params - Route parameters object.
 * @param params.barSlug - The bar identifier used to load its settings.
 * @returns A React element that wraps `children` with the bar's theme CSS variables applied.
 */
export default async function BarLayout({ children, params }: BarLayoutProps) {
  const settings = await getBarSettings(params.barSlug);
  const cssVars = createThemeVars(settings.theme ?? {});

  return (
    <div className="min-h-screen bg-background text-foreground" style={cssVars}>
      {children}
    </div>
  );
}