export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function deepClone(input) {
  return JSON.parse(JSON.stringify(input));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeAvatarDisplayUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return "";
  }
  if (/^(data:image\/|blob:|https?:\/\/)/i.test(raw)) {
    return raw;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
}

export function toSafeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.href;
  } catch {
    return "";
  }
}

export function getDisplayName(title) {
  const shortName = String(title || "").split("-")[0].trim();
  return shortName || "候选人";
}
