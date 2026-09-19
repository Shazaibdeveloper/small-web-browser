// ============================================================================
// FILE: src/sites/sites.controller.ts
// ============================================================================
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { CreateSiteDto } from './dto/create-site.dto';
import { SearchSiteDto } from './dto/search-site.dto';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  /** GET /api/sites — the index of the small web. */
  @Get()
  list() {
    return this.sitesService.list();
  }

  /**
   * GET /api/sites/search?q=...
   * Declared BEFORE ':address' so "search" is never read as an address.
   */
  @Get('search')
  search(@Query() dto: SearchSiteDto) {
    return this.sitesService.search(dto.q, dto.limit ?? 20);
  }

  /** GET /api/sites/:address — resolve an address. 200 with found:false if nowhere. */
  @Get(':address')
  resolve(@Param('address') address: string) {
    return this.sitesService.resolve(address);
  }

  /** POST /api/sites — publish. */
  @Post()
  publish(@Body() dto: CreateSiteDto) {
    return this.sitesService.publish(dto);
  }
}