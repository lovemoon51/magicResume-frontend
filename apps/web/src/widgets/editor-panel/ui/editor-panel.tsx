import React from "react";
import type { ResumeAggregate } from "@magic/types/resume";
import { PersonalInfoCard, TitleCard } from "@web/features/resume-editor/ui";
import type { ResumeEditorActions } from "@web/features/resume-editor/model";

export interface EditorPanelProps {
  resume: ResumeAggregate | null;
  actions: ResumeEditorActions;
}

export function EditorPanel(props: EditorPanelProps): React.ReactElement {
  const { resume, actions } = props;

  if (!resume) {
    return <section className="panel panel--editor">加载中...</section>;
  }

  const contacts = resume.basics.contacts;

  return (
    <section className="panel panel--editor">
      <TitleCard value={resume.title} onChange={(title) => actions.setTitle(title)} />
      <PersonalInfoCard
        contacts={contacts}
        onChange={(item) => actions.upsertContactItem(item)}
      />
    </section>
  );
}
