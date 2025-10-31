require('dotenv').config({ path: process.env.ENVFILE });
const jwt = require('jsonwebtoken');

function maybeDecodeBase64(secret) {
  // base64-ish? (A–Z a–z 0–9 + /), with proper padding
  const b64 = /^[A-Za-z0-9+/]+={0,2}$/;
  if (b64.test(secret) && (secret.length % 4 === 0)) {
    try { return Buffer.from(secret, 'base64'); } catch (_) {}
  }
  return secret;
}

const userId = process.argv[2];
const role   = process.argv[3] || 'admin';

if (!userId) {
  console.error('Usage: node tools/mint-jwt.js <userId> [role]');
  process.exit(1);
}

let secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET missing!');
  process.exit(1);
}

// Match the server if it decodes base64 first
secret = maybeDecodeBase64(secret);

// Optional verifier knobs if the server enforces them
const opt = { algorithm: 'HS256', expiresIn: '1h' };
if (process.env.JWT_ISSUER)   opt.issuer   = process.env.JWT_ISSUER;
if (process.env.JWT_AUDIENCE) opt.audience = process.env.JWT_AUDIENCE;

const payload = { sub: userId, email: 'admin@platform.bar', role };
process.stdout.write(jwt.sign(payload, secret, opt));