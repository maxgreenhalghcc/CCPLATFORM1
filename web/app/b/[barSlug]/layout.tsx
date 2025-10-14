import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { fetchJson, getApiUrl } from '@/lib/utils';

interface BarSettingsResponse {
  name: string;
  slug: string;
  theme: Record<string, string>;
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

function hexToHsl(value: string): Hsl {
  const hex = value.replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
  const r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
  const g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
  const b = Number.parseInt(expanded.slice(4, 6), 16) / 255;
  return rgbToHsl(r, g, b);
}

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

function clamp(value: string | number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.min(Math.max(numeric, min), max);
}

function adjustLightness(color: Hsl, amount: number): Hsl {
  return { h: color.h, s: color.s, l: Math.min(Math.max(color.l + amount, 0), 1) };
}

function surface(color: Hsl, amount: number): Hsl {
  const delta = color.l < 0.5 ? amount : -amount;
  return adjustLightness(color, delta);
}

function adjustSaturation(color: Hsl, factor: number): Hsl {
  return { h: color.h, s: Math.min(Math.max(color.s * factor, 0), 1), l: color.l };
}

function toHslVar(color: Hsl): string {
  const h = Math.round(((color.h % 360) + 360) % 360);
  const s = Math.round(color.s * 1000) / 10;
  const l = Math.round(color.l * 1000) / 10;
  return `${h} ${s}% ${l}%`;
}

function toHslColor(color: Hsl): string {
  return `hsl(${toHslVar(color)})`;
}

function readableForeground(color: Hsl): string {
  return color.l > 0.6 ? '0 0% 12%' : '0 0% 96%';
}

function subtleForeground(color: Hsl): string {
  return color.l > 0.6 ? '0 0% 35%' : '0 0% 85%';
}

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

export default async function BarLayout({ children, params }: BarLayoutProps) {
  const settings = await getBarSettings(params.barSlug);
  const cssVars = createThemeVars(settings.theme ?? {});

  return (
    <div className="min-h-screen bg-background text-foreground" style={cssVars}>
      {children}
    </div>
  );
}
