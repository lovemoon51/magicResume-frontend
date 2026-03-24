import { CONTACT_ICON_MAP } from "./constants.js";

export function normalizeContactIcon(icon, label) {
  if (icon && CONTACT_ICON_MAP[icon]) {
    return icon;
  }
  return guessContactIconByLabel(label);
}

export function guessContactIconByLabel(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("电话") || text.includes("手机")) {
    return "phone";
  }
  if (text.includes("邮箱") || text.includes("邮件")) {
    return "email";
  }
  if (text.includes("地址") || text.includes("地区")) {
    return "location";
  }
  if (text.includes("网站") || text.includes("博客") || text.includes("url")) {
    return "website";
  }
  if (text.includes("工作")) {
    return "briefcase";
  }
  if (text.includes("薪") || text.includes("意向")) {
    return "heart";
  }
  return "user";
}

export function isWebsiteContact(item) {
  const label = String(item.label || "").toLowerCase();
  return item.icon === "website" || label.includes("网站") || label.includes("url");
}

export function getContactIconGlyph(iconValue) {
  return CONTACT_ICON_MAP[iconValue]?.glyph || CONTACT_ICON_MAP.user.glyph;
}
