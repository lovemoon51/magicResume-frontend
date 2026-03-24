export function createElements() {
  return {
    loadBtn: document.getElementById("loadBtn"),
    saveBtn: document.getElementById("saveBtn"),
    exportBtn: document.getElementById("exportBtn"),
    addContactBtn: document.getElementById("addContactBtn"),
    addModuleBtn: document.getElementById("addModuleBtn"),
    uploadAvatarBtn: document.getElementById("uploadAvatarBtn"),
    clearAvatarBtn: document.getElementById("clearAvatarBtn"),
    avatarPickerBtn: document.getElementById("avatarPickerBtn"),
    avatarFileInput: document.getElementById("avatarFileInput"),
    resumeIdInput: document.getElementById("resumeIdInput"),
    titleInput: document.getElementById("titleInput"),
    avatarInput: document.getElementById("avatarInput"),
    avatarPreview: document.getElementById("avatarPreview"),
    avatarFallback: document.getElementById("avatarFallback"),
    versionText: document.getElementById("versionText"),
    updatedAtText: document.getElementById("updatedAtText"),
    statusText: document.getElementById("statusText"),
    brandTag: document.getElementById("brandTag"),
    contactList: document.getElementById("contactList"),
    moduleList: document.getElementById("moduleList"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
    topNav: document.querySelector(".top-nav"),
    splitLayout: document.getElementById("splitLayout"),
    splitLine: document.querySelector(".split-line"),
    editorPanel: document.getElementById("editorPanel"),
    previewPanel: document.getElementById("previewPanel"),
    previewTitle: document.getElementById("previewTitle"),
    previewAvatar: document.getElementById("previewAvatar"),
    previewContacts: document.getElementById("previewContacts"),
    previewModules: document.getElementById("previewModules"),
    exportResult: document.getElementById("exportResult"),
    iconModal: document.getElementById("iconModal"),
    iconGrid: document.getElementById("iconGrid"),
    iconSearchInput: document.getElementById("iconSearchInput"),
    closeIconModalBtn: document.getElementById("closeIconModalBtn")
  };
}

export function updateViewportFrameHeight(topNav) {
  if (!(topNav instanceof HTMLElement)) {
    return;
  }
  const topNavHeight = Math.ceil(topNav.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--top-nav-height", `${topNavHeight}px`);
}
