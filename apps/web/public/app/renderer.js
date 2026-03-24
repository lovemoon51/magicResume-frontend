import {
  CONTACT_ICON_LIBRARY,
  CONTACT_ICON_MAP,
  MODULE_ICON_GLYPH,
  MODULE_ICON_OPTIONS,
  TOAST_TOOLBAR_ITEMS
} from "./constants.js";
import { getContactIconGlyph, isWebsiteContact, normalizeContactIcon } from "./contacts.js";
import { escapeHtml, getDisplayName, normalizeAvatarDisplayUrl, toSafeExternalUrl } from "./helpers.js";
import { getToastEditorConstructor } from "./markdown.js";

export function createRenderer(input) {
  const {
    state,
    el,
    getContactById,
    getModuleById,
    setStatus,
    markDirty,
    updateModuleField,
    markdownToHtml,
    syncLayout
  } = input;

  const moduleEditorInstances = new Map();

  function render() {
    if (!state.resume) {
      return;
    }

    if (typeof syncLayout === "function") {
      syncLayout();
    }

    el.titleInput.value = state.resume.title;
    el.versionText.textContent = String(state.resume.version);
    el.updatedAtText.textContent = state.resume.updatedAt;
    el.brandTag.textContent = getDisplayName(state.resume.title);

    renderAvatarPreview();
    renderContacts();
    renderModuleEditors();
    renderPreview();
    renderMode();
    renderIconModal();
  }

  function renderMode() {
    if (el.splitLayout instanceof HTMLElement) {
      el.splitLayout.classList.remove("mode-both", "mode-edit", "mode-preview");
      el.splitLayout.classList.add(`mode-${state.mode}`);
    }

    el.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === state.mode);
    });

    if (state.mode === "both") {
      if (el.splitLine instanceof HTMLElement) {
        el.splitLine.classList.remove("hidden");
      }
      el.editorPanel.classList.remove("hidden");
      el.previewPanel.classList.remove("hidden");
      return;
    }

    if (state.mode === "edit") {
      if (el.splitLine instanceof HTMLElement) {
        el.splitLine.classList.add("hidden");
      }
      el.editorPanel.classList.remove("hidden");
      el.previewPanel.classList.add("hidden");
      return;
    }

    if (el.splitLine instanceof HTMLElement) {
      el.splitLine.classList.add("hidden");
    }
    el.editorPanel.classList.add("hidden");
    el.previewPanel.classList.remove("hidden");
  }

  function renderAvatarPreview() {
    if (!state.resume) {
      return;
    }

    const avatarUrl = String(state.resume.basics.avatarUrl || "").trim();
    const displayAvatarUrl = normalizeAvatarDisplayUrl(avatarUrl);
    el.avatarInput.value = avatarUrl;

    setImageSource({
      imageEl: el.avatarPreview,
      fallbackEl: el.avatarFallback,
      src: displayAvatarUrl,
      onError: () => {
        if (avatarUrl) {
          setStatus("头像加载失败，请检查图片 URL 或改用本地上传");
        }
      }
    });

    setImageSource({
      imageEl: el.previewAvatar,
      fallbackEl: null,
      src: displayAvatarUrl
    });
  }

  function setImageSource(inputData) {
    const { imageEl, fallbackEl, src, onError } = inputData;
    if (!(imageEl instanceof HTMLImageElement)) {
      return;
    }

    if (!src) {
      imageEl.removeAttribute("src");
      imageEl.classList.add("hidden");
      if (fallbackEl instanceof HTMLElement) {
        fallbackEl.classList.remove("hidden");
      }
      return;
    }

    imageEl.onload = () => {
      imageEl.classList.remove("hidden");
      if (fallbackEl instanceof HTMLElement) {
        fallbackEl.classList.add("hidden");
      }
    };

    imageEl.onerror = () => {
      imageEl.classList.add("hidden");
      if (fallbackEl instanceof HTMLElement) {
        fallbackEl.classList.remove("hidden");
      }
      if (typeof onError === "function") {
        onError();
      }
    };

    imageEl.src = src;
  }

  function renderContacts() {
    if (!state.resume) {
      return;
    }

    el.contactList.innerHTML = state.resume.basics.contacts
      .map((item) => {
        const iconMeta = CONTACT_ICON_MAP[item.icon] || CONTACT_ICON_MAP.none;
        return `
        <div class="contact-row">
          <button
            class="contact-icon-btn"
            type="button"
            data-action="open-icon-picker"
            data-contact-id="${escapeHtml(item.itemId)}"
            title="切换图标（当前：${escapeHtml(iconMeta.label)}）"
          >
            ${escapeHtml(iconMeta.glyph)}
          </button>
          <div class="contact-field">
            <label>标签</label>
            <input
              class="inline-input"
              data-contact-id="${escapeHtml(item.itemId)}"
              data-field="label"
              value="${escapeHtml(item.label)}"
              placeholder="标签"
            />
          </div>
          <div class="contact-field">
            <label>内容</label>
            <input
              class="inline-input"
              data-contact-id="${escapeHtml(item.itemId)}"
              data-field="value"
              value="${escapeHtml(item.value)}"
              placeholder="内容"
            />
          </div>
          <button
            type="button"
            class="contact-remove"
            data-action="remove-contact"
            data-contact-id="${escapeHtml(item.itemId)}"
            title="删除信息"
          >
            ✕
          </button>
        </div>
      `;
      })
      .join("");
  }

  function renderPreview() {
    if (!state.resume) {
      return;
    }

    el.previewTitle.textContent = state.resume.title;
    el.previewContacts.innerHTML = state.resume.basics.contacts
      .map((item) => renderPreviewContact(item))
      .join("");

    el.previewModules.innerHTML = state.resume.modules
      .map((module) => {
        const contentHtml = markdownToHtml(module.content);
        return `
        <article class="preview-module">
          <div class="preview-module-header">
            <h2>${toModuleIconGlyph(module.icon)} ${escapeHtml(module.heading || "未命名模块")}</h2>
            <span class="preview-module-time">${escapeHtml(module.timeRange || "")}</span>
          </div>
          ${
            module.subtitle
              ? `<p class="preview-module-subtitle">${escapeHtml(module.subtitle)}</p>`
              : ""
          }
          <div class="preview-module-content">${contentHtml}</div>
        </article>
      `;
      })
      .join("");
  }

  function renderPreviewContact(item) {
    const iconGlyph = getContactIconGlyph(item.icon);
    const label = escapeHtml(item.label || "");
    const value = String(item.value || "").trim();

    let valueHtml = `<span>${escapeHtml(value)}</span>`;
    if (isWebsiteContact(item)) {
      const href = toSafeExternalUrl(value);
      if (href) {
        valueHtml = `<a class="preview-contact-link" href="${escapeHtml(
          href
        )}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
      }
    }

    return `
    <div class="preview-contact-item">
      <span class="preview-contact-icon">${escapeHtml(iconGlyph)}</span>
      <span class="preview-contact-label">${label}：</span>
      ${valueHtml}
    </div>
  `;
  }

  function renderIconModal() {
    if (!(el.iconModal instanceof HTMLElement)) {
      return;
    }

    if (!state.iconPicker.open) {
      el.iconModal.classList.add("hidden");
      return;
    }

    el.iconModal.classList.remove("hidden");
    el.iconSearchInput.value = state.iconPicker.keyword;
    renderIconGrid();
  }

  function renderIconGrid() {
    if (!(el.iconGrid instanceof HTMLElement) || !state.iconPicker.open) {
      return;
    }

    const contact = getContactById(state.iconPicker.targetContactId);
    const currentIcon = contact?.icon || "none";
    const keyword = state.iconPicker.keyword.trim().toLowerCase();

    const candidates = CONTACT_ICON_LIBRARY.filter((icon) => {
      if (!keyword) {
        return true;
      }
      const source = `${icon.value} ${icon.label} ${icon.keywords || ""}`.toLowerCase();
      return source.includes(keyword);
    });

    if (candidates.length === 0) {
      el.iconGrid.innerHTML = `<div class="icon-empty">未找到匹配图标</div>`;
      return;
    }

    el.iconGrid.innerHTML = candidates
      .map((icon) => {
        const activeClass = icon.value === currentIcon ? "active" : "";
        return `
        <button
          type="button"
          class="icon-option ${activeClass}"
          data-action="pick-contact-icon"
          data-icon-value="${escapeHtml(icon.value)}"
          title="${escapeHtml(icon.label)}"
        >
          <span>${escapeHtml(icon.glyph)}</span>
          <small>${escapeHtml(icon.label)}</small>
        </button>
      `;
      })
      .join("");
  }

  function openIconModal(contactId) {
    state.iconPicker.open = true;
    state.iconPicker.targetContactId = contactId;
    state.iconPicker.keyword = "";
    renderIconModal();
    queueMicrotask(() => {
      el.iconSearchInput.focus();
    });
  }

  function closeIconModal() {
    state.iconPicker.open = false;
    state.iconPicker.targetContactId = "";
    state.iconPicker.keyword = "";
    renderIconModal();
  }

  function applyContactIcon(iconValue) {
    const contact = getContactById(state.iconPicker.targetContactId);
    if (!contact) {
      closeIconModal();
      return;
    }
    contact.icon = normalizeContactIcon(iconValue, contact.label);
    markDirty("更新个人信息图标");
    closeIconModal();
    renderContacts();
    renderPreview();
  }

  function renderModuleEditors() {
    if (!state.resume) {
      destroyModuleEditors();
      return;
    }

    destroyModuleEditors();
    el.moduleList.innerHTML = state.resume.modules
      .map((module) => {
        const isExpanded = state.expandedModuleId === module.moduleId;

        return `
        <article class="module-card" data-module-root="${escapeHtml(module.moduleId)}">
          <header
            class="module-header"
            data-action="toggle-module"
            data-module-id="${escapeHtml(module.moduleId)}"
          >
            <span class="module-handle">⋮⋮</span>
            <div class="module-title">${toModuleIconGlyph(module.icon)} ${escapeHtml(
          module.heading || "未命名模块"
        )}</div>
            <div class="module-badges">
              <span class="mode-badge">${module.format === "markdown" ? "Markdown" : "富文本"}</span>
              <span class="module-subtitle-sep">-</span>
              <span class="module-subtitle">${escapeHtml(module.subtitle || "未填写副标题")}</span>
            </div>
            <span class="module-chevron">${isExpanded ? "▾" : "▸"}</span>
          </header>
          ${
            isExpanded
              ? `
            <div class="module-body">
              <div class="module-actions">
                <button
                  type="button"
                  class="delete-module-btn"
                  data-action="remove-module"
                  data-module-id="${escapeHtml(module.moduleId)}"
                  title="删除模块"
                  aria-label="删除模块"
                >
                  🗑
                </button>
              </div>
              <div class="module-grid">
                <label class="field">
                  <span>大标题</span>
                  <input
                    data-module-id="${escapeHtml(module.moduleId)}"
                    data-field="heading"
                    value="${escapeHtml(module.heading)}"
                  />
                </label>
                <label class="field">
                  <span>图标</span>
                  <select
                    data-module-id="${escapeHtml(module.moduleId)}"
                    data-field="icon"
                  >
                    ${MODULE_ICON_OPTIONS.map((option) => {
                      const selected = option.value === module.icon ? "selected" : "";
                      return `<option value="${option.value}" ${selected}>${option.label}</option>`;
                    }).join("")}
                  </select>
                </label>
                <label class="field">
                  <span>副标题</span>
                  <input
                    data-module-id="${escapeHtml(module.moduleId)}"
                    data-field="subtitle"
                    value="${escapeHtml(module.subtitle)}"
                    placeholder="如：南京理工大学紫金学院"
                  />
                </label>
                <label class="field">
                  <span>时间范围</span>
                  <input
                    data-module-id="${escapeHtml(module.moduleId)}"
                    data-field="timeRange"
                    value="${escapeHtml(module.timeRange)}"
                    placeholder="如：2019/9/1-2023/6/1"
                  />
                </label>
              </div>
              <div class="field module-content-field">
                <div class="module-content-head">
                  <span>详细内容</span>
                  <div class="editor-switch">
                    <button
                      type="button"
                      data-action="set-format"
                      data-format="markdown"
                      data-module-id="${escapeHtml(module.moduleId)}"
                      class="${module.format === "markdown" ? "active" : ""}"
                    >
                      Markdown
                    </button>
                    <button
                      type="button"
                      data-action="set-format"
                      data-format="richtext"
                      data-module-id="${escapeHtml(module.moduleId)}"
                      class="${module.format === "richtext" ? "active" : ""}"
                    >
                      富文本
                    </button>
                  </div>
                </div>
                <div class="markdown-editor-shell">
                  <div
                    class="module-editor-host"
                    data-editor-host-for="${escapeHtml(module.moduleId)}"
                  ></div>
                  <textarea
                    class="module-editor-fallback"
                    data-module-id="${escapeHtml(module.moduleId)}"
                    data-field="content"
                    placeholder="Markdown 插件未加载，当前为降级输入模式。"
                  >${escapeHtml(module.content)}</textarea>
                  <p class="module-editor-missing hidden">Markdown 插件加载失败，已切换为基础输入模式。</p>
                  <p class="markdown-help">Markdown 适合结构化编写；富文本适合所见即所得排版。两种模式都会参与预览和 Puppeteer 导出。</p>
                </div>
              </div>
            </div>
          `
              : ""
          }
        </article>
      `;
      })
      .join("");

    initModuleEditors();
  }

  function destroyModuleEditors() {
    for (const editor of moduleEditorInstances.values()) {
      try {
        editor.destroy();
      } catch {
        // noop
      }
    }
    moduleEditorInstances.clear();
  }

  function initModuleEditors() {
    const editorConstructor = getToastEditorConstructor();
    const hosts = el.moduleList.querySelectorAll("[data-editor-host-for]");

    for (const host of hosts) {
      if (!(host instanceof HTMLElement)) {
        continue;
      }
      const moduleId = host.dataset.editorHostFor;
      if (!moduleId) {
        continue;
      }

      const module = getModuleById(moduleId);
      if (!module) {
        continue;
      }

      const shell = host.closest(".markdown-editor-shell");
      const fallbackInput = shell?.querySelector(".module-editor-fallback");
      const missingHint = shell?.querySelector(".module-editor-missing");

      if (!editorConstructor) {
        if (fallbackInput instanceof HTMLElement) {
          fallbackInput.classList.add("visible");
        }
        if (missingHint instanceof HTMLElement) {
          missingHint.classList.remove("hidden");
        }
        continue;
      }

      if (fallbackInput instanceof HTMLElement) {
        fallbackInput.classList.remove("visible");
      }
      if (missingHint instanceof HTMLElement) {
        missingHint.classList.add("hidden");
      }

      try {
        const editor = new editorConstructor({
          el: host,
          initialValue: module.content,
          initialEditType: module.format === "richtext" ? "wysiwyg" : "markdown",
          previewStyle: module.format === "richtext" ? "tab" : "vertical",
          hideModeSwitch: true,
          usageStatistics: false,
          toolbarItems: TOAST_TOOLBAR_ITEMS,
          height: "320px",
          placeholder: "输入内容，支持 Markdown 与富文本编辑。"
        });

        let canSyncChange = false;
        window.setTimeout(() => {
          canSyncChange = true;
        }, 0);

        editor.on("change", () => {
          if (!canSyncChange) {
            return;
          }
          const nextContent = editor.getMarkdown();
          const current = getModuleById(moduleId);
          if (!current || current.content === nextContent) {
            return;
          }
          updateModuleField(moduleId, "content", nextContent);
        });

        moduleEditorInstances.set(moduleId, editor);
      } catch {
        if (fallbackInput instanceof HTMLElement) {
          fallbackInput.classList.add("visible");
        }
        if (missingHint instanceof HTMLElement) {
          missingHint.classList.remove("hidden");
        }
      }
    }
  }

  function refreshModuleCard(moduleId) {
    const module = getModuleById(moduleId);
    if (!module) {
      return;
    }

    const card = el.moduleList.querySelector(`[data-module-root="${moduleId}"]`);
    if (!(card instanceof HTMLElement)) {
      return;
    }

    const titleEl = card.querySelector(".module-title");
    if (titleEl) {
      titleEl.innerHTML = `${toModuleIconGlyph(module.icon)} ${escapeHtml(module.heading || "未命名模块")}`;
    }

    const subtitleEl = card.querySelector(".module-subtitle");
    if (subtitleEl) {
      subtitleEl.textContent = module.subtitle || "未填写副标题";
    }

    const modeBadgeEl = card.querySelector(".mode-badge");
    if (modeBadgeEl) {
      modeBadgeEl.textContent = module.format === "markdown" ? "Markdown" : "富文本";
    }
  }

  function toModuleIconGlyph(icon) {
    return MODULE_ICON_GLYPH[icon] || MODULE_ICON_GLYPH.custom;
  }

  return {
    render,
    renderMode,
    renderAvatarPreview,
    renderContacts,
    renderPreview,
    renderIconModal,
    renderIconGrid,
    openIconModal,
    closeIconModal,
    applyContactIcon,
    renderModuleEditors,
    refreshModuleCard
  };
}
