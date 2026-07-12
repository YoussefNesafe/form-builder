"use client";

import { useState } from "react";
import Link from "next/link";
import { Code2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { builder } from "@/locales/en/builder";
import { useBuilderStore } from "./model/store";
import { CodeOutputPanel } from "./CodeOutputPanel";

/** Header cluster: export the config code, and reset the builder (with confirm). */
export function BuilderHeaderActions() {
  const reset = useBuilderStore((s) => s.reset);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Code2 />
            {builder.header.exportButton}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-32px)] tablet:w-[640px] desktop:w-[720px] max-w-[720px] tablet:max-w-[720px] desktop:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{builder.header.exportDialogTitle}</DialogTitle>
            <DialogDescription>
              {builder.header.exportDialogDescription}{" "}
              {builder.header.exportInstallPrefix}
              <Link
                href="/docs/installation"
                className="border-b border-muted-foreground/40 text-foreground transition-colors hover:border-foreground focus-visible:border-foreground focus-visible:outline-none"
              >
                {builder.header.exportInstallLinkText}
              </Link>
              {builder.header.exportInstallSuffix}
            </DialogDescription>
          </DialogHeader>
          <CodeOutputPanel />
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCcw />
            {builder.header.resetButton}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-32px)] tablet:w-[420px] desktop:w-[420px] max-w-[420px] tablet:max-w-[420px] desktop:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{builder.header.resetDialogTitle}</DialogTitle>
            <DialogDescription>{builder.header.resetDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                {builder.header.resetCancel}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                reset();
                setResetOpen(false);
              }}
            >
              {builder.header.resetConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
