import React from "react";
import type { Mode } from "@magic/types/common";

export interface TopNavProps {
  mode: Mode;
  isSaving: boolean;
  onModeChange: (mode: Mode) => void;
  onSave: () => void;
  onExportPdf: () => void;
}

export function TopNav(props: TopNavProps): React.ReactElement {
  const { mode, isSaving, onModeChange, onSave, onExportPdf } = props;

  return (
    <header className="top-nav">
      <div className="top-nav__left">
        <strong>简历生成器</strong>
      </div>
      <div className="top-nav__right">
        <select
          value={mode}
          onChange={(event) => onModeChange(event.target.value as Mode)}
        >
          <option value="both">编辑 + 预览</option>
          <option value="edit">仅编辑</option>
          <option value="preview">仅预览</option>
        </select>
        <button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存"}
        </button>
        <button type="button" onClick={onExportPdf}>
          导出 PDF
        </button>
      </div>
    </header>
  );
}
