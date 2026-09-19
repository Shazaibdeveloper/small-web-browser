// ============================================================================
// FILE: src/visits/dto/create-visit.dto.ts
// ============================================================================
import { IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { VisitTransition } from '../schemas/visit.schema';

/**
 * Note what is NOT here: 'back' and 'forward'.
 *
 * Going back and going forward do not create visits — a visit is an arrival
 * at an address, and back/forward move a cursor over arrivals that already
 * happened. That is why "forward can be lost": the session trail is
 * truncated when you navigate somewhere new, but the archive is not.
 */
export class CreateVisitDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  address: string;

  @IsOptional()
  @IsIn(['typed', 'link', 'history'] satisfies VisitTransition[])
  transition?: VisitTransition;

  /** The visit currently on screen when this one was triggered. */
  @IsOptional()
  @IsMongoId()
  fromVisitId?: string;
}