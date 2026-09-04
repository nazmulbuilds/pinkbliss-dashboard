"use client";

import * as React from "react";
import {
  Settings,
  Truck,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { BackupManager } from "./backup-manager";
import { authFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SettingsManagerProps {
  initialFastrrCheckout: boolean;
  initialRazorPay: boolean;
  sections: unknown[];
  onFastrrCheckoutChange: (enabled: boolean) => void;
  onRazorPayChange: (enabled: boolean) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function SettingsManager({
  initialFastrrCheckout,
  initialRazorPay,
  sections,
  onFastrrCheckoutChange,
  onRazorPayChange,
}: SettingsManagerProps) {
  const [fastrrCheckout, setFastrrCheckout] = React.useState(
    initialFastrrCheckout,
  );
  const [razorPay, setRazorPay] = React.useState(initialRazorPay);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const { addToast } = useToast();

  const handleToggle = (enabled: boolean) => {
    setFastrrCheckout(enabled);
    if (enabled) setRazorPay(false);
    setHasChanges(true);
  };

  const handleRazorPayToggle = (enabled: boolean) => {
    setRazorPay(enabled);
    if (enabled) setFastrrCheckout(false);
    setHasChanges(true);
  };

  const handleReset = () => {
    setFastrrCheckout(initialFastrrCheckout);
    setRazorPay(initialRazorPay);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const response = await authFetch("/home-sections-v2", {
        method: "PUT",
        body: JSON.stringify({ sections, fastrrCheckout, razorPay }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to save (${response.status})`,
        );
      }

      setSaveStatus("success");
      setHasChanges(false);
      onFastrrCheckoutChange(fastrrCheckout);
      onRazorPayChange(razorPay);

      addToast({
        title: "Success!",
        description: "Settings saved successfully",
        variant: "success",
        duration: 3000,
      });

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save settings";
      setErrorMessage(errorMsg);

      addToast({
        title: "Error",
        description: errorMsg,
        variant: "error",
        duration: 5000,
      });

      setTimeout(() => {
        setSaveStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure app behavior and checkout options
        </p>
      </div>

      {/* Fastrr Checkout Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  fastrrCheckout
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Fastrr Checkout</CardTitle>
                <CardDescription>
                  Shipping based payment gateway
                </CardDescription>
              </div>
            </div>
            <Switch checked={fastrrCheckout} onCheckedChange={handleToggle} />
          </div>
        </CardHeader>
      </Card>

      {/* RazorPay Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  razorPay
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>RazorPay</CardTitle>
                <CardDescription>
                  Online payment gateway by Razorpay
                </CardDescription>
              </div>
            </div>
            <Switch checked={razorPay} onCheckedChange={handleRazorPayToggle} />
          </div>
        </CardHeader>
      </Card>

      {/* Backup & Restore — the configuration lives only on the server. */}
      <BackupManager currentSectionCount={sections.length} />

      {/* Footer Actions */}
      <div className="sticky bottom-0 -mx-4 -mb-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 py-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={
                  !hasChanges ? "cursor-not-allowed" : "cursor-pointer"
                }
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard all unsaved changes and revert to the
                  initial settings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="cursor-pointer"
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === "saving"}
            className={
              saveStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-600 cursor-not-allowed"
                : saveStatus === "error"
                  ? "bg-destructive hover:bg-destructive cursor-not-allowed"
                  : "cursor-pointer"
            }
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Saved!
              </>
            ) : saveStatus === "error" ? (
              <>
                <XCircle className="h-4 w-4 mr-1.5" />
                Failed
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        {hasChanges && saveStatus === "idle" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-right">
            You have unsaved changes
          </p>
        )}
        {saveStatus === "success" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-right">
            Settings saved successfully!
          </p>
        )}
        {saveStatus === "error" && errorMessage && (
          <p className="text-xs text-destructive mt-2 text-right">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
