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
    <div className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Code2 />
            {builder.header.exportButton}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-8.544vw)] tablet:w-[80vw] desktop:w-[37.44vw] max-w-[192.24vw] tablet:max-w-[90vw] desktop:max-w-[37.44vw]">
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
        <DialogContent className="w-[calc(100vw-8.544vw)] tablet:w-[52.5vw] desktop:w-[21.84vw] max-w-[112.14vw] tablet:max-w-[52.5vw] desktop:max-w-[21.84vw]">
          <DialogHeader>
            <DialogTitle>{builder.header.resetDialogTitle}</DialogTitle>
            <DialogDescription>
              {builder.header.resetDialogDescription}
            </DialogDescription>
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
