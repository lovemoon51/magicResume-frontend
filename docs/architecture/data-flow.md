# 数据流路线（实现版）

## 编辑保存链路

1. `EditorPanel` 触发 `ResumeEditorActions`（`setTitle/upsertContactItem/upsertSectionItem`）。
2. `ResumeEditorActions` 更新 `ResumeEditorStore` 并标记 `dirty=true`。
3. 同时写入 `localStorage.resume_draft_{resumeId}` 草稿快照。
4. `AutoSaveScheduler` 监听到脏状态并节流触发 `saveNow`。
5. `saveNow` 调用 `ResumeRepository.saveDraft`，请求 `PATCH /api/v1/resumes/{resumeId}/draft`。
6. `ResumeService` 乐观锁校验 `baseVersion`，成功后递增版本并持久化（当前为内存实现）。
7. 返回 `savedVersion/updatedAt`，前端刷新状态并清除脏标记。

## 导出链路

1. `TopNav` 触发 `ExportPdfUseCase.start`。
2. 前端调用 `POST /api/v1/resumes/{resumeId}/export-jobs`。
3. `ExportService` 创建任务并发布消息到 `resume.export.pdf`。
4. `ExportWorkerApplication` 订阅队列，`ExportJobRunner` 拉取任务并置 `processing`。
5. worker 通过 `PdfRenderer` 渲染字节流，并上传到 `ObjectStorage`。
6. worker 回调 `completeExportJob`，任务进入 `succeeded/failed` 终态。
7. 前端轮询 `GET /api/v1/export-jobs/{jobId}`，拿到 `downloadUrl` 或错误码。
