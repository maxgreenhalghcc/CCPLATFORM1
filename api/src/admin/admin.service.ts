import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getRevenue(barId?: string, range?: string) {
    return {
      barId: barId ?? null,
      range: range ?? '30d',
      currency: 'GBP',
      total: 124500,
      series: Array.from({ length: 7 }).map((_, index) => ({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        value: 15000 - index * 2000
      }))
    };
  }

  getOrders(barId?: string, range?: string) {
    return {
      barId: barId ?? null,
      range: range ?? '30d',
      total: 245,
      series: Array.from({ length: 7 }).map((_, index) => ({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        count: 35 - index * 3
      }))
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
