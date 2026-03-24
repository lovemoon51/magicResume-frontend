export const SECTION_NAME_MAP = {
  education: "教育背景",
  skill: "专业技能",
  work: "工作经历"
};

export const MODULE_ICON_OPTIONS = [
  { value: "education", label: "🎓 教育" },
  { value: "skill", label: "🧩 技能" },
  { value: "work", label: "💼 工作" },
  { value: "project", label: "📦 项目" },
  { value: "summary", label: "👤 评价" },
  { value: "custom", label: "✨ 自定义" }
];

export const MODULE_ICON_GLYPH = {
  education: "🎓",
  skill: "🧩",
  work: "💼",
  project: "📦",
  summary: "👤",
  custom: "✨"
};

export const CONTACT_ICON_LIBRARY = [
  { value: "none", label: "无", glyph: "∅", keywords: "none empty 无" },
  { value: "user", label: "用户", glyph: "👤", keywords: "user 个人" },
  { value: "phone", label: "电话", glyph: "📞", keywords: "phone 手机 联系" },
  { value: "email", label: "邮箱", glyph: "✉", keywords: "email 邮件" },
  { value: "location", label: "地址", glyph: "📍", keywords: "location 地址 城市" },
  { value: "website", label: "网站", glyph: "🌐", keywords: "website url 网址" },
  { value: "github", label: "GitHub", glyph: "🐙", keywords: "github code 代码" },
  { value: "linkedin", label: "LinkedIn", glyph: "in", keywords: "linkedin 职业" },
  { value: "wechat", label: "微信", glyph: "微", keywords: "wechat 微信" },
  { value: "briefcase", label: "工作", glyph: "💼", keywords: "job work 工作" },
  { value: "education", label: "教育", glyph: "🎓", keywords: "education 学历" },
  { value: "skill", label: "技能", glyph: "🧩", keywords: "skill 技术" },
  { value: "lightbulb", label: "灵感", glyph: "💡", keywords: "idea 灵感" },
  { value: "rocket", label: "项目", glyph: "🚀", keywords: "project 项目" },
  { value: "star", label: "亮点", glyph: "⭐", keywords: "star 亮点" },
  { value: "heart", label: "意向", glyph: "❤", keywords: "heart 求职 意向" },
  { value: "team", label: "团队", glyph: "👥", keywords: "team 团队" },
  { value: "doc", label: "文档", glyph: "📄", keywords: "doc 文档 文件" },
  { value: "info", label: "信息", glyph: "ℹ", keywords: "info 信息" },
  { value: "check", label: "完成", glyph: "✔", keywords: "check 完成" },
  { value: "clock", label: "时间", glyph: "🕒", keywords: "clock time 时间" },
  { value: "calendar", label: "日程", glyph: "📅", keywords: "calendar 日期" },
  { value: "flag", label: "目标", glyph: "⚑", keywords: "flag 目标" },
  { value: "target", label: "定位", glyph: "🎯", keywords: "target 目标 定位" },
  { value: "award", label: "荣誉", glyph: "🏅", keywords: "award 奖项 荣誉" }
];

export const CONTACT_ICON_MAP = Object.fromEntries(
  CONTACT_ICON_LIBRARY.map((item) => [item.value, item])
);

export const TOAST_TOOLBAR_ITEMS = [
  ["heading", "bold", "italic", "strike"],
  ["hr", "quote"],
  ["ul", "ol", "task"],
  ["table", "link"],
  ["code", "codeblock"]
];
