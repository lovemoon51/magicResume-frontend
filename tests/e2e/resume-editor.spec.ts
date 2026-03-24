import assert from "node:assert/strict";
import { ApiApplication } from "../../services/api/src/main";
import { ExportWorkerApplication } from "../../services/export-worker/src/main";

export async function runResumeEditorE2ESpec(): Promise<void> {
  const api = new ApiApplication();
  const worker = new ExportWorkerApplication(api);
  worker.start();

  const createResult = api.createExportJob("res_demo_001", {
    templateId: "tpl_classic_cn_v1",
    snapshotVersion: 1,
    format: "pdf"
  });
  assert.equal(createResult.code, "OK");

  if (!("data" in createResult)) {
    throw new Error("failed to create export job");
  }

  await sleep(50);

  const job = api.getExportJob(createResult.data.jobId);
  assert.equal(job.code, "OK");

  if (!("data" in job)) {
    throw new Error("failed to query export job");
  }

  assert.equal(job.data.status, "succeeded");
  assert.ok(job.data.downloadUrl.startsWith("/downloads/"));

  worker.stop();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
