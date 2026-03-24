import type { ResumeAggregate } from "@magic/types/resume";

export interface ResumeDto {
  resume: ResumeAggregate;
}

export function mapResumeDtoToAggregate(dto: ResumeDto): ResumeAggregate {
  return dto.resume;
}

export function mapAggregateToResumeDto(resume: ResumeAggregate): ResumeDto {
  return { resume };
}
