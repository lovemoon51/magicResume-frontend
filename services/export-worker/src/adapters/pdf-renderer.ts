import type { ResumeAggregate } from "@magic/types/resume";

export interface PdfRendererPort {
  render(resume: ResumeAggregate, templateId: string): Promise<Uint8Array>;
}

export class FakePdfRenderer implements PdfRendererPort {
  async render(resume: ResumeAggregate, templateId: string): Promise<Uint8Array> {
    const websiteContact = resume.basics.contacts.find((item) => {
      const label = item.label.toLowerCase();
      return (
        item.icon === "website" || label.includes("网站") || label.includes("url")
      );
    });

    const lines = [
      `TITLE:${resume.title}`,
      `TEMPLATE:${templateId}`,
      `VERSION:${resume.version}`,
      `UPDATED_AT:${resume.updatedAt}`
    ];
    if (websiteContact?.value) {
      lines.push(`WEBSITE:${websiteContact.value}`);
    }
    const content = lines.join("\n");
    return new TextEncoder().encode(content);
  }
}
