const REQUEST_ID_HEADER = 'x-request-id';

function generateRequestId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export function withRequestId(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, generateRequestId());
  }
  return { ...init, headers };
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetch(input, withRequestId(init));
  return response;
}

export async function patchJson<T>(
  url: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  const initWithHeaders = init ? { ...init } : {};
  const headers = new Headers(initWithHeaders.headers ?? undefined);
  headers.set('Content-Type', 'application/json');
  initWithHeaders.headers = headers;

  const response = await apiFetch(url, {
    ...initWithHeaders,
    method: 'PATCH',
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
