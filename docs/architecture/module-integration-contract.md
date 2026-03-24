# 模块对接规范（V1）

> 目标：明确“谁发什么数据、格式是什么、返回什么结果”，作为前后端与异步任务的统一契约。

## 1. 参与模块

- 皮肤层（UI）：`TopNav`、`EditorPanel`、`SectionCard`、`ResumePreview`
- 逻辑层（UseCase/Store）：`ResumeStore`、`ResumeEditorActions`、`AutoSaveScheduler`、`ExportPdfUseCase`
- 数据层（Infra）：`Resume API`、`Export API`、`MySQL/PostgreSQL`、`Redis Queue`、`Export Worker`、`Object Storage`、`localStorage`

## 2. 全局数据与返回规范

### 2.1 统一响应包（HTTP）

```json
{
  "code": "OK",
  "message": "success",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {}
}
```

- `code`: `OK` / 业务错误码（如 `RESUME_NOT_FOUND`）
- `traceId`: 全链路追踪 ID
- `data`: 实际业务数据

### 2.2 统一错误包（HTTP）

```json
{
  "code": "VALIDATION_ERROR",
  "message": "sectionType is invalid",
  "traceId": "7f5dbf3a6c9f4a9d",
  "details": [
    {
      "field": "sectionType",
      "reason": "must be one of education/skill/work"
    }
  ]
}
```

### 2.3 核心领域对象（ResumeAggregate）

```json
{
  "resumeId": "res_01JZ7J6K2M0Y2N8A7S4P",
  "userId": "usr_01JZ7J6H8K1Z4N7P1A2B",
  "title": "周兵-后端开发工程师",
  "templateId": "tpl_classic_cn_v1",
  "version": 12,
  "basics": {
    "avatarUrl": "https://cdn.example.com/avatar/a1.png",
    "contacts": [
      { "itemId": "c1", "icon": "phone", "label": "电话", "value": "13023401603" },
      { "itemId": "c2", "icon": "email", "label": "邮箱", "value": "1742257377@qq.com" }
    ]
  },
  "sections": [
    { "sectionType": "education", "items": [] },
    { "sectionType": "skill", "items": [] },
    { "sectionType": "work", "items": [] }
  ],
  "updatedAt": "2026-03-24T09:30:00Z"
}
```

## 3. 对接清单（谁发什么、返回什么）

## 3.1 UI -> 逻辑层（本地调用）

| 发起方 | 接收方 | 输入数据格式 | 返回结果 |
|---|---|---|---|
| `TitleCard` | `ResumeEditorActions.setTitle` | `{ "resumeId": "string", "title": "string", "clientTs": "ISO8601" }` | `{ "ok": true, "draftVersion": "number", "dirty": true }` |
| `SectionCard` | `ResumeEditorActions.upsertSectionItem` | `{ "resumeId": "string", "sectionType": "education\\|skill\\|work", "item": "object", "clientTs": "ISO8601" }` | `{ "ok": true, "draftVersion": "number", "previewChanged": true }` |
| `SectionCard` | `ResumeEditorActions.removeSectionItem` | `{ "resumeId": "string", "sectionType": "string", "itemId": "string" }` | `{ "ok": true, "draftVersion": "number" }` |
| `TopNav` | `ResumeEditorActions.saveNow` | `{ "resumeId": "string" }` | `{ "ok": true, "savedVersion": "number", "savedAt": "ISO8601" }` |
| `TopNav` | `ExportPdfUseCase.start` | `{ "resumeId": "string", "templateId": "string" }` | `{ "ok": true, "jobId": "string", "status": "queued" }` |

## 3.2 逻辑层 -> 本地缓存（localStorage）

| 发起方 | 接收方 | 写入格式 | 读取返回 |
|---|---|---|---|
| `AutoSaveScheduler` | `localStorage.resume_draft_{resumeId}` | `{ "resumeId": "string", "version": "number", "dirty": true, "snapshot": "ResumeAggregate", "savedAt": "ISO8601" }` | 同结构对象；不存在则 `null` |
| `TopNav` | `localStorage.resume_ui_prefs` | `{ "mode": "edit\\|preview\\|both", "lastTemplateId": "string" }` | 同结构对象；不存在则默认配置 |

## 3.3 逻辑层 -> Resume API（HTTP）

### A. 加载简历

- 调用：`GET /api/v1/resumes/{resumeId}`
- 请求：无 body
- 返回：

```json
{
  "code": "OK",
  "message": "success",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "resume": {}
  }
}
```

### B. 保存草稿（幂等）

- 调用：`PATCH /api/v1/resumes/{resumeId}/draft`
- 请求：

```json
{
  "baseVersion": 12,
  "snapshot": {},
  "clientTs": "2026-03-24T09:32:11Z"
}
```

- 返回（成功）：

```json
{
  "code": "OK",
  "message": "success",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "resumeId": "res_01JZ7J6K2M0Y2N8A7S4P",
    "savedVersion": 13,
    "updatedAt": "2026-03-24T09:32:11Z"
  }
}
```

- 返回（版本冲突）：

```json
{
  "code": "VERSION_CONFLICT",
  "message": "baseVersion is stale",
  "traceId": "7f5dbf3a6c9f4a9d",
  "details": [
    { "field": "baseVersion", "reason": "current=14" }
  ]
}
```

### C. 导入简历

- 调用：`POST /api/v1/resumes/import`
- 请求：

```json
{
  "sourceType": "json",
  "payload": {}
}
```

- 返回：

```json
{
  "code": "OK",
  "message": "success",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "resumeId": "res_01JZ7J6K2M0Y2N8A7S4P",
    "version": 1
  }
}
```

## 3.4 逻辑层 -> Export API（HTTP）

### A. 创建导出任务

- 调用：`POST /api/v1/resumes/{resumeId}/export-jobs`
- 请求：

```json
{
  "templateId": "tpl_classic_cn_v1",
  "snapshotVersion": 13,
  "format": "pdf"
}
```

- 返回：

```json
{
  "code": "OK",
  "message": "accepted",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "jobId": "job_01JZ7JQXVE6EG0QF2QXK",
    "status": "queued"
  }
}
```

### B. 查询导出任务状态

- 调用：`GET /api/v1/export-jobs/{jobId}`
- 返回：

```json
{
  "code": "OK",
  "message": "success",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "jobId": "job_01JZ7JQXVE6EG0QF2QXK",
    "status": "queued|processing|succeeded|failed",
    "downloadUrl": "https://cdn.example.com/export/x.pdf",
    "errorCode": "",
    "errorMessage": ""
  }
}
```

## 3.5 API -> Redis Queue（消息）

| 发起方 | 接收方 | 消息格式 | 接收结果 |
|---|---|---|---|
| `Export API` | `resume.export.pdf` 队列 | `{ "jobId": "string", "resumeId": "string", "snapshotVersion": "number", "templateId": "string", "requestedBy": "string", "traceId": "string", "createdAt": "ISO8601" }` | 入队成功：`{ "queued": true, "queueMsgId": "string" }` |

## 3.6 Export Worker -> Object Storage

| 发起方 | 接收方 | 输入格式 | 返回结果 |
|---|---|---|---|
| `Export Worker` | `Object Storage` | `binary(pdf) + meta { jobId, resumeId, contentType }` | `{ "fileKey": "exports/2026/03/job_x.pdf", "downloadUrl": "https://cdn.example.com/exports/...pdf", "etag": "string" }` |

## 3.7 Export Worker -> Export API（回调）

- 调用：`POST /api/internal/v1/export-jobs/{jobId}/complete`
- 请求（成功）：

```json
{
  "status": "succeeded",
  "fileKey": "exports/2026/03/job_x.pdf",
  "downloadUrl": "https://cdn.example.com/exports/...pdf",
  "finishedAt": "2026-03-24T09:35:22Z",
  "traceId": "7f5dbf3a6c9f4a9d"
}
```

- 请求（失败）：

```json
{
  "status": "failed",
  "errorCode": "PDF_RENDER_ERROR",
  "errorMessage": "template render timeout",
  "finishedAt": "2026-03-24T09:35:22Z",
  "traceId": "7f5dbf3a6c9f4a9d"
}
```

- 返回：

```json
{
  "code": "OK",
  "message": "ack",
  "traceId": "7f5dbf3a6c9f4a9d",
  "data": {
    "jobId": "job_01JZ7JQXVE6EG0QF2QXK",
    "status": "succeeded|failed"
  }
}
```

## 4. 状态机约束（导出任务）

- 允许流转：`queued -> processing -> succeeded`
- 允许流转：`queued -> processing -> failed`
- 禁止回退：`succeeded/failed` 终态后不可再更新

## 5. 并发与幂等约束

- 保存草稿必须带 `baseVersion`，后端采用乐观锁校验。
- `PATCH /draft` 支持 `Idempotency-Key` 请求头（推荐）。
- `POST /export-jobs` 同一 `resumeId + snapshotVersion + format` 在 60 秒内去重，返回同一个 `jobId`。

## 6. 最小错误码集合

- `RESUME_NOT_FOUND`
- `VALIDATION_ERROR`
- `VERSION_CONFLICT`
- `EXPORT_JOB_NOT_FOUND`
- `EXPORT_JOB_TIMEOUT`
- `PDF_RENDER_ERROR`
- `STORAGE_UPLOAD_FAILED`
- `INTERNAL_ERROR`

## 7. 验收标准（接口层）

- 任一接口都返回统一响应包（成功/失败）。
- 前端可仅凭接口数据驱动编辑、保存、导入、导出全流程。
- 导出链路可追踪（`traceId` + `jobId` 全链路一致）。
