// ============================================================================
// FILE: src/visits/visits.controller.ts
// ============================================================================
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /** GET /api/visits?userId=...&limit=&skip=&q= — the history panel. */
  @Get()
  history(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('q') q?: string,
  ) {
    return this.visitsService.history(userId, {
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
      q,
    });
  }

  /** GET /api/visits/:id — restore a visit, page and all. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  /** POST /api/visits — record an arrival. */
  @Post()
  record(@Body() dto: CreateVisitDto) {
    return this.visitsService.record(dto);
  }

  /** DELETE /api/visits?userId=... — clear one person's history. */
  @Delete()
  clear(@Query('userId') userId: string) {
    return this.visitsService.clear(userId);
  }
}