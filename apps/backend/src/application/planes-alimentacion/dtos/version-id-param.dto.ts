import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Path param DTO para `PUT /version/:versionId/feedback`.
 * El controller debe resolver feedbackId a partir de versionId y pasarlo al use-case.
 */
export class VersionIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  versionId: number;
}
