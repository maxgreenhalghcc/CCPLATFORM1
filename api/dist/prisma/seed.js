"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.bar.upsert({
        where: { slug: 'demo-bar' },
        update: {},
        create: { id: 'bar_1', name: 'Demo Bar', slug: 'demo-bar', active: true },
    });
}
main().catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map