import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// web/lib/utils.ts
export async function apiFetch(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const headers = new Headers(init.headers || {});

  // Dev-only: forward the API dev token so the API guard bypass kicks in
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_API_TOKEN) {
    headers.set('Authorization', `Bearer ${process.env.DEV_API_TOKEN}`);
  }

  return fetch(`${base}/v1${path}`, { ...init, headers });
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
