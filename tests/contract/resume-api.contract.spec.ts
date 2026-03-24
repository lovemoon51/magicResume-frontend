import assert from "node:assert/strict";
import { ApiApplication } from "../../services/api/src/main";

export async function runResumeApiContractSpec(): Promise<void> {
  const api = new ApiApplication();

  const loaded = api.getResume("res_demo_001");
  assert.equal(loaded.code, "OK");

  if (!("data" in loaded)) {
    throw new Error("resume should exist");
  }

  const baseVersion = loaded.data.resume.version;
  const saveResult = api.saveDraft("res_demo_001", {
    baseVersion,
    snapshot: loaded.data.resume,
    clientTs: "2026-03-24T10:00:00Z"
  });
  assert.equal(saveResult.code, "OK");

  const staleSaveResult = api.saveDraft("res_demo_001", {
    baseVersion,
    snapshot: loaded.data.resume,
    clientTs: "2026-03-24T10:00:01Z"
  });
  assert.equal(staleSaveResult.code, "VERSION_CONFLICT");
}
