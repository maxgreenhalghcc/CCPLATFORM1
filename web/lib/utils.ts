import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});

  // In development, attach the dev bypass token if present and no auth header was provided.
  const devToken = process.env.NEXT_PUBLIC_DEV_API_TOKEN;
  if (process.env.NODE_ENV !== 'production' && devToken && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${devToken}`);
  }

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ThemeSettings {
  name: string;
  slug: string;
  theme: Record<string, string>;
}

export function themeToCssVars(theme: Record<string, string>): Record<string, string> {
  return Object.entries(theme).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[`--${key}`] = value;
    return acc;
  }, {});
}

export function getApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
