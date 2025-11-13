"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwtHS256 = void 0;
const crypto_1 = require("crypto");
const base64UrlEncode = (input) => {
    const source = typeof input === 'string' ? Buffer.from(input) : input;
    return source
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};
const signJwtHS256 = (payload, secret, options = {}) => {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    const issuedAt = Math.floor(Date.now() / 1000);
    const body = {
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
    if (options.expiresInSeconds) {
        body.exp = issuedAt + options.expiresInSeconds;
    }
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(body));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = (0, crypto_1.createHmac)('sha256', secret)
        .update(signingInput)
        .digest();
    const encodedSignature = base64UrlEncode(signature);
    return `${signingInput}.${encodedSignature}`;
};
exports.signJwtHS256 = signJwtHS256;
//# sourceMappingURL=jwt.js.map