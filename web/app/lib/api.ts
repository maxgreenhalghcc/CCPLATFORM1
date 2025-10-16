export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export async function patchJson<T>(
  url: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...init,
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
