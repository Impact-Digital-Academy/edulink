import { Controller, Get, Header, Inject, Param } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service.js';

// Reference lists change rarely, so apps and proxies may cache them for an hour.
const CACHE = 'public, max-age=3600';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(@Inject(TaxonomyService) private readonly taxonomy: TaxonomyService) {}

  @Get()
  @Header('Cache-Control', CACHE)
  getAll() {
    return this.taxonomy.getBundle();
  }

  @Get('states/:stateCode/lgas')
  @Header('Cache-Control', CACHE)
  getLgas(@Param('stateCode') stateCode: string) {
    return this.taxonomy.getLgas(stateCode);
  }
}
