import type { ResumeExportMessage } from "@magic/types/export";

export interface QueuePublishResult {
  queued: boolean;
  queueMsgId: string;
}

export interface ResumeExportQueue {
  publish(message: ResumeExportMessage): QueuePublishResult;
  subscribe(listener: (message: ResumeExportMessage) => void): () => void;
}

export class InMemoryResumeExportQueue implements ResumeExportQueue {
  private readonly listeners = new Set<(message: ResumeExportMessage) => void>();

  publish(message: ResumeExportMessage): QueuePublishResult {
    for (const listener of this.listeners) {
      listener(message);
    }
    return {
      queued: true,
      queueMsgId: `msg_${message.jobId}`
    };
  }

  subscribe(listener: (message: ResumeExportMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
