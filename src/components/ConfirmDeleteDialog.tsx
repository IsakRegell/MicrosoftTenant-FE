import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  customerName: string;
  onConfirm: () => void | Promise<void>; // funkar nu fint även om du returnerar en Promise
  onClose: () => void;
  requiredText?: string; // default "ja-tabort!"
};

export function ConfirmDeleteDialog({
  open,
  customerName,
  onConfirm,
  onClose,
  requiredText = "ja-tabort!",
}: Props) {
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValue("");
      setSubmitting(false);
      setCopied(false);
    }
  }, [open]);

  const okEnabled = value.trim() === requiredText;

  const handleConfirm = async () => {
    if (!okEnabled || submitting) return;
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requiredText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const inputHasError = value.length > 0 && !okEnabled;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <AlertDialogContent className="rounded-xl border border-border/60 shadow-2xl">
        <AlertDialogHeader className="space-y-1">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 ring-1 ring-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Oåterkallelig åtgärd
            </span>
          </div>
          <AlertDialogTitle className="mt-1">
            Ta bort kund <span className="font-semibold text-primary">{customerName}</span>?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Denna åtgärd kan inte ångras och tar bort kundens data permanent.
            För att bekräfta, skriv exakt texten här nedan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Krav-text + Copy */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-mono tracking-tight">
            {requiredText}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={submitting}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopierad" : "Kopiera"}
          </Button>
        </div>

        {/* Input */}
        <div className="space-y-1">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={requiredText}
            autoFocus
            spellCheck={false}
            disabled={submitting}
            className={cn(
              "h-9",
              inputHasError &&
                "border-destructive/50 focus-visible:ring-destructive/40 bg-destructive/5"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleConfirm();
              }
            }}
          />
          <p
            className={cn(
              "text-xs",
              inputHasError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {inputHasError
              ? "Texten matchar inte. Skriv exakt som ovan."
              : "Tryck Enter för att bekräfta när texten matchar."}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Avbryt
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={!okEnabled || submitting}
              onClick={handleConfirm}
              className="gap-2"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-l-current" />
              )}
              Radera
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDeleteDialog;
