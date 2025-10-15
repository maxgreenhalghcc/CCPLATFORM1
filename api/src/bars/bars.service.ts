import { Injectable } from '@nestjs/common';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';

@Injectable()
export class BarsService {
  private readonly demoTheme = {
    'background': '0 0% 100%',
    'foreground': '224 71.4% 4.1%',
    'primary': '25 95% 53%',
    'primary-foreground': '26 83% 14%'
  };

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

  findSettings(id: string) {
    return {
      name: 'Sample Bar',
      slug: id,
      location: 'London',
      introText: 'Discover your perfect cocktail with our nine-question quiz.',
      outroText: 'Thanks for visiting our bar! Share your creation on socials.',
      theme: this.demoTheme,
      pricingCents: 1200
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
