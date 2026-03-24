import React from "react";
import type { ResumeAggregate } from "@magic/types/resume";

export interface PreviewPanelProps {
  resume: ResumeAggregate | null;
}

export function PreviewPanel(props: PreviewPanelProps): React.ReactElement {
  const { resume } = props;
  if (!resume) {
    return <section className="panel panel--preview">暂无预览数据</section>;
  }

  return (
    <section className="panel panel--preview">
      <h1>{resume.title}</h1>
      <ul>
        {resume.basics.contacts.map((item) => (
          <li key={item.itemId}>
            {item.label}: {item.value}
          </li>
        ))}
      </ul>
      {resume.sections.map((section) => (
        <article key={section.sectionType}>
          <h3>{toSectionName(section.sectionType)}</h3>
          <ul>
            {section.items.map((item) => (
              <li key={item.itemId}>
                <strong>{item.title}</strong> {item.description}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function toSectionName(sectionType: string): string {
  switch (sectionType) {
    case "education":
      return "教育背景";
    case "skill":
      return "专业技能";
    case "work":
      return "工作经历";
    default:
      return sectionType;
  }
}
