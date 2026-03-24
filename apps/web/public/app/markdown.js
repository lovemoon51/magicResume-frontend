import { escapeHtml } from "./helpers.js";

export function getToastEditorConstructor() {
  const editorConstructor = globalThis.toastui?.Editor;
  return typeof editorConstructor === "function" ? editorConstructor : null;
}

export function createMarkdownTools() {
  let markdownViewer = null;

  function markdownToHtml(input) {
    const source = String(input || "");
    const viewer = getMarkdownViewer();
    if (viewer && typeof viewer.setMarkdown === "function" && typeof viewer.getHTML === "function") {
      viewer.setMarkdown(source);
      const html = viewer.getHTML();
      if (html) {
        return html;
      }
    }

    return fallbackMarkdownToHtml(source);
  }

  function getMarkdownViewer() {
    if (markdownViewer) {
      return markdownViewer;
    }

    const editorConstructor = getToastEditorConstructor();
    if (!editorConstructor || typeof editorConstructor.factory !== "function") {
      return null;
    }

    const hiddenContainer = document.createElement("div");
    hiddenContainer.setAttribute("aria-hidden", "true");
    hiddenContainer.style.position = "fixed";
    hiddenContainer.style.left = "-99999px";
    hiddenContainer.style.top = "-99999px";
    hiddenContainer.style.width = "0";
    hiddenContainer.style.height = "0";
    hiddenContainer.style.overflow = "hidden";
    document.body.appendChild(hiddenContainer);

    try {
      markdownViewer = editorConstructor.factory({
        el: hiddenContainer,
        viewer: true,
        usageStatistics: false,
        initialValue: ""
      });
    } catch {
      markdownViewer = null;
    }

    return markdownViewer;
  }

  function fallbackMarkdownToHtml(input) {
    const lines = String(input || "").replace(/\r/g, "").split("\n");
    let html = "";
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        closeLists();
        continue;
      }

      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (inOl) {
          html += "</ol>";
          inOl = false;
        }
        if (!inUl) {
          html += "<ul>";
          inUl = true;
        }
        html += `<li>${inlineMarkdownToHtml(ulMatch[1])}</li>`;
        continue;
      }

      const olMatch = line.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (inUl) {
          html += "</ul>";
          inUl = false;
        }
        if (!inOl) {
          html += "<ol>";
          inOl = true;
        }
        html += `<li>${inlineMarkdownToHtml(olMatch[1])}</li>`;
        continue;
      }

      closeLists();
      html += `<p>${inlineMarkdownToHtml(line)}</p>`;
    }

    closeLists();
    return html || "<p>暂无内容</p>";
  }

  function inlineMarkdownToHtml(input) {
    let output = escapeHtml(input);
    output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/\*(.+?)\*/g, "<em>$1</em>");
    output = output.replace(/`(.+?)`/g, "<code>$1</code>");
    return output;
  }

  return {
    markdownToHtml
  };
}
