import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { ApiApplication } from "../.tmp-dist/services/api/src/main.js";
import { ExportWorkerApplication } from "../.tmp-dist/services/export-worker/src/main.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "apps", "web", "public");

const api = new ApiApplication();
const worker = new ExportWorkerApplication(api);
worker.start();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    if (pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname.startsWith("/downloads/")) {
      handleDownload(res, pathname);
      return;
    }

    await handleStatic(res, pathname);
  } catch (error) {
    sendJson(res, 500, {
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "unexpected server error"
    });
  }
});

server.listen(4173, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log("Demo server running at http://127.0.0.1:4173");
});

function parsePath(pathname, pattern) {
  const matched = pathname.match(pattern);
  if (!matched) {
    return null;
  }
  return matched[1];
}

async function handleApi(req, res, pathname) {
  const method = req.method ?? "GET";

  if (method === "GET") {
    const resumeId = parsePath(pathname, /^\/api\/v1\/resumes\/([^/]+)$/);
    if (resumeId) {
      return sendApiResult(res, api.getResume(resumeId));
    }

    const jobId = parsePath(pathname, /^\/api\/v1\/export-jobs\/([^/]+)$/);
    if (jobId) {
      return sendApiResult(res, api.getExportJob(jobId));
    }
  }

  if (method === "PATCH") {
    const resumeId = parsePath(pathname, /^\/api\/v1\/resumes\/([^/]+)\/draft$/);
    if (resumeId) {
      const body = await readJsonBody(req);
      return sendApiResult(res, api.saveDraft(resumeId, body));
    }
  }

  if (method === "POST") {
    if (pathname === "/api/v1/resumes/import") {
      const body = await readJsonBody(req);
      return sendApiResult(res, api.importResume(body));
    }

    const resumeId = parsePath(pathname, /^\/api\/v1\/resumes\/([^/]+)\/export-jobs$/);
    if (resumeId) {
      const body = await readJsonBody(req);
      return sendApiResult(res, api.createExportJob(resumeId, body));
    }
  }

  sendJson(res, 404, {
    code: "NOT_FOUND",
    message: `${method} ${pathname} not found`
  });
}

function sendApiResult(res, payload) {
  if (payload.code === "OK") {
    sendJson(res, 200, payload);
    return;
  }

  if (payload.code === "RESUME_NOT_FOUND" || payload.code === "EXPORT_JOB_NOT_FOUND") {
    sendJson(res, 404, payload);
    return;
  }

  if (payload.code === "VERSION_CONFLICT") {
    sendJson(res, 409, payload);
    return;
  }

  sendJson(res, 400, payload);
}

function handleDownload(res, pathname) {
  const encodedKey = pathname.slice("/downloads/".length);
  const fileKey = safeDecodeURIComponent(encodedKey);
  if (!fileKey) {
    sendJson(res, 400, { code: "INVALID_FILE_KEY", message: "invalid file key" });
    return;
  }

  const stored = worker.getFileByKey(fileKey);
  if (!stored) {
    sendJson(res, 404, { code: "FILE_NOT_FOUND", message: "file not found" });
    return;
  }

  const filename = fileKey.split("/").pop() || "resume.pdf";
  res.writeHead(200, {
    "Content-Type": stored.contentType,
    "Content-Length": stored.body.byteLength,
    "Content-Disposition": `attachment; filename="${filename}"`
  });
  res.end(Buffer.from(stored.body));
}

async function handleStatic(res, pathname) {
  let requestedPath = pathname;
  if (requestedPath === "/") {
    requestedPath = "/index.html";
  }

  const cleaned = requestedPath.replace(/^\/+/, "");
  const filePath = path.join(publicDir, cleaned);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { code: "FORBIDDEN", message: "forbidden path" });
    return;
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    sendJson(res, 404, { code: "NOT_FOUND", message: "static file not found" });
    return;
  }

  if (!fileStat.isFile()) {
    sendJson(res, 404, { code: "NOT_FOUND", message: "static file not found" });
    return;
  }

  const contentType = guessContentType(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}

function guessContentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "application/octet-stream";
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body, "utf-8")
  });
  res.end(body);
}

function safeDecodeURIComponent(input) {
  try {
    return decodeURIComponent(input);
  } catch {
    return null;
  }
}

process.on("SIGINT", () => {
  worker.stop();
  server.close();
});

process.on("SIGTERM", () => {
  worker.stop();
  server.close();
});
