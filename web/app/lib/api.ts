import * as Sentry from '@sentry/nextjs';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Creates a compact request identifier combining the current timestamp and a random suffix.
 *
 * @returns A string formed by the base36-encoded current epoch milliseconds followed by a base36 random segment (no leading "0.").
 */
function generateRequestId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/**
 * Produce a string representation of a fetch target.
 *
 * @param input - The fetch target, which may be a URL instance, a request-like object, or a string.
 * @returns The target as a string: the original string, the `URL` string, the `Request`'s `url`, or `'unknown'` if no string form is available.
 */
function normaliseTarget(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  if (typeof (input as Request).url === 'string') {
    return (input as Request).url;
  }
  return 'unknown';
}

/**
 * Get the API base URL used by the application.
 *
 * @returns The value of the `NEXT_PUBLIC_API_BASE_URL` environment variable if defined, otherwise `"http://localhost:4000"`.
 */
export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

/**
 * Ensures a request init contains an `x-request-id` header, adding a generated id when missing.
 *
 * @param init - Existing RequestInit to augment; existing headers and other fields are preserved.
 * @returns A new RequestInit identical to `init` but guaranteed to include the `x-request-id` header (preserves an existing header value, otherwise sets a newly generated id).
 */
export function withRequestId(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, generateRequestId());
  }
  return { ...init, headers };
}

/**
 * Performs a fetch to the given target, ensuring a request-id header is present and recording an API breadcrumb in Sentry.
 *
 * The function will add a `x-request-id` header if one is not already present and will create a Sentry breadcrumb containing the request target, HTTP status, and request id.
 *
 * @param input - The request target (URL or RequestInfo)
 * @param init - Optional fetch init overrides; headers may be augmented with a request id
 * @returns The Response returned by the underlying fetch call
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const prepared = withRequestId(init);
  const headers = new Headers(prepared.headers ?? undefined);
  const requestId = headers.get(REQUEST_ID_HEADER) ?? undefined;
  const response = await fetch(input, prepared);
  const echoedRequestId = response.headers.get(REQUEST_ID_HEADER) ?? requestId ?? undefined;

  Sentry.addBreadcrumb({
    category: 'api',
    message: normaliseTarget(input),
    level: 'info',
    data: {
      request_id: echoedRequestId,
      status: response.status,
    },
  });

  return response;
}

/**
 * Sends a JSON-encoded PATCH request to the specified URL and returns the parsed JSON response.
 *
 * @param url - The target URL for the PATCH request.
 * @param body - The value to serialize as the JSON request body.
 * @param init - Optional additional fetch options; merged into the request. The `Content-Type` header is set to `application/json` and the method is set to `PATCH`.
 * @returns The response body parsed as type `T`.
 * @throws Error when the response has a non-2xx status.
 */
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