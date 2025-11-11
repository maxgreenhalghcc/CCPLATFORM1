"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.bar.upsert({
        where: { slug: 'demo-bar' },
        update: { name: 'Demo Bar', active: true },
        create: { id: 'bar_1', name: 'Demo Bar', slug: 'demo-bar', active: true },
    });
    try {
        await prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: { role: 'admin' },
            create: {
                id: 'user_admin_1',
                email: 'admin@example.com',
                role: 'admin',
                barId: 'bar_1',
            },
        });
    }
    catch {
    }
    console.log('Seed completed: demo-bar (and optional admin user) created.');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map