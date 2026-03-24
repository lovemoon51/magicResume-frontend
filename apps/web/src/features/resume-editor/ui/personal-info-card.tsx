import React from "react";
import type { ResumeContactItem } from "@magic/types/resume";

export interface PersonalInfoCardProps {
  contacts: ResumeContactItem[];
  onChange: (item: ResumeContactItem) => void;
}

export function PersonalInfoCard(props: PersonalInfoCardProps): React.ReactElement {
  const { contacts, onChange } = props;

  return (
    <section className="card">
      <h3>个人信息</h3>
      {contacts.map((item) => (
        <div key={item.itemId} className="field-row">
          <label>{item.label}</label>
          <input
            value={item.value}
            onChange={(event) =>
              onChange({
                ...item,
                value: event.target.value
              })
            }
          />
        </div>
      ))}
    </section>
  );
}
