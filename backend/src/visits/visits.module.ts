// ============================================================================
// FILE: src/visits/visits.module.ts
// ============================================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SitesModule } from '../sites/sites.module';
import { Visit, VisitSchema } from './schemas/visit.schema';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
    SitesModule, // for SitesService, so a visit can snapshot the page
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}