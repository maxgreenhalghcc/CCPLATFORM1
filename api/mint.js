const fs = require('fs');
const jwt = require('jsonwebtoken');

const envfile = process.env.ENVFILE || '../.env.development';
const txt = fs.readFileSync(envfile, 'utf8');
const m = txt.match(/^JWT_SECRET=(.*)$/m);
if (!m) { console.error('JWT_SECRET not found in ' + envfile); process.exit(1); }
const secret = m[1].trim();

const userId = process.argv[2];
const role = process.argv[3] || 'admin';
if (!userId) { console.error('Usage: node mint.js <userId> [role]'); process.exit(1); }

const payload = { sub: userId, email: 'admin@platform.bar', role };
const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h' });
process.stdout.write(token);
