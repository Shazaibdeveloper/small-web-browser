// ============================================================================
// FILE: src/visits/visits.service.ts
// ============================================================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { normalizeAddress, SitesService } from '../sites/sites.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Visit, VisitDocument } from './schemas/visit.schema';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    private readonly sitesService: SitesService,
  ) {}

  /**
   * Record an arrival. Resolves the address, snapshots whatever is there
   * (or records that nothing is), and hands back a fully renderable visit.
   */
  async record(dto: CreateVisitDto) {
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('Unknown person.');
    }

    const address = normalizeAddress(dto.address);
    if (!address) {
      throw new BadRequestException('An address is required.');
    }

    const site = await this.sitesService.findByAddress(address);

    const created = await this.visitModel.create({
      userId: new Types.ObjectId(dto.userId),
      address,
      siteId: site ? site._id : null,
      authorId: site ? site.authorId : null,
      title: site ? site.title : null,
      html: site ? site.html : null,
      transition: dto.transition ?? 'typed',
      fromVisitId:
        dto.fromVisitId && Types.ObjectId.isValid(dto.fromVisitId)
          ? new Types.ObjectId(dto.fromVisitId)
          : null,
      isError: !site,
      visitedAt: new Date(),
    });

    return this.toResult(created.toObject());
  }

  /**
   * The history panel: this person's arrivals, newest first.
   * Deliberately returns no HTML — forty-seven pages of markup is not a list.
   */
  async history(
    userId: string,
    opts: { limit?: number; skip?: number; q?: string } = {},
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Unknown person.');
    }

    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const skip = Math.max(opts.skip ?? 0, 0);

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    const q = (opts.q ?? '').trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ address: rx }, { title: rx }];
    }

    const [items, total] = await Promise.all([
      this.visitModel
        .find(filter)
        .sort({ visitedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.visitModel.countDocuments(filter),
    ]);

    return {
      total,
      limit,
      skip,
      items: items.map((v) => this.toSummary(v)),
    };
  }

  /** Restore-on-return: the exact page as it was when this visit happened. */
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No such visit.');
    }

    const visit = await this.visitModel.findById(id).lean();
    if (!visit) {
      throw new NotFoundException('No such visit.');
    }

    return this.toResult(visit);
  }

  /** Wipe one person's history. The sites are untouched. */
  async clear(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Unknown person.');
    }

    const { deletedCount } = await this.visitModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return { deleted: deletedCount ?? 0 };
  }

  private toSummary(v: any) {
    return {
      id: String(v._id),
      userId: String(v.userId),
      address: v.address,
      title: v.title,
      siteId: v.siteId ? String(v.siteId) : null,
      authorId: v.authorId ? String(v.authorId) : null,
      transition: v.transition,
      isError: v.isError,
      visitedAt: v.visitedAt,
    };
  }

  private toResult(v: any) {
    return {
      ...this.toSummary(v),
      html: v.html ?? null,
      fromVisitId: v.fromVisitId ? String(v.fromVisitId) : null,
    };
  }
}