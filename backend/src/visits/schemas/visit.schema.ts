// ============================================================================
// FILE: src/visits/schemas/visit.schema.ts
// ============================================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VisitDocument = HydratedDocument<Visit>;

export type VisitTransition = 'typed' | 'link' | 'history';

/**
 * A recorded fact: this person arrived at this address at this time, and got
 * there this way.
 *
 * `title` / `html` / `authorId` are a *snapshot* of the page as it was at the
 * moment of arrival. That snapshot is what makes "restore on return" hold:
 * if you go back to a visit, you get the page you left, even if the author
 * has republished it since.
 *
 * `isError: true` means the address resolved to nowhere. The visit is still
 * recorded — you really did go there.
 */
@Schema({ timestamps: true, collection: 'visits' })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  address: string;

  @Prop({ type: Types.ObjectId, ref: 'Site', default: null })
  siteId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  authorId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  title: string | null;

  @Prop({ type: String, default: null })
  html: string | null;

  @Prop({
    type: String,
    enum: ['typed', 'link', 'history'],
    default: 'typed',
  })
  transition: VisitTransition;

  /** The visit this one was reached from, if any. */
  @Prop({ type: Types.ObjectId, ref: 'Visit', default: null })
  fromVisitId: Types.ObjectId | null;

  @Prop({ default: false })
  isError: boolean;

  /** Explicit so the seed can backdate an hour of history deterministically. */
  @Prop({ required: true, type: Date, index: true })
  visitedAt: Date;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

// The history query is always "this person, newest first".
VisitSchema.index({ userId: 1, visitedAt: -1 });