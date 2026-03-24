import React from "react";
import { HttpResumeRepository } from "@web/entities/resume/api";
import { BrowserResumeLocalStorage } from "@web/entities/resume/storage";
import { ExportPdfUseCase } from "@web/features/export-pdf/model";
import {
  AutoSaveScheduler,
  ResumeEditorActions,
  ResumeEditorStore
} from "@web/features/resume-editor/model";
import { HttpClient } from "@web/shared/api";
import { TopNav } from "@web/shared/ui/top-nav";
import { EditorPanel } from "@web/widgets/editor-panel/ui";
import { PreviewPanel } from "@web/widgets/preview-panel/ui";

export interface ResumeBuilderPageProps {
  resumeId: string;
  apiBaseUrl?: string;
}

export function ResumeBuilderPage(props: ResumeBuilderPageProps): React.ReactElement {
  const { resumeId, apiBaseUrl = "" } = props;

  const store = React.useMemo(() => new ResumeEditorStore(), []);
  const localStorage = React.useMemo(() => new BrowserResumeLocalStorage(), []);
  const repository = React.useMemo(
    () => new HttpResumeRepository(new HttpClient({ baseUrl: apiBaseUrl })),
    [apiBaseUrl]
  );
  const actions = React.useMemo(
    () =>
      new ResumeEditorActions({
        repository,
        localStorage,
        store
      }),
    [localStorage, repository, store]
  );
  const autoSaveScheduler = React.useMemo(
    () => new AutoSaveScheduler(store, actions),
    [actions, store]
  );
  const exportUseCase = React.useMemo(
    () =>
      new ExportPdfUseCase({
        repository,
        store
      }),
    [repository, store]
  );
  const state = useResumeState(store);

  React.useEffect(() => {
    autoSaveScheduler.start();
    void actions.loadResume(resumeId);
    return () => {
      autoSaveScheduler.stop();
    };
  }, [actions, autoSaveScheduler, resumeId]);

  const onExportPdf = React.useCallback(async () => {
    if (!state.resume) {
      return;
    }
    const jobId = await exportUseCase.start(
      state.resume.resumeId,
      state.resume.templateId
    );
    await exportUseCase.waitUntilDone(jobId);
  }, [exportUseCase, state.resume]);

  return (
    <main className="resume-builder">
      <TopNav
        mode={state.mode}
        isSaving={state.isSaving}
        onModeChange={(mode) => actions.setMode(mode)}
        onSave={() => {
          void actions.saveNow();
        }}
        onExportPdf={() => {
          void onExportPdf();
        }}
      />
      <section className="split-layout">
        {state.mode !== "preview" ? (
          <EditorPanel resume={state.resume} actions={actions} />
        ) : null}
        {state.mode !== "edit" ? <PreviewPanel resume={state.resume} /> : null}
      </section>
    </main>
  );
}

function useResumeState(store: ResumeEditorStore) {
  const [state, setState] = React.useState(store.getState());

  React.useEffect(() => {
    return store.subscribe(setState);
  }, [store]);

  return state;
}
