"use client";

import * as React from "react";
import {
  AlertTriangle,
  Download,
  HardDriveDownload,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { authFetch } from "@/lib/auth";

/**
 * Download and restore the whole homepage configuration.
 *
 * This exists because the backend keeps that configuration in Redis and nowhere
 * else (pinkbliss ADR-0011). Nothing slower and truer sits behind it, so if the
 * production Redis is flushed, evicted under an `allkeys-*` policy, or restarted
 * without a persistent volume, the homepage is gone and the only recovery is
 * re-authoring it by hand. A file on someone's laptop is a copy in a different
 * failure domain, which is the whole point.
 */

interface BackupManagerProps {
  /** Section count of the live configuration, for the confirmation summary. */
  currentSectionCount: number;
}

/** What a parsed, accepted backup file looks like before we send it. */
interface PendingImport {
  fileName: string;
  config: Record<string, unknown>;
  sectionCount: number | null;
  /** Set when the file is a valid object but not shaped like a homepage. */
  shapeWarning: string | null;
}

export function BackupManager({ currentSectionCount }: BackupManagerProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [pending, setPending] = React.useState<PendingImport | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  /**
   * Exports what the **server** holds, not what the editor is showing.
   *
   * Deliberate: a backup that included unsaved edits would be a file that was
   * never live, which is the opposite of what a restore point is for. One extra
   * read is worth the file meaning exactly one thing.
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await authFetch("/home-sections-v2", { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to read the configuration (${response.status})`);
      }

      const config = await response.json();

      // An empty object is what the backend serves when the record is missing.
      // Downloading it would produce a "backup" that restores a blank homepage —
      // the exact file someone reaches for in a disaster and the worst one to
      // hand them.
      const isEmpty =
        !config ||
        typeof config !== "object" ||
        Object.keys(config).length === 0;
      if (isEmpty) {
        throw new Error(
          "The server returned an empty configuration — nothing to export.",
        );
      }

      downloadJson(config, backupFileName());

      addToast({
        title: "Exported",
        description: "The saved configuration has been downloaded.",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      addToast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Could not export.",
        variant: "error",
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  /** Parses and vets the chosen file, then asks before touching anything. */
  const handleFileChosen = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Always clear the input: picking the same file twice in a row fires no
    // change event otherwise, so a cancelled import could not be retried.
    event.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());

      // The same rule the backend enforces, checked here so a bad file is
      // rejected before it can replace anything.
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(
          "A backup must be a JSON object. This file holds " +
            (Array.isArray(parsed) ? "an array" : `a ${typeof parsed}`) +
            ".",
        );
      }

      const config = parsed as Record<string, unknown>;
      const sections = config.sections;
      const hasSections = Array.isArray(sections);

      setPending({
        fileName: file.name,
        config,
        sectionCount: hasSections ? sections.length : null,
        // Not fatal — the backend accepts any object, and refusing here would
        // block a legitimate restore of a config whose keys changed. But
        // `sections` is what the app reads, so an operator should be told
        // before the homepage goes blank rather than after.
        shapeWarning: hasSections
          ? null
          : 'This file has no "sections" array. Restoring it will leave the app\'s homepage empty.',
      });
    } catch (error) {
      addToast({
        title: "Could not read that file",
        description:
          error instanceof Error
            ? error.message
            : "The file is not valid JSON.",
        variant: "error",
        duration: 6000,
      });
    }
  };

  /**
   * Sends the vetted file, replacing the live configuration.
   *
   * The page is reloaded on success rather than patched in place. The section
   * and settings editors take their initial state as props and hold it from
   * then on, so leaving them mounted would show the old homepage over the new
   * record — and the next Save would write the stale version straight back.
   */
  const handleConfirmImport = async () => {
    if (!pending) return;

    setIsImporting(true);
    try {
      const response = await authFetch("/home-sections-v2", {
        method: "PUT",
        body: JSON.stringify(pending.config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to restore (${response.status})`,
        );
      }

      setPending(null);
      addToast({
        title: "Restored",
        description: "Reloading with the imported configuration…",
        variant: "success",
        duration: 2000,
      });
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setIsImporting(false);
      addToast({
        title: "Restore failed",
        description:
          error instanceof Error ? error.message : "Could not restore.",
        variant: "error",
        duration: 6000,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Backup &amp; Restore</CardTitle>
              <CardDescription>
                Keep a copy of the homepage configuration outside the server
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The homepage configuration lives only on the server. Export it after
            any change you would not want to rebuild by hand — the downloaded
            file is the only copy that survives the server being lost.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className={isExporting ? "cursor-not-allowed" : "cursor-pointer"}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChosen}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Controlled, because it opens once a file has been read and vetted —
          there is no button to hang an AlertDialogTrigger on. */}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isImporting) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the live homepage?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This replaces the entire homepage configuration with the
                  contents of{" "}
                  <span className="font-medium text-foreground">
                    {pending?.fileName}
                  </span>
                  , and takes effect in the app immediately.
                </p>
                <p className="text-sm">
                  {pending?.sectionCount === null ? (
                    "No sections found in the file."
                  ) : (
                    <>
                      The file holds{" "}
                      <span className="font-medium text-foreground">
                        {pending?.sectionCount} section
                        {pending?.sectionCount === 1 ? "" : "s"}
                      </span>
                      , replacing the {currentSectionCount} currently live.
                    </>
                  )}
                </p>
                {pending?.shapeWarning && (
                  <p className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{pending.shapeWarning}</span>
                  </p>
                )}
                <p className="text-xs">
                  The server keeps the configuration this replaces as a rollback
                  copy, so a mistaken restore can be undone on the server.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isImporting}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Radix closes on action click; the dialog has to stay up while
                // the request is in flight so the button can show progress.
                event.preventDefault();
                void handleConfirmImport();
              }}
              disabled={isImporting}
              className="cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Replace homepage"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** `pinkbliss-homepage-2026-09-04-1432.json` — sorts chronologically. */
function backupFileName(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `pinkbliss-homepage-${stamp}.json`;
}

function downloadJson(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
