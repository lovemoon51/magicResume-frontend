import { runResumeApiContractSpec } from "./contract/resume-api.contract.spec";
import { runResumeEditorE2ESpec } from "./e2e/resume-editor.spec";

async function main(): Promise<void> {
  await runResumeApiContractSpec();
  await runResumeEditorE2ESpec();
  // eslint-disable-next-line no-console
  console.log("All specs passed.");
}

void main();
