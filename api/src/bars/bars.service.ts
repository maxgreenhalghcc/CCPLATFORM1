import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';

@Injectable()
export class BarsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return {
      items: [
        {
          id: 'sample-bar',
          name: 'Sample Bar',
          slug: 'sample-bar',
          location: 'London',
          active: true
        }
      ]
    };
  }

  create(dto: CreateBarDto) {
    return {
      id: dto.slug,
      ...dto,
      createdAt: new Date().toISOString()
    };
  }

  findOne(id: string) {
    return {
      id,
      name: 'Sample Bar',
      slug: id,
      location: 'London',
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  update(id: string, dto: UpdateBarDto) {
    return {
      id,
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  async findSettings(identifier: string) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }]
      },
      include: {
        settings: true
      }
    });

    if (!bar || !bar.settings) {
      throw new NotFoundException('Bar settings not found');
    }

    const pricing = typeof bar.settings.pricingPounds === 'number'
      ? bar.settings.pricingPounds
      : bar.settings.pricingPounds.toNumber();

    return {
      name: bar.name,
      slug: bar.slug,
      location: bar.location ?? null,
      introText: bar.settings.introText ?? null,
      outroText: bar.settings.outroText ?? null,
      theme: bar.settings.theme,
      pricingPounds: Number.isNaN(pricing) ? 0 : pricing
    };
  }

  updateSettings(id: string, dto: UpdateBarSettingsDto) {
    return {
      id,
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  createAssetUpload(id: string) {
    return {
      uploadUrl: `https://example.com/upload/${id}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
  }
}
