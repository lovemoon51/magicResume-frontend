import type { Mode } from "@magic/types/common";
import type { ExportStatus } from "@magic/types/export";
import type { ResumeAggregate } from "@magic/types/resume";

export interface ExportState {
  jobId: string;
  status: ExportStatus | "idle";
  downloadUrl: string;
  errorCode: string;
  errorMessage: string;
}

export interface ResumeEditorState {
  resume: ResumeAggregate | null;
  mode: Mode;
  dirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string;
  errorMessage: string;
  exportState: ExportState;
}

export type ResumeEditorListener = (state: ResumeEditorState) => void;

const initialState: ResumeEditorState = {
  resume: null,
  mode: "both",
  dirty: false,
  isLoading: false,
  isSaving: false,
  lastSavedAt: "",
  errorMessage: "",
  exportState: {
    jobId: "",
    status: "idle",
    downloadUrl: "",
    errorCode: "",
    errorMessage: ""
  }
};

export class ResumeEditorStore {
  private state: ResumeEditorState = { ...initialState };
  private readonly listeners = new Set<ResumeEditorListener>();

  getState(): ResumeEditorState {
    return this.state;
  }

  setState(patch: Partial<ResumeEditorState>): void {
    this.state = {
      ...this.state,
      ...patch
    };
    this.emit();
  }

  subscribe(listener: ResumeEditorListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.state = { ...initialState };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
