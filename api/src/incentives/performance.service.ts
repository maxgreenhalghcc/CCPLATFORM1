import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { getWeekStart } from './incentives.service';

const COMPETITOR_LABELS = [
  'Competitor A', 'Competitor B', 'Competitor C', 'Competitor D',
  'Competitor E', 'Competitor F', 'Competitor G', 'Competitor H',
];

@Injectable()
export class PerformanceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PerformanceService.name);
  private lastRollupDate: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    // Check every 10 minutes whether a Monday-midnight rollup is due.
    setInterval(() => {
      void this.checkScheduledRollup();
    }, 10 * 60 * 1000);
  }

  private async checkScheduledRollup() {
    const now = new Date();
    // Monday = 1, first 10 minutes of the day
    if (now.getDay() !== 1 || now.getHours() !== 0) return;

    const todayKey = now.toISOString().split('T')[0];
    if (this.lastRollupDate === todayKey) return;

    this.lastRollupDate = todayKey;
    const prevMonday = new Date(getWeekStart(now));
    prevMonday.setDate(prevMonday.getDate() - 7);

    this.logger.log(`Running scheduled weekly rollup for week starting ${prevMonday.toISOString().split('T')[0]}`);
    await this.runWeeklyRollup(prevMonday);
  }

  // ── Current week performance ──────────────────────────────────────────────

  async getCurrentPerformance(barId: string) {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const fulfilledCount = await this.prisma.order.count({
      where: {
        barId,
        status: OrderStatus.fulfilled,
        fulfilledAt: { gte: weekStart, lt: weekEnd },
      },
    });

    const [tiers, settings] = await Promise.all([
      this.prisma.incentiveTier.findMany({
        where: { barId },
        orderBy: [{ sortOrder: 'asc' }, { threshold: 'asc' }],
      }),
      this.prisma.barSettings.findUnique({ where: { barId } }),
    ]);

    const baseline = settings?.weeklyBaseline ?? 0;
    const percentageChange =
      baseline > 0 ? Math.round(((fulfilledCount - baseline) / baseline) * 100) : 0;

    // Highest tier where threshold <= fulfilled count
    const currentTier = [...tiers].reverse().find((t) => t.threshold <= fulfilledCount) ?? null;
    const nextTier = tiers.find((t) => t.threshold > fulfilledCount) ?? null;

    return {
      barId,
      weekStart: weekStart.toISOString().split('T')[0],
      fulfilledCount,
      baseline,
      percentageChange,
      currentTier: currentTier
        ? { id: currentTier.id, name: currentTier.name, payoutAmount: Number(currentTier.payoutAmount) }
        : null,
      nextTier: nextTier
        ? {
            id: nextTier.id,
            name: nextTier.name,
            threshold: nextTier.threshold,
            payoutAmount: Number(nextTier.payoutAmount),
            remaining: nextTier.threshold - fulfilledCount,
          }
        : null,
      tiers: tiers.map((t) => ({
        id: t.id,
        name: t.name,
        threshold: t.threshold,
        payoutAmount: Number(t.payoutAmount),
        sortOrder: t.sortOrder,
      })),
      projectedPayout: currentTier ? Number(currentTier.payoutAmount) : 0,
    };
  }

  // ── History ───────────────────────────────────────────────────────────────

  async getHistory(barId: string, weeks = 12) {
    const records = await this.prisma.weeklyPerformance.findMany({
      where: { barId },
      orderBy: { weekStart: 'desc' },
      take: weeks,
      include: { tierAchieved: { select: { name: true, payoutAmount: true } } },
    });

    return records.map((r) => ({
      id: r.id,
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

  // ── Leaderboard ───────────────────────────────────────────────────────────

  async getLeaderboard() {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Fetch all bars with settings and fulfilled order counts for this week
    const bars = await this.prisma.bar.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        settings: {
          select: { weeklyBaseline: true, hideFromLeaderboard: true },
        },
      },
    });

    const results: Array<{
      barId: string;
      displayName: string;
      fulfilledCount: number;
      baseline: number;
      percentageChange: number;
      tierName: string | null;
      tierPayoutAmount: number;
      isHidden: boolean;
    }> = [];

    let hiddenIdx = 0;

    for (const bar of bars) {
      const fulfilledCount = await this.prisma.order.count({
        where: {
          barId: bar.id,
          status: OrderStatus.fulfilled,
          fulfilledAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const baseline = bar.settings?.weeklyBaseline ?? 0;
      const percentageChange =
        baseline > 0 ? Math.round(((fulfilledCount - baseline) / baseline) * 100) : 0;

      const tiers = await this.prisma.incentiveTier.findMany({
        where: { barId: bar.id },
        orderBy: [{ sortOrder: 'asc' }, { threshold: 'asc' }],
      });

      const currentTier = [...tiers].reverse().find((t) => t.threshold <= fulfilledCount) ?? null;

      const isHidden = bar.settings?.hideFromLeaderboard ?? false;
      const displayName = isHidden
        ? (COMPETITOR_LABELS[hiddenIdx++] ?? `Competitor ${hiddenIdx}`)
        : bar.name;

      results.push({
        barId: bar.id,
        displayName,
        fulfilledCount,
        baseline,
        percentageChange,
        tierName: currentTier?.name ?? null,
        tierPayoutAmount: currentTier ? Number(currentTier.payoutAmount) : 0,
        isHidden,
      });
    }

    // Sort by percentage change desc, then fulfilled count desc
    results.sort((a, b) => {
      if (b.percentageChange !== a.percentageChange) return b.percentageChange - a.percentageChange;
      return b.fulfilledCount - a.fulfilledCount;
    });

    return results.map((r, idx) => ({ rank: idx + 1, ...r }));
  }

  // ── Weekly rollup ─────────────────────────────────────────────────────────

  async runWeeklyRollup(weekStart?: Date) {
    // Default to previous week if not specified
    const targetWeekStart = weekStart ?? (() => {
      const prev = new Date(getWeekStart(new Date()));
      prev.setDate(prev.getDate() - 7);
      return prev;
    })();

    const weekEnd = new Date(targetWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const bars = await this.prisma.bar.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        settings: { select: { weeklyBaseline: true } },
        incentiveTiers: { orderBy: [{ sortOrder: 'asc' }, { threshold: 'asc' }] },
      },
    });

    const created: string[] = [];

    for (const bar of bars) {
      const fulfilledCount = await this.prisma.order.count({
        where: {
          barId: bar.id,
          status: OrderStatus.fulfilled,
          fulfilledAt: { gte: targetWeekStart, lt: weekEnd },
        },
      });

      if (fulfilledCount === 0) continue;

      let baseline = bar.settings?.weeklyBaseline ?? 0;
      let needsBaselineSave = false;

      if (baseline === 0) {
        // First week — use this week's count as baseline
        baseline = fulfilledCount;
        needsBaselineSave = true;
      }

      const percentageChange =
        baseline > 0
          ? new Prisma.Decimal(((fulfilledCount - baseline) / baseline) * 100).toDecimalPlaces(2)
          : new Prisma.Decimal(0);

      const currentTier =
        [...bar.incentiveTiers].reverse().find((t) => t.threshold <= fulfilledCount) ?? null;

      // Upsert to avoid duplicate runs
      await this.prisma.weeklyPerformance.upsert({
        where: { barId_weekStart: { barId: bar.id, weekStart: targetWeekStart } },
        create: {
          barId: bar.id,
          weekStart: targetWeekStart,
          fulfilledCount,
          baseline,
          percentageChange,
          tierAchievedId: currentTier?.id ?? null,
          payoutAmount: currentTier?.payoutAmount ?? new Prisma.Decimal(0),
        },
        update: {
          fulfilledCount,
          baseline,
          percentageChange,
          tierAchievedId: currentTier?.id ?? null,
          payoutAmount: currentTier?.payoutAmount ?? new Prisma.Decimal(0),
        },
      });

      if (needsBaselineSave && bar.settings) {
        await this.prisma.barSettings.update({
          where: { barId: bar.id },
          data: { weeklyBaseline: baseline },
        });
      }

      created.push(bar.id);
    }

    this.logger.log(
      `Weekly rollup complete for ${targetWeekStart.toISOString().split('T')[0]}: ${created.length} bars processed`,
    );

    return {
      weekStart: targetWeekStart.toISOString().split('T')[0],
      barsProcessed: created.length,
      barIds: created,
    };
  }
}
