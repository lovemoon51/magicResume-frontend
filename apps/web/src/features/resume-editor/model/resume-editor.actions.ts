import type { Mode } from "@magic/types/common";
import type {
  ResumeAggregate,
  ResumeContactItem,
  ResumeSectionItem,
  ResumeSectionType,
  SaveDraftResult
} from "@magic/types/resume";
import type { ResumeRepository } from "@web/entities/resume/api";
import type {
  ResumeDraftSnapshot,
  ResumeLocalStoragePort
} from "@web/entities/resume/storage";
import type { ResumeEditorStore } from "./resume-editor.store";

interface ResumeEditorActionsDeps {
  repository: ResumeRepository;
  localStorage: ResumeLocalStoragePort;
  store: ResumeEditorStore;
  now?: () => Date;
}

interface UpsertSectionInput {
  sectionType: ResumeSectionType;
  item: ResumeSectionItem;
}

export class ResumeEditorActions {
  private readonly now: () => Date;

  constructor(private readonly deps: ResumeEditorActionsDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async loadResume(resumeId: string): Promise<void> {
    this.deps.store.setState({ isLoading: true, errorMessage: "" });

    const draft = this.deps.localStorage.getDraft(resumeId);
    if (draft) {
      this.deps.store.setState({
        resume: draft.snapshot,
        dirty: draft.dirty,
        lastSavedAt: draft.savedAt,
        isLoading: false
      });
      return;
    }

    try {
      const resume = await this.deps.repository.getResume(resumeId);
      this.deps.store.setState({
        resume,
        dirty: false,
        isLoading: false,
        lastSavedAt: resume.updatedAt
      });
    } catch (error) {
      this.deps.store.setState({
        isLoading: false,
        errorMessage: this.getErrorMessage(error)
      });
    }
  }

  setMode(mode: Mode): void {
    this.deps.store.setState({ mode });

    const state = this.deps.store.getState();
    this.deps.localStorage.setUiPrefs({
      mode,
      lastTemplateId: state.resume?.templateId ?? ""
    });
  }

  setTitle(title: string): void {
    this.updateResume((resume) => ({
      ...resume,
      title
    }));
  }

  upsertContactItem(input: ResumeContactItem): void {
    this.updateResume((resume) => {
      const index = resume.basics.contacts.findIndex(
        (item) => item.itemId === input.itemId
      );
      if (index < 0) {
        return {
          ...resume,
          basics: {
            ...resume.basics,
            contacts: [...resume.basics.contacts, input]
          }
        };
      }

      const contacts = [...resume.basics.contacts];
      contacts[index] = input;
      return {
        ...resume,
        basics: {
          ...resume.basics,
          contacts
        }
      };
    });
  }

  upsertSectionItem(input: UpsertSectionInput): void {
    this.updateResume((resume) => {
      const sections = resume.sections.map((section) => {
        if (section.sectionType !== input.sectionType) {
          return section;
        }

        const index = section.items.findIndex(
          (item) => item.itemId === input.item.itemId
        );

        if (index >= 0) {
          const items = [...section.items];
          items[index] = input.item;
          return { ...section, items };
        }

        return {
          ...section,
          items: [...section.items, input.item]
        };
      });

      return {
        ...resume,
        sections
      };
    });
  }

  removeSectionItem(sectionType: ResumeSectionType, itemId: string): void {
    this.updateResume((resume) => ({
      ...resume,
      sections: resume.sections.map((section) => {
        if (section.sectionType !== sectionType) {
          return section;
        }
        return {
          ...section,
          items: section.items.filter((item) => item.itemId !== itemId)
        };
      })
    }));
  }

  async saveNow(): Promise<SaveDraftResult | null> {
    const state = this.deps.store.getState();
    if (!state.resume) {
      return null;
    }

    this.deps.store.setState({
      isSaving: true,
      errorMessage: ""
    });

    const payload = {
      baseVersion: state.resume.version,
      snapshot: state.resume,
      clientTs: this.now().toISOString()
    } as const;

    try {
      const result = await this.deps.repository.saveDraft(
        state.resume.resumeId,
        payload
      );

      const nextResume: ResumeAggregate = {
        ...state.resume,
        version: result.savedVersion,
        updatedAt: result.updatedAt
      };

      const draftSnapshot: ResumeDraftSnapshot = {
        resumeId: nextResume.resumeId,
        version: nextResume.version,
        dirty: false,
        snapshot: nextResume,
        savedAt: result.updatedAt
      };

      this.deps.localStorage.setDraft(draftSnapshot);
      this.deps.store.setState({
        resume: nextResume,
        dirty: false,
        isSaving: false,
        lastSavedAt: result.updatedAt
      });

      return result;
    } catch (error) {
      this.deps.store.setState({
        isSaving: false,
        errorMessage: this.getErrorMessage(error)
      });
      return null;
    }
  }

  private updateResume(
    updater: (current: ResumeAggregate) => ResumeAggregate
  ): void {
    const current = this.deps.store.getState().resume;
    if (!current) {
      return;
    }

    const next = updater(current);
    const savedAt = this.now().toISOString();
    const draftSnapshot: ResumeDraftSnapshot = {
      resumeId: next.resumeId,
      version: next.version,
      dirty: true,
      snapshot: next,
      savedAt
    };

    this.deps.localStorage.setDraft(draftSnapshot);
    this.deps.store.setState({
      resume: next,
      dirty: true,
      lastSavedAt: savedAt
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return "unknown error";
  }
}
