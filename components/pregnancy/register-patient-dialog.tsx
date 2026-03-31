"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createResidentAction } from "@/lib/actions/create-resident";
import { MABINI_BARANGAYS } from "@/lib/constants/barangays";

const EMPTY_FORM = {
  full_name: "",
  birth_date: "",
  barangay: "",
  purok: "",
  contact_number: "",
  philhealth_no: "",
};

interface RegisterPatientDialogProps {
  /** Called after a resident is created so the list can refresh */
  onCreated?: (residentId: string) => void;
}

export function RegisterPatientDialog({
  onCreated,
}: RegisterPatientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createResidentAction({
        full_name: form.full_name,
        birth_date: form.birth_date,
        barangay: form.barangay,
        purok: form.purok,
        contact_number: form.contact_number || undefined,
        philhealth_no: form.philhealth_no || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Reset and close dialog
      setForm(EMPTY_FORM);
      setOpen(false);

      // Notify parent to refresh, then navigate to the new profile form
      onCreated?.(result.id);
      router.push(`/dashboard/pregnancy/${result.id}`);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setForm(EMPTY_FORM);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 bg-pink-600 hover:bg-pink-700 text-white">
          <UserPlus className="size-4" />
          Register New Patient
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-pink-600" />
            Register New Pregnant Patient
          </DialogTitle>
          <DialogDescription>
            Enter the patient&apos;s basic information. You will be taken to the
            pregnancy profile form to complete her record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-full-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rp-full-name"
              placeholder="e.g. Maria Santos"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              disabled={isPending}
              autoComplete="off"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-birth-date">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rp-birth-date"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.birth_date}
              onChange={(e) => handleChange("birth_date", e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Barangay + Purok side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Barangay <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.barangay}
                onValueChange={(v) => handleChange("barangay", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {MABINI_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp-purok">
                Purok / Zone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rp-purok"
                placeholder="e.g. Purok 3"
                value={form.purok}
                onChange={(e) => handleChange("purok", e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-contact">Contact Number</Label>
            <Input
              id="rp-contact"
              type="tel"
              placeholder="09XXXXXXXXX"
              value={form.contact_number}
              onChange={(e) => handleChange("contact_number", e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* PhilHealth No. */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-philhealth">PhilHealth No.</Label>
            <Input
              id="rp-philhealth"
              placeholder="PH-XXXX-XXXXXX"
              value={form.philhealth_no}
              onChange={(e) => handleChange("philhealth_no", e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Registering…
                </>
              ) : (
                "Register & Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
