import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService.listForBar', () => {
  let prisma: PrismaService;
  let service: OrdersService;
  const configService = {
    get: jest.fn()
  } as unknown as ConfigService;

  beforeAll(async () => {
    prisma = new PrismaService({
      datasources: {
        db: {
          url: 'file:memdb1?mode=memory&cache=shared'
        }
      }
    });

    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Order";`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Bar";`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Bar" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "location" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT 1
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Order" (
        "id" TEXT PRIMARY KEY,
        "barId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "recipeId" TEXT,
        "amount" REAL NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'gbp',
        "status" TEXT NOT NULL DEFAULT 'created',
        "stripeSessionId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Order_barId_status_idx" ON "Order"("barId", "status");`
    );

    service = new OrdersService(prisma, configService);
  });

  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.bar.deleteMany();

    const bar = await prisma.bar.create({
      data: {
        id: 'bar_1',
        name: 'Demo Bar',
        slug: 'demo-bar',
        active: true
      }
    });

    await prisma.order.create({
      data: {
        id: 'order_created',
        barId: bar.id,
        sessionId: 'session_created',
        amount: new Prisma.Decimal('10.00'),
        currency: 'gbp',
        status: OrderStatus.created,
        createdAt: new Date('2024-01-01T10:00:00.000Z')
      }
    });

    await prisma.order.create({
      data: {
        id: 'order_paid',
        barId: bar.id,
        sessionId: 'session_paid',
        amount: new Prisma.Decimal('12.00'),
        currency: 'gbp',
        status: OrderStatus.paid,
        createdAt: new Date('2024-01-01T11:00:00.000Z')
      }
    });

    await prisma.order.create({
      data: {
        id: 'order_cancelled',
        barId: bar.id,
        sessionId: 'session_cancelled',
        amount: new Prisma.Decimal('8.00'),
        currency: 'gbp',
        status: OrderStatus.cancelled,
        createdAt: new Date('2024-01-01T09:30:00.000Z')
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists the most recent orders for a bar slug', async () => {
    const result = await service.listForBar('demo-bar');
    expect(result.items.map((item) => item.id)).toEqual([
      'order_paid',
      'order_created',
      'order_cancelled'
    ]);
  });

  it('supports filtering by order status', async () => {
    const result = await service.listForBar('demo-bar', OrderStatus.paid);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 'order_paid', status: OrderStatus.paid });
  });

  it('accepts a bar identifier', async () => {
    const bar = await prisma.bar.findFirstOrThrow({ where: { slug: 'demo-bar' } });
    const result = await service.listForBar(bar.id);
    expect(result.items).toHaveLength(3);
  });
});
