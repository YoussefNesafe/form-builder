"use client";

import Link from "next/link";
import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { builder } from "@/locales/en/builder";
import { ThemeExportPanel } from "./ThemeExportPanel";

export function SizingCssDialog({
  showInstallLink = true,
}: {
  showInstallLink?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="lg">
          <Ruler />
          {builder.theme.triggerButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-8.544vw)] tablet:w-[80vw] desktop:w-[37.44vw] max-w-[192.24vw] tablet:max-w-[90vw] desktop:max-w-[37.44vw]">
        <DialogHeader>
          <DialogTitle>{builder.theme.dialogTitle}</DialogTitle>
          <DialogDescription>
            {builder.theme.dialogDescription}
            {showInstallLink && (
              <>
                {" "}
                {builder.header.exportInstallPrefix}
                <Link
                  href="/docs/installation"
                  className="border-b border-muted-foreground/40 text-foreground transition-colors hover:border-foreground focus-visible:border-foreground focus-visible:outline-none"
                >
                  {builder.header.exportInstallLinkText}
                </Link>
                {builder.header.exportInstallSuffix}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <ThemeExportPanel />
      </DialogContent>
    </Dialog>
  );
}
