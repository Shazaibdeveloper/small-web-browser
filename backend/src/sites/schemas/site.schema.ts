// ============================================================================
// FILE: src/sites/schemas/site.schema.ts   (REPLACE THE WHOLE FILE)
// ============================================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'sites' })
export class Site {
  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  address: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  html: string;

  @Prop({ required: true })
  plainText: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ default: 1 })
  revision: number;
}

/**
 * `timestamps: true` adds createdAt/updatedAt at runtime only — Mongoose's
 * type helpers do not see them. Pinning them here, on the document type,
 * makes them visible to TypeScript everywhere the model is used, without
 * relying on class-field declarations (which `useDefineForClassFields` can
 * erase at runtime on TS 5 / target ES2022).
 */
export type SiteDocument = HydratedDocument<Site> & {
  createdAt: Date;
  updatedAt: Date;
};

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index(
  { title: 'text', plainText: 'text' },
  { weights: { title: 5, plainText: 1 }, name: 'site_full_text' },
);