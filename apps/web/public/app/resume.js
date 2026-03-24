import { SECTION_NAME_MAP } from "./constants.js";
import { normalizeContactIcon } from "./contacts.js";
import { createId, deepClone } from "./helpers.js";

export function normalizeResume(rawResume) {
  const resume = deepClone(rawResume);

  resume.basics = resume.basics ?? {};
  resume.basics.avatarUrl = String(resume.basics.avatarUrl || "").trim();
  resume.basics.contacts = Array.isArray(resume.basics.contacts)
    ? resume.basics.contacts
    : [];

  resume.basics.contacts = resume.basics.contacts.map((item, index) => ({
    itemId: item.itemId || createId("contact"),
    icon: normalizeContactIcon(item.icon, item.label),
    label: item.label || `信息${index + 1}`,
    value: item.value ?? ""
  }));

  resume.sections = Array.isArray(resume.sections) ? resume.sections : [];
  resume.modules = Array.isArray(resume.modules) && resume.modules.length > 0
    ? resume.modules
    : buildModulesFromSections(resume.sections);

  resume.modules = resume.modules.map((module, index) => {
    return {
      moduleId: module.moduleId || createId(`module_${index}`),
      heading: module.heading || "未命名模块",
      icon: module.icon || "custom",
      subtitle: module.subtitle || "",
      timeRange: module.timeRange || "",
      format: module.format === "richtext" ? "richtext" : "markdown",
      content: module.content || "",
      sectionType: module.sectionType || "custom"
    };
  });

  return resume;
}

function buildModulesFromSections(sections) {
  const modules = [];
  for (const section of sections) {
    if (!Array.isArray(section.items)) {
      continue;
    }
    for (const item of section.items) {
      const sectionName = SECTION_NAME_MAP[section.sectionType] || "未命名模块";
      modules.push({
        moduleId: `${section.sectionType}_${item.itemId || createId("item")}`,
        heading: sectionName,
        icon: section.sectionType,
        subtitle:
          section.sectionType === "work"
            ? item.subtitle || item.title || ""
            : item.title || item.subtitle || "",
        timeRange: formatRange(item.startDate, item.endDate),
        format: "markdown",
        content: buildFallbackContent(item),
        sectionType: section.sectionType
      });
    }
  }
  return modules;
}

function buildFallbackContent(item) {
  const lines = [];
  if (item.title && item.subtitle) {
    lines.push(item.title);
  }
  if (item.description) {
    lines.push(item.description);
  }
  return lines.join("\n");
}

function formatRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "";
  }
  return `${startDate || "至今"}-${endDate || "至今"}`;
}
