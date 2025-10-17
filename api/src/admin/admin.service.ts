import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface RevenueSeriesPoint {
  date: string;
  value: number;
}

interface OrderSeriesPoint {
  date: string;
  count: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange(range?: string): DateRange {
    const fallbackDays = 30;
    const match = range?.match(/^(\d+)d$/i);
    const days = match ? parseInt(match[1], 10) : fallbackDays;
    const boundedDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : fallbackDays;
    const to = new Date();
    const from = new Date(to.getTime() - boundedDays * 24 * 60 * 60 * 1000);

    return {
      from,
      to,
      label: `${boundedDays}d`
    };
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  async getRevenue(barId?: string, range?: string) {
    const { from, to, label } = this.resolveRange(range);

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.paid,
        createdAt: {
          gte: from,
          lte: to
        },
        ...(barId ? { barId } : {})
      },
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const seriesMap = new Map<string, number>();
    let total = 0;

    for (const order of orders) {
      const amount = order.amount.toNumber();
      total += amount;
      const key = this.toDateKey(order.createdAt);
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + amount);
    }

    const series: RevenueSeriesPoint[] = Array.from(seriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value: Number(value.toFixed(2))
      }));

    return {
      barId: barId ?? null,
      range: label,
      currency: 'GBP',
      total: Number(total.toFixed(2)),
      series
    };
  }

  async getOrders(barId?: string, range?: string) {
    const { from, to, label } = this.resolveRange(range);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        },
        ...(barId ? { barId } : {})
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const seriesMap = new Map<string, number>();

    for (const order of orders) {
      const key = this.toDateKey(order.createdAt);
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + 1);
    }

    const series: OrderSeriesPoint[] = Array.from(seriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count
      }));

    return {
      barId: barId ?? null,
      range: label,
      total: orders.length,
      series
    };
  }

  getIngredients(barId?: string, range?: string) {
    return {
      barId: barId ?? null,
      range: range ?? '30d',
      top: [
        { ingredient: 'Lime Juice', usageCount: 180 },
        { ingredient: 'Simple Syrup', usageCount: 150 },
        { ingredient: 'Gin', usageCount: 120 }
      ]
    };
  }
}
