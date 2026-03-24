import type { Mode } from "@magic/types/common";
import type { ResumeAggregate } from "@magic/types/resume";

export interface ResumeDraftSnapshot {
  resumeId: string;
  version: number;
  dirty: boolean;
  snapshot: ResumeAggregate;
  savedAt: string;
}

export interface ResumeUiPrefs {
  mode: Mode;
  lastTemplateId: string;
}

export interface ResumeLocalStoragePort {
  getDraft(resumeId: string): ResumeDraftSnapshot | null;
  setDraft(input: ResumeDraftSnapshot): void;
  getUiPrefs(): ResumeUiPrefs | null;
  setUiPrefs(input: ResumeUiPrefs): void;
  clearDraft(resumeId: string): void;
}

export class BrowserResumeLocalStorage implements ResumeLocalStoragePort {
  private readonly draftPrefix = "resume_draft_";
  private readonly uiPrefsKey = "resume_ui_prefs";

  getDraft(resumeId: string): ResumeDraftSnapshot | null {
    const raw = window.localStorage.getItem(this.buildDraftKey(resumeId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ResumeDraftSnapshot;
  }

  setDraft(input: ResumeDraftSnapshot): void {
    window.localStorage.setItem(
      this.buildDraftKey(input.resumeId),
      JSON.stringify(input)
    );
  }

  getUiPrefs(): ResumeUiPrefs | null {
    const raw = window.localStorage.getItem(this.uiPrefsKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ResumeUiPrefs;
  }

  setUiPrefs(input: ResumeUiPrefs): void {
    window.localStorage.setItem(this.uiPrefsKey, JSON.stringify(input));
  }

  clearDraft(resumeId: string): void {
    window.localStorage.removeItem(this.buildDraftKey(resumeId));
  }

  private buildDraftKey(resumeId: string): string {
    return `${this.draftPrefix}${resumeId}`;
  }
}

export class InMemoryResumeLocalStorage implements ResumeLocalStoragePort {
  private readonly store = new Map<string, string>();
  private readonly draftPrefix = "resume_draft_";
  private readonly uiPrefsKey = "resume_ui_prefs";

  getDraft(resumeId: string): ResumeDraftSnapshot | null {
    const raw = this.store.get(this.buildDraftKey(resumeId));
    return raw ? (JSON.parse(raw) as ResumeDraftSnapshot) : null;
  }

  setDraft(input: ResumeDraftSnapshot): void {
    this.store.set(this.buildDraftKey(input.resumeId), JSON.stringify(input));
  }

  getUiPrefs(): ResumeUiPrefs | null {
    const raw = this.store.get(this.uiPrefsKey);
    return raw ? (JSON.parse(raw) as ResumeUiPrefs) : null;
  }

  setUiPrefs(input: ResumeUiPrefs): void {
    this.store.set(this.uiPrefsKey, JSON.stringify(input));
  }

  clearDraft(resumeId: string): void {
    this.store.delete(this.buildDraftKey(resumeId));
  }

  private buildDraftKey(resumeId: string): string {
    return `${this.draftPrefix}${resumeId}`;
  }
}
