export type PresetId = 'modern' | 'retro' | 'premium' | 'party' | 'local';
export type FinishType = 'soft-gloss' | 'matte' | 'high-gloss' | 'neon-glow' | 'warm-paper';

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  motionSpeed: number;
  springStiffness: number;
  springDamping: number;
  glowIntensity: number;
  shadowSoftness: string;
  surfaceBlur: string;
  borderAlpha: number;
  textureOpacity: number;
  radiusScale: number;
  finishType: FinishType;
  cssOverrides: Record<string, string>;
}

export const PRESETS: Record<PresetId, Preset> = {
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Sleek, crisp, Instagram-ready',
    motionSpeed: 1.0,
    springStiffness: 400,
    springDamping: 30,
    glowIntensity: 0.18,
    shadowSoftness: '24px',
    surfaceBlur: '14px',
    borderAlpha: 0.45,
    textureOpacity: 0.02,
    radiusScale: 1.0,
    finishType: 'soft-gloss',
    cssOverrides: {
      '--glow-intensity': '0.18',
      '--shadow-softness': '24px',
      '--surface-blur': '14px',
      '--border-alpha': '0.45',
      '--texture-opacity': '0.02',
      '--radius-scale': '1',
      '--motion-speed': '1',
    },
  },
  retro: {
    id: 'retro',
    label: 'Retro',
    description: 'Warm, atmospheric, classic',
    motionSpeed: 1.1,
    springStiffness: 280,
    springDamping: 36,
    glowIntensity: 0.08,
    shadowSoftness: '20px',
    surfaceBlur: '6px',
    borderAlpha: 0.55,
    textureOpacity: 0.05,
    radiusScale: 0.85,
    finishType: 'matte',
    cssOverrides: {
      '--glow-intensity': '0.08',
      '--shadow-softness': '20px',
      '--surface-blur': '6px',
      '--border-alpha': '0.55',
      '--texture-opacity': '0.05',
      '--radius-scale': '0.85',
      '--motion-speed': '1.1',
    },
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    description: 'Restrained luxury, crafted',
    motionSpeed: 1.25,
    springStiffness: 160,
    springDamping: 28,
    glowIntensity: 0.06,
    shadowSoftness: '32px',
    surfaceBlur: '18px',
    borderAlpha: 0.3,
    textureOpacity: 0.01,
    radiusScale: 0.9,
    finishType: 'high-gloss',
    cssOverrides: {
      '--glow-intensity': '0.06',
      '--shadow-softness': '32px',
      '--surface-blur': '18px',
      '--border-alpha': '0.3',
      '--texture-opacity': '0.01',
      '--radius-scale': '0.9',
      '--motion-speed': '1.25',
    },
  },
  party: {
    id: 'party',
    label: 'Party',
    description: 'Fast, vivid, high-energy',
    motionSpeed: 0.8,
    springStiffness: 480,
    springDamping: 26,
    glowIntensity: 0.28,
    shadowSoftness: '20px',
    surfaceBlur: '10px',
    borderAlpha: 0.6,
    textureOpacity: 0.02,
    radiusScale: 1.1,
    finishType: 'neon-glow',
    cssOverrides: {
      '--glow-intensity': '0.28',
      '--shadow-softness': '20px',
      '--surface-blur': '10px',
      '--border-alpha': '0.6',
      '--texture-opacity': '0.02',
      '--radius-scale': '1.1',
      '--motion-speed': '0.8',
    },
  },
  local: {
    id: 'local',
    label: 'Local',
    description: 'Warm, welcoming, dependable',
    motionSpeed: 1.05,
    springStiffness: 300,
    springDamping: 34,
    glowIntensity: 0.1,
    shadowSoftness: '18px',
    surfaceBlur: '8px',
    borderAlpha: 0.5,
    textureOpacity: 0.04,
    radiusScale: 1.05,
    finishType: 'warm-paper',
    cssOverrides: {
      '--glow-intensity': '0.1',
      '--shadow-softness': '18px',
      '--surface-blur': '8px',
      '--border-alpha': '0.5',
      '--texture-opacity': '0.04',
      '--radius-scale': '1.05',
      '--motion-speed': '1.05',
    },
  },
};

export const FONT_OPTIONS = [
  { key: 'inter', label: 'Inter', description: 'Modern & neutral', googleFont: 'Inter:wght@300;400;500;600;700' },
  { key: 'outfit', label: 'Outfit', description: 'Clean & contemporary', googleFont: 'Outfit:wght@300;400;500;600;700' },
  { key: 'dm-sans', label: 'DM Sans', description: 'Humanist & friendly', googleFont: 'DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..500' },
  { key: 'plus-jakarta', label: 'Plus Jakarta Sans', description: 'Elegant & refined', googleFont: 'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
  { key: 'sora', label: 'Sora', description: 'Bold & technical', googleFont: 'Sora:wght@300;400;500;600;700' },
  { key: 'fraunces', label: 'Fraunces', description: 'Serif accent (headings)', googleFont: 'Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..500' },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]['key'];

export function getPreset(id: string | null | undefined): Preset {
  return PRESETS[(id as PresetId) ?? 'modern'] ?? PRESETS.modern;
}

export function getFontGoogleUrl(fontKey: string | null | undefined): string | null {
  const option = FONT_OPTIONS.find((f) => f.key === fontKey);
  if (!option) return null;
  return `https://fonts.googleapis.com/css2?family=${option.googleFont}&display=swap`;
}

export function getFontFamilyValue(fontKey: string | null | undefined): string {
  const labels: Record<string, string> = {
    inter: "'Inter'",
    outfit: "'Outfit'",
    'dm-sans': "'DM Sans'",
    'plus-jakarta': "'Plus Jakarta Sans'",
    sora: "'Sora'",
    fraunces: "'Fraunces'",
  };
  return labels[fontKey ?? ''] ?? "'Inter'";
}
