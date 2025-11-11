import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BarsService } from './bars.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BarsService', () => {
  let prisma: PrismaService;
  let service: BarsService;

  beforeAll(async () => {
    prisma = new PrismaService({
      datasources: {
        db: {
          url: 'file:bars-test?mode=memory&cache=shared'
        }
      }
    });

    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "BarSettings";`);
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
      CREATE TABLE "BarSettings" (
        "barId" TEXT PRIMARY KEY,
        "theme" TEXT NOT NULL,
        "introText" TEXT,
        "outroText" TEXT,
        "pricingPounds" DECIMAL(10,2) NOT NULL DEFAULT 12.0,
        FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    service = new BarsService(prisma);
  });

  beforeEach(async () => {
    await prisma.barSettings.deleteMany();
    await prisma.bar.deleteMany();

    await prisma.bar.create({
      data: {
        id: 'bar_demo',
        name: 'Demo Bar',
        slug: 'demo-bar',
        active: true,
        settings: {
          create: {
            theme: { primary: '#7c3aed', background: '#0b0b12', foreground: '#ffffff' },
            introText: 'Welcome',
            outroText: 'Cheers',
            pricingPounds: new Prisma.Decimal(12)
          }
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('prevents duplicate slugs on create', async () => {
    await expect(
      service.create({
        name: 'Duplicate Bar',
        slug: 'demo-bar',
        active: true
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents duplicate slugs on update', async () => {
    const other = await prisma.bar.create({
      data: {
        id: 'bar_second',
        name: 'Second Bar',
        slug: 'second-bar',
        active: true,
        settings: {
          create: {
            theme: { primary: '#ff5f5f', background: '#111111', foreground: '#ffffff' },
            pricingPounds: new Prisma.Decimal(11)
          }
        }
      }
    });

    await expect(service.update(other.id, { slug: 'demo-bar' })).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it('round-trips settings updates', async () => {
    const bar = await prisma.bar.findFirstOrThrow({ where: { slug: 'demo-bar' }, include: { settings: true } });

    const updated = await service.updateSettings(bar.id, {
      introText: 'New intro',
      pricingPounds: 13.5,
      theme: { primary: '#00a884', background: '#050505', foreground: '#f0f0f0', card: '#101010' }
    });

    expect(updated).toMatchObject({
      id: bar.id,
      introText: 'New intro',
      pricingPounds: 13.5,
      theme: expect.objectContaining({ primary: '#00a884' })
    });

    const persisted = await service.findSettings(bar.id);
    expect(persisted.pricingPounds).toBeCloseTo(13.5);
    expect(persisted.theme.primary).toEqual('#00a884');
  });
});
