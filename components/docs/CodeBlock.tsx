import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { renderCodeWithDimmedComments } from "./codeHighlight";
import {
  CODE_BLOCK_CONTAINER_CLASS,
  CODE_BLOCK_COPY_PADDING_CLASS,
  CODE_BLOCK_PADDING_CLASS,
  CODE_BLOCK_TEXT_CLASS,
} from "./codeBlockStyles";

type CodeBlockProps = {
  code: string;
  className?: string;
  label?: string;
  copy?: boolean;
  copyLabel?: string;
  decorative?: boolean;
};

export function CodeBlock({
  code,
  className,
  label = "Code example",
  copy = false,
  copyLabel,
  decorative = false,
}: CodeBlockProps) {
  return (
    <div className="relative min-w-0">
      <pre
        dir="ltr"
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? "true" : undefined}
        className={cn(
          decorative ? "overflow-hidden" : "whitespace-pre-wrap [overflow-wrap:break-word]",
          CODE_BLOCK_CONTAINER_CLASS,
          CODE_BLOCK_PADDING_CLASS,
          CODE_BLOCK_TEXT_CLASS,
          copy && !decorative && CODE_BLOCK_COPY_PADDING_CLASS,
          className,
        )}
      >
        <code>{renderCodeWithDimmedComments(code)}</code>
      </pre>
      {copy && !decorative && (
        <CopyButton
          text={code}
          label={copyLabel}
          className="absolute top-[1.602vw] right-[1.602vw] tablet:top-[0.75vw] tablet:right-[0.75vw] desktop:top-[0.312vw] desktop:right-[0.312vw]"
        />
      )}
    </div>
  );
}
