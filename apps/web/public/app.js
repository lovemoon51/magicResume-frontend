import { callApi } from "./app/api.js";
import { normalizeContactIcon } from "./app/contacts.js";
import { createElements, updateViewportFrameHeight } from "./app/elements.js";
import { createId, escapeHtml, sleep } from "./app/helpers.js";
import { createMarkdownTools } from "./app/markdown.js";
import { createRenderer } from "./app/renderer.js";
import { normalizeResume } from "./app/resume.js";

const state = {
  resume: null,
  dirty: false,
  runtime: "api",
  mode: "both",
  expandedModuleId: "",
  iconPicker: {
    open: false,
    targetContactId: "",
    keyword: ""
  }
};

let avatarPreviewTimerId = 0;
const LOCAL_DRAFT_STORAGE_KEY = "magic_resume_local_drafts_v1";
const LOCAL_SEED_RESUME_PATH = "./seed-resume.json";

const el = createElements();
const { markdownToHtml } = createMarkdownTools();

const renderer = createRenderer({
  state,
  el,
  getContactById,
  getModuleById,
  setStatus,
  markDirty,
  updateModuleField,
  markdownToHtml,
  syncLayout: () => {
    updateViewportFrameHeight(el.topNav);
  }
});

bindEvents();
updateViewportFrameHeight(el.topNav);
renderer.renderIconModal();
void loadResume();

function bindEvents() {
  window.addEventListener("resize", () => {
    updateViewportFrameHeight(el.topNav);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.iconPicker.open) {
      renderer.closeIconModal();
    }
  });

  el.loadBtn.addEventListener("click", () => {
    void loadResume();
  });

  el.saveBtn.addEventListener("click", () => {
    void saveDraft();
  });

  el.exportBtn.addEventListener("click", () => {
    void exportPdf();
  });

  el.addContactBtn.addEventListener("click", () => {
    if (!state.resume) {
      return;
    }

    state.resume.basics.contacts.push({
      itemId: createId("contact"),
      icon: "user",
      label: "自定义信息",
      value: ""
    });

    markDirty("新增个人信息");
    renderer.render();
  });

  el.addModuleBtn.addEventListener("click", () => {
    if (!state.resume) {
      return;
    }

    const moduleId = createId("module");
    state.resume.modules.push({
      moduleId,
      heading: "未命名模块",
      icon: "custom",
      subtitle: "",
      timeRange: "",
      format: "markdown",
      content: "",
      sectionType: "custom"
    });

    state.expandedModuleId = moduleId;
    markDirty("新增模块");
    renderer.render();
  });

  el.titleInput.addEventListener("input", () => {
    if (!state.resume) {
      return;
    }

    state.resume.title = el.titleInput.value.trimStart();
    markDirty("编辑标题");
    renderer.render();
  });

  el.avatarInput.addEventListener("input", () => {
    if (!state.resume) {
      return;
    }

    state.resume.basics.avatarUrl = el.avatarInput.value.trim();
    markDirty("编辑头像");
    scheduleAvatarPreview();
  });

  el.avatarInput.addEventListener("blur", () => {
    applyAvatarInputNow();
  });

  el.uploadAvatarBtn.addEventListener("click", () => {
    openAvatarFilePicker();
  });

  el.avatarPickerBtn.addEventListener("click", () => {
    openAvatarFilePicker();
  });

  el.clearAvatarBtn.addEventListener("click", () => {
    if (!state.resume) {
      return;
    }

    state.resume.basics.avatarUrl = "";
    el.avatarFileInput.value = "";
    markDirty("清空头像");
    renderer.renderAvatarPreview();
    renderer.renderPreview();
  });

  el.avatarFileInput.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    void handleAvatarFile(file);
  });

  el.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (!mode) {
        return;
      }
      state.mode = mode;
      renderer.renderMode();
    });
  });

  el.contactList.addEventListener("input", (event) => {
    if (!state.resume) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const contactId = target.dataset.contactId;
    const field = target.dataset.field;
    if (!contactId || !field) {
      return;
    }

    const contact = getContactById(contactId);
    if (!contact) {
      return;
    }

    if (field === "label") {
      contact.label = target.value;
      contact.icon = normalizeContactIcon(contact.icon, contact.label);
    }

    if (field === "value") {
      contact.value = target.value;
    }

    markDirty("编辑个人信息");
    renderer.renderPreview();
  });

  el.contactList.addEventListener("click", (event) => {
    if (!state.resume) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionEl = target.closest("[data-action]");
    if (!(actionEl instanceof HTMLElement)) {
      return;
    }

    const action = actionEl.dataset.action;
    const contactId = actionEl.dataset.contactId;
    if (!action || !contactId) {
      return;
    }

    if (action === "remove-contact") {
      state.resume.basics.contacts = state.resume.basics.contacts.filter(
        (item) => item.itemId !== contactId
      );
      markDirty("删除个人信息");
      renderer.render();
      return;
    }

    if (action === "open-icon-picker") {
      renderer.openIconModal(contactId);
    }
  });

  el.iconModal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.action === "close-icon-modal") {
      renderer.closeIconModal();
    }
  });

  el.closeIconModalBtn.addEventListener("click", () => {
    renderer.closeIconModal();
  });

  el.iconSearchInput.addEventListener("input", () => {
    state.iconPicker.keyword = el.iconSearchInput.value;
    renderer.renderIconGrid();
  });

  el.iconGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const option = target.closest("[data-action='pick-contact-icon']");
    if (!(option instanceof HTMLElement)) {
      return;
    }
    const iconValue = option.dataset.iconValue;
    if (!iconValue) {
      return;
    }
    renderer.applyContactIcon(iconValue);
  });

  el.moduleList.addEventListener("click", (event) => {
    if (!state.resume) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionEl = target.closest("[data-action]");
    if (!(actionEl instanceof HTMLElement)) {
      return;
    }

    const moduleId = actionEl.dataset.moduleId;
    const action = actionEl.dataset.action;
    if (!moduleId || !action) {
      return;
    }

    if (action === "toggle-module") {
      state.expandedModuleId = state.expandedModuleId === moduleId ? "" : moduleId;
      renderer.renderModuleEditors();
      return;
    }

    if (action === "set-format") {
      const format = actionEl.dataset.format;
      const module = getModuleById(moduleId);
      if (!module || (format !== "markdown" && format !== "richtext")) {
        return;
      }
      module.format = format;
      markDirty("切换内容格式");
      renderer.renderModuleEditors();
      renderer.renderPreview();
      return;
    }

    if (action === "remove-module") {
      state.resume.modules = state.resume.modules.filter(
        (module) => module.moduleId !== moduleId
      );
      if (state.expandedModuleId === moduleId) {
        state.expandedModuleId = "";
      }
      markDirty("删除模块");
      renderer.render();
    }
  });

  el.moduleList.addEventListener("input", (event) => {
    if (!state.resume) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    const moduleId = target.dataset.moduleId;
    const field = target.dataset.field;
    if (!moduleId || !field) {
      return;
    }
    updateModuleField(moduleId, field, target.value);
  });

  el.moduleList.addEventListener("change", (event) => {
    if (!state.resume) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const moduleId = target.dataset.moduleId;
    const field = target.dataset.field;
    if (!moduleId || !field) {
      return;
    }
    updateModuleField(moduleId, field, target.value);
  });
}

async function loadResume() {
  const resumeId = el.resumeIdInput.value.trim();
  if (!resumeId) {
    setStatus("resumeId 不能为空");
    return;
  }

  setLoading(true);
  setStatus("加载中...");
  clearExportResult();

  const result = await callApi("GET", `/api/v1/resumes/${encodeURIComponent(resumeId)}`);
  setLoading(false);

  if (result.ok) {
    applyLoadedResume(result.data.resume, "api", "已加载");
    return;
  }

  const localResume = await resolveLocalResume(resumeId);
  if (!localResume) {
    setStatus(`加载失败: ${result.error.message}`);
    return;
  }

  applyLoadedResume(localResume, "local", "已加载（本地模板）");
}

async function saveDraft() {
  if (!state.resume) {
    setStatus("请先加载简历");
    return;
  }

  if (state.runtime === "local") {
    saveDraftToLocal();
    return;
  }

  setSaving(true);
  setStatus("保存中...");

  const result = await callApi(
    "PATCH",
    `/api/v1/resumes/${encodeURIComponent(state.resume.resumeId)}/draft`,
    {
      baseVersion: state.resume.version,
      snapshot: state.resume,
      clientTs: new Date().toISOString()
    }
  );

  setSaving(false);

  if (!result.ok) {
    setStatus(`保存失败: ${result.error.message}`);
    return;
  }

  state.resume.version = result.data.savedVersion;
  state.resume.updatedAt = result.data.updatedAt;
  state.dirty = false;
  setStatus("保存成功");
  renderer.render();
}

async function exportPdf() {
  if (!state.resume) {
    setStatus("请先加载简历");
    return;
  }

  if (state.runtime === "local") {
    setStatus("当前为静态模式，暂不支持导出 PDF");
    showExportError("GitHub Pages 静态部署不支持导出 PDF，请在本地或服务端环境导出。");
    return;
  }

  setStatus("导出任务创建中...");
  clearExportResult();

  const created = await callApi(
    "POST",
    `/api/v1/resumes/${encodeURIComponent(state.resume.resumeId)}/export-jobs`,
    {
      templateId: state.resume.templateId,
      snapshotVersion: state.resume.version,
      format: "pdf"
    }
  );

  if (!created.ok) {
    setStatus(`导出任务创建失败: ${created.error.message}`);
    return;
  }

  const jobId = created.data.jobId;
  setStatus(`导出任务已创建: ${jobId}`);

  const finalResult = await pollJob(jobId);
  if (!finalResult.ok) {
    setStatus(`导出失败: ${finalResult.error.message}`);
    showExportError(finalResult.error.message);
    return;
  }

  if (finalResult.data.status === "succeeded") {
    setStatus("导出成功");
    showExportSuccess(finalResult.data.downloadUrl);
    return;
  }

  const failureReason =
    finalResult.data.errorMessage || finalResult.data.errorCode || "未知错误";
  setStatus(`导出失败: ${failureReason}`);
  showExportError(failureReason);
}

async function pollJob(jobId) {
  for (let i = 0; i < 20; i += 1) {
    const result = await callApi("GET", `/api/v1/export-jobs/${encodeURIComponent(jobId)}`);
    if (!result.ok) {
      return result;
    }
    const status = result.data.status;
    setStatus(`导出轮询中: ${status}`);
    if (status === "succeeded" || status === "failed") {
      return result;
    }
    await sleep(250);
  }
  return {
    ok: false,
    error: {
      message: "轮询超时"
    }
  };
}

async function handleAvatarFile(file) {
  if (!state.resume) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    setStatus("仅支持图片文件");
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  if (!dataUrl) {
    setStatus("读取图片失败");
    return;
  }

  state.resume.basics.avatarUrl = dataUrl;
  markDirty("上传头像");
  renderer.renderAvatarPreview();
  renderer.renderPreview();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      resolve("");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function openAvatarFilePicker() {
  if (!(el.avatarFileInput instanceof HTMLInputElement)) {
    return;
  }
  try {
    if (typeof el.avatarFileInput.showPicker === "function") {
      el.avatarFileInput.showPicker();
      return;
    }
  } catch {
    // fall through to click
  }
  el.avatarFileInput.click();
}

function scheduleAvatarPreview() {
  if (avatarPreviewTimerId) {
    window.clearTimeout(avatarPreviewTimerId);
  }
  avatarPreviewTimerId = window.setTimeout(() => {
    applyAvatarInputNow();
  }, 220);
}

function applyAvatarInputNow() {
  if (avatarPreviewTimerId) {
    window.clearTimeout(avatarPreviewTimerId);
    avatarPreviewTimerId = 0;
  }
  renderer.renderAvatarPreview();
  renderer.renderPreview();
}

function updateModuleField(moduleId, field, value) {
  const module = getModuleById(moduleId);
  if (!module) {
    return;
  }

  if (field === "heading") {
    module.heading = value;
  }
  if (field === "subtitle") {
    module.subtitle = value;
  }
  if (field === "timeRange") {
    module.timeRange = value;
  }
  if (field === "content") {
    module.content = value;
  }
  if (field === "icon") {
    module.icon = value;
  }

  markDirty("编辑模块内容");
  renderer.refreshModuleCard(moduleId);
  renderer.renderPreview();
}

function getModuleById(moduleId) {
  if (!state.resume) {
    return null;
  }
  return state.resume.modules.find((module) => module.moduleId === moduleId) ?? null;
}

function getContactById(contactId) {
  if (!state.resume) {
    return null;
  }
  return state.resume.basics.contacts.find((item) => item.itemId === contactId) ?? null;
}

function setStatus(text) {
  el.statusText.textContent = state.dirty ? `${text} (未保存)` : text;
}

function setLoading(isLoading) {
  el.loadBtn.disabled = isLoading;
  el.loadBtn.textContent = isLoading ? "加载中..." : "加载";
}

function setSaving(isSaving) {
  el.saveBtn.disabled = isSaving;
  el.saveBtn.textContent = isSaving ? "保存中..." : "保存";
}

function markDirty(message) {
  state.dirty = true;
  setStatus(message);
}

function clearExportResult() {
  el.exportResult.classList.remove("error");
  el.exportResult.innerHTML = "";
}

function showExportSuccess(downloadUrl) {
  el.exportResult.classList.remove("error");
  el.exportResult.innerHTML =
    `<strong>导出成功</strong><br/><a target="_blank" rel="noreferrer" href="${escapeHtml(
      downloadUrl
    )}">${escapeHtml(downloadUrl)}</a>`;
}

function showExportError(message) {
  el.exportResult.classList.add("error");
  el.exportResult.textContent = `导出失败: ${message}`;
}

function applyLoadedResume(rawResume, runtime, loadedText) {
  state.resume = normalizeResume(rawResume);
  state.runtime = runtime;
  state.dirty = false;
  state.expandedModuleId = state.resume.modules[0]?.moduleId ?? "";
  state.iconPicker.open = false;
  setStatus(loadedText);
  renderer.render();
}

async function resolveLocalResume(resumeId) {
  const localDraft = readLocalDraft(resumeId);
  if (localDraft) {
    return localDraft;
  }

  const seeded = await loadSeedResume();
  if (!seeded) {
    return null;
  }

  if (resumeId && seeded.resumeId !== resumeId) {
    return {
      ...seeded,
      resumeId
    };
  }

  return seeded;
}

async function loadSeedResume() {
  try {
    const response = await fetch(LOCAL_SEED_RESUME_PATH, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

function saveDraftToLocal() {
  if (!state.resume) {
    return;
  }

  setSaving(true);
  setStatus("保存中...");

  try {
    const nextVersion = Number(state.resume.version || 0) + 1;
    state.resume.version = nextVersion;
    state.resume.updatedAt = new Date().toISOString();
    writeLocalDraft(state.resume.resumeId, state.resume);
    state.dirty = false;
    setStatus("保存成功（浏览器本地）");
    renderer.render();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    setStatus(`本地保存失败: ${message}`);
  } finally {
    setSaving(false);
  }
}

function readLocalDraft(resumeId) {
  if (!resumeId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const draft = parsed[resumeId];
    return draft && typeof draft === "object" ? draft : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(resumeId, snapshot) {
  if (!resumeId) {
    throw new Error("resumeId missing");
  }

  const nextStore = {};
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.assign(nextStore, parsed);
      }
    }
  } catch {
    // ignore corrupted local storage payload
  }

  nextStore[resumeId] = snapshot;
  localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(nextStore));
}
