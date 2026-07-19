import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "file-uploads";
const title = "File uploads";

const PRESIGNED_CODE = `// The client uploads directly to storage and submits a storage
// reference, never the file bytes, over the JSON body parseSubmission sees.
{ type: "file", name: "resume" } // omitted from schema validation, always

// A typical presigned-upload shape the host validates on its own:
{ "resume": { "key": "uploads/abc123.pdf", "size": 214532, "contentType": "application/pdf" } }`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>file</IC> fields are <strong className="text-foreground">always</strong> omitted from server
        validation, and their names always appear in <IC>unvalidated</IC>. Three reasons, all structural:
      </P>
      <ul className="flex flex-col gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw] list-disc pl-[4.272vw] tablet:pl-[2vw] desktop:pl-[0.832vw] text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground">
        <li>
          <IC>z.instanceof(File)</IC> throws at schema-<em>build</em> time on a runtime with no global{" "}
          <IC>File</IC> — this would break server-side schema construction outright, not just fail validation.
        </li>
        <li>A JSON request body can never contain a File value in the first place.</li>
        <li>
          The host already holds the authoritative storage record (size, content type, hash) once the upload
          completes — re-deriving that from client-declared metadata would be strictly worse.
        </li>
      </ul>
      <DocsNote variant="warning" label="Host-owned">
        The host owns upload validation entirely — size, MIME, and content-sniffing — against its own storage
        API. Never trust a client-declared MIME type; sniff the actual bytes, or trust what the storage provider
        reports after the upload completes.
      </DocsNote>
      <P>
        Omitted from the <em>schema</em> only — a visible <IC>file</IC> field&apos;s raw value still passes
        through <IC>result.values</IC> unvalidated (same as a custom field type&apos;s value), so you don&apos;t
        have to re-read it off the raw request body. The host must still validate it against its own storage
        record before trusting it.
      </P>
      <CodeBlock code={PRESIGNED_CODE} label="Presigned upload shape" />
    </DocsSection>
  );
}

export const FileUploadsSection = { id, title, Section };
