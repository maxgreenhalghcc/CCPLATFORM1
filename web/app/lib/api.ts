export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export function buildGuardHeaders(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_API_GUARD_TOKEN;
  if (!token) {
    return {};
  }
  const header = process.env.NEXT_PUBLIC_API_GUARD_HEADER ?? 'x-dev-auth';
  return { [header]: token };
}
