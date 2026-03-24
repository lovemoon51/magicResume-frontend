import React from "react";

export interface TitleCardProps {
  value: string;
  onChange: (title: string) => void;
}

export function TitleCard(props: TitleCardProps): React.ReactElement {
  const { value, onChange } = props;
  return (
    <section className="card">
      <h3>简历标题</h3>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="请输入简历标题"
      />
    </section>
  );
}
