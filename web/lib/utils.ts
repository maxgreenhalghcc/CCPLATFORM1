// web/lib/utils.ts
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  return `${normalized}/v1`;
}

/**
 * fetchJson
 * - In development, if NEXT_PUBLIC_DEV_API_TOKEN is set and no Authorization header
 *   is present, attach `Bearer <token>` so the API dev-bypass works from the web app.
 */
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers((init.headers || {}) as HeadersInit);

  if (
    process.env.NODE_ENV !== 'production' &&
    !headers.has('authorization')
  ) {
    const devToken = process.env.NEXT_PUBLIC_DEV_API_TOKEN;
    if (devToken) {
      headers.set('authorization', `Bearer ${devToken}`);
    }
  }

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
