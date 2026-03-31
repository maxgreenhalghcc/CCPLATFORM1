import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayoutStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';

@Injectable()
export class IncentivesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tier CRUD ────────────────────────────────────────────────────────────

  async listTiers(barId: string) {
    await this.assertBarExists(barId);
    return this.prisma.incentiveTier.findMany({
      where: { barId },
      orderBy: [{ sortOrder: 'asc' }, { threshold: 'asc' }],
    });
  }

  async createTier(barId: string, dto: CreateTierDto) {
    await this.assertBarExists(barId);
    return this.prisma.incentiveTier.create({
      data: {
        barId,
        name: dto.name,
        threshold: dto.threshold,
        payoutAmount: new Prisma.Decimal(dto.payoutAmount),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateTier(barId: string, tierId: string, dto: UpdateTierDto) {
    await this.assertTierBelongsToBar(barId, tierId);
    return this.prisma.incentiveTier.update({
      where: { id: tierId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.threshold !== undefined && { threshold: dto.threshold }),
        ...(dto.payoutAmount !== undefined && {
          payoutAmount: new Prisma.Decimal(dto.payoutAmount),
        }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteTier(barId: string, tierId: string) {
    await this.assertTierBelongsToBar(barId, tierId);
    await this.prisma.incentiveTier.delete({ where: { id: tierId } });
    return { deleted: true };
  }

  // ── Baseline ─────────────────────────────────────────────────────────────

  async setBaseline(barId: string, baseline: number) {
    await this.assertBarExists(barId);
    await this.prisma.barSettings.update({
      where: { barId },
      data: { weeklyBaseline: baseline },
    });
    return { barId, baseline };
  }

  // ── Payouts ──────────────────────────────────────────────────────────────

  async listPayouts(status?: PayoutStatus) {
    const records = await this.prisma.weeklyPerformance.findMany({
      where: status ? { payoutStatus: status } : undefined,
      orderBy: { weekStart: 'desc' },
      include: {
        bar: { select: { id: true, name: true } },
        tierAchieved: { select: { name: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      barId: r.barId,
      barName: r.bar.name,
      weekStart: r.weekStart.toISOString().split('T')[0],
      fulfilledCount: r.fulfilledCount,
      baseline: r.baseline,
      percentageChange: Number(r.percentageChange),
      tierName: r.tierAchieved?.name ?? null,
      payoutAmount: Number(r.payoutAmount),
      payoutStatus: r.payoutStatus,
      paidAt: r.paidAt?.toISOString() ?? null,
    }));
  }

  async markPayoutPaid(weeklyPerformanceId: string) {
    const record = await this.prisma.weeklyPerformance.findUnique({
      where: { id: weeklyPerformanceId },
    });
    if (!record) throw new NotFoundException('Weekly performance record not found');

    const updated = await this.prisma.weeklyPerformance.update({
      where: { id: weeklyPerformanceId },
      data: { payoutStatus: PayoutStatus.PAID, paidAt: new Date() },
    });

    return {
      id: updated.id,
      payoutStatus: updated.payoutStatus,
      paidAt: updated.paidAt?.toISOString() ?? null,
    };
  }

  // ── Funnel analytics ─────────────────────────────────────────────────────

  async getFunnelForBar(barId: string, from: string, to: string) {
    await this.assertBarExists(barId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // extend toDate to end of day
    toDate.setHours(23, 59, 59, 999);

    const events = await this.prisma.funnelEvent.groupBy({
      by: ['eventType'],
      where: {
        barId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      _count: { eventType: true },
    });

    const eventOrder = [
      'PAGE_LOAD',
      'QUIZ_START',
      'QUIZ_COMPLETE',
      'ORDER_CREATED',
      'ORDER_PAID',
      'ORDER_FULFILLED',
    ];

    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.eventType] = e._count.eventType;
    }

    const steps = eventOrder.map((type, idx) => {
      const count = counts[type] ?? 0;
      const prevCount = idx > 0 ? (counts[eventOrder[idx - 1]] ?? 0) : null;
      const conversionRate =
        prevCount != null && prevCount > 0
          ? Math.round((count / prevCount) * 100)
          : null;
      return { eventType: type, count, conversionRate };
    });

    return { barId, from, to, steps };
  }

  async getFunnelSummary() {
    const weekStart = getWeekStart(new Date());

    const events = await this.prisma.funnelEvent.groupBy({
      by: ['barId', 'eventType'],
      where: { createdAt: { gte: weekStart } },
      _count: { eventType: true },
    });

    const bars = await this.prisma.bar.findMany({
      select: { id: true, name: true },
    });

    const barMap = new Map(bars.map((b) => [b.id, b.name]));
    const byBar = new Map<string, Record<string, number>>();

    for (const e of events) {
      if (!byBar.has(e.barId)) byBar.set(e.barId, {});
      byBar.get(e.barId)![e.eventType] = e._count.eventType;
    }

    return Array.from(byBar.entries()).map(([barId, counts]) => ({
      barId,
      barName: barMap.get(barId) ?? barId,
      weekStart: weekStart.toISOString().split('T')[0],
      counts,
    }));
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertBarExists(barId: string) {
    const bar = await this.prisma.bar.findUnique({ where: { id: barId } });
    if (!bar) throw new NotFoundException('Bar not found');
  }

  private async assertTierBelongsToBar(barId: string, tierId: string) {
    const tier = await this.prisma.incentiveTier.findUnique({ where: { id: tierId } });
    if (!tier || tier.barId !== barId) {
      throw new NotFoundException('Incentive tier not found for this bar');
    }
  }
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
