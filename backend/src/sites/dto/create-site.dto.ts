// ============================================================================
// FILE: src/sites/dto/create-site.dto.ts
// ============================================================================
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSiteDto {
  /** The address somebody types: "tidepool.zz" */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  /** Raw HTML written by the author. Sanitized server-side before storage. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200_000)
  html: string;

  @IsMongoId()
  authorId: string;
}