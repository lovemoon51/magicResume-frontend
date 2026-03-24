import type { ResumeEditorActions } from "./resume-editor.actions";
import type { ResumeEditorStore } from "./resume-editor.store";

export interface AutoSaveSchedulerOptions {
  delayMs?: number;
}

export class AutoSaveScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly delayMs: number;
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly store: ResumeEditorStore,
    private readonly actions: ResumeEditorActions,
    options: AutoSaveSchedulerOptions = {}
  ) {
    this.delayMs = options.delayMs ?? 1200;
  }

  start(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = this.store.subscribe((state) => {
      if (!state.resume || !state.dirty || state.isSaving) {
        return;
      }
      this.schedule();
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.actions.saveNow();
    }, this.delayMs);
  }
}
