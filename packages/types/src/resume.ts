import type { IsoDateTime } from "./common.js";

export type ResumeSectionType = "education" | "skill" | "work";
export type ResumeModuleFormat = "markdown" | "richtext";

export interface ResumeContactItem {
  itemId: string;
  icon: string;
  label: string;
  value: string;
}

export interface ResumeBasics {
  avatarUrl: string;
  contacts: ResumeContactItem[];
}

export interface ResumeSectionItem {
  itemId: string;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  tags?: string[];
}

export interface ResumeSection {
  sectionType: ResumeSectionType;
  items: ResumeSectionItem[];
}

export interface ResumeModule {
  moduleId: string;
  heading: string;
  icon: string;
  subtitle: string;
  timeRange: string;
  format: ResumeModuleFormat;
  content: string;
  sectionType?: ResumeSectionType | "custom";
}

export interface ResumeAggregate {
  resumeId: string;
  userId: string;
  title: string;
  templateId: string;
  version: number;
  basics: ResumeBasics;
  sections: ResumeSection[];
  modules?: ResumeModule[];
  updatedAt: IsoDateTime;
}

export interface SaveDraftRequest {
  baseVersion: number;
  snapshot: ResumeAggregate;
  clientTs: IsoDateTime;
}

export interface SaveDraftResult {
  resumeId: string;
  savedVersion: number;
  updatedAt: IsoDateTime;
}

export interface ImportResumeRequest {
  sourceType: "json";
  payload: ResumeAggregate;
}

export interface ImportResumeResult {
  resumeId: string;
  version: number;
}
