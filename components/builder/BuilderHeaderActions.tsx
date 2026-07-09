"use client";

import { useState } from "react";
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
import { useBuilderStore } from "./model/store";
import { OutputPane } from "./OutputPane";

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
            Export code
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-32px)] tablet:w-[640px] desktop:w-[720px] max-w-[720px] tablet:max-w-[720px] desktop:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Form config</DialogTitle>
            <DialogDescription>Copy this into a page or your CMS.</DialogDescription>
          </DialogHeader>
          <OutputPane />
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCcw />
            Reset
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-32px)] tablet:w-[420px] desktop:w-[420px] max-w-[420px] tablet:max-w-[420px] desktop:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reset the builder?</DialogTitle>
            <DialogDescription>This clears every field and step. It cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
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
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
