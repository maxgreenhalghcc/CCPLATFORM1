import { createHmac } from 'crypto';

export interface JwtSignOptions {
  audience?: string;
  issuer?: string;
  expiresInSeconds?: number;
  subject?: string;
}

const base64UrlEncode = (input: Buffer | string): string => {
  const source = typeof input === 'string' ? Buffer.from(input) : input;
  return source
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const signJwtHS256 = (
  payload: Record<string, unknown>,
  secret: string,
  options: JwtSignOptions = {}
): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const issuedAt = Math.floor(Date.now() / 1000);
  const body: Record<string, unknown> = {
    iat: issuedAt,
    ...payload
  };

  if (options.audience) {
    body.aud = options.audience;
  }

  if (options.issuer) {
    body.iss = options.issuer;
  }

  if (options.subject) {
    body.sub = options.subject;
  }

  if (typeof options.expiresInSeconds === 'number') {{
    body.exp = issuedAt + options.expiresInSeconds;
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${signingInput}.${encodedSignature}`;
};
