import path from "node:path";
import { pathToFileURL } from "node:url";

const distRoot = path.resolve(process.cwd(), ".tmp-dist");

const aliasMap = {
  "@api/": path.join(distRoot, "services/api/src/"),
  "@worker/": path.join(distRoot, "services/export-worker/src/"),
  "@magic/types/": path.join(distRoot, "packages/types/src/"),
  "@web/": path.join(distRoot, "apps/web/src/")
};

export async function resolve(specifier, context, defaultResolve) {
  for (const [prefix, targetRoot] of Object.entries(aliasMap)) {
    if (!specifier.startsWith(prefix)) {
      continue;
    }

    const subPath = specifier.slice(prefix.length);
    const candidate = toJsPath(path.join(targetRoot, subPath));
    return {
      url: pathToFileURL(candidate).href,
      shortCircuit: true
    };
  }

  if (isRelativeWithoutExtension(specifier)) {
    try {
      return await defaultResolve(`${specifier}.js`, context, defaultResolve);
    } catch {
      return defaultResolve(specifier, context, defaultResolve);
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

function isRelativeWithoutExtension(specifier) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    return false;
  }
  return !hasKnownExtension(specifier);
}

function toJsPath(inputPath) {
  if (hasKnownExtension(inputPath)) {
    return inputPath;
  }
  return `${inputPath}.js`;
}

function hasKnownExtension(inputPath) {
  return [
    ".js",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".jsx",
    ".json",
    ".node"
  ].some((extension) => inputPath.endsWith(extension));
}
