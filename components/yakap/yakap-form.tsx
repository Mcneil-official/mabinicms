"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle2, X } from "lucide-react";
import type { Resident } from "@/lib/types";
import { MABINI_BARANGAYS } from "@/lib/constants/barangays";

interface YakakFormProps {
  residents: Resident[];
  isLoading?: boolean;
  onSubmit?: (formData: YakakFormData) => Promise<void>;
  onSuccess?: () => void;
}

export interface YakakFormData {
  barangay: string;
  resident_name: string;
  philhealth_no?: string;
  membership_type: "individual" | "family" | "senior" | "pwd";
}

export function YakakForm({
  residents,
  isLoading,
  onSubmit,
  onSuccess,
}: YakakFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ensure consistent boolean value for hydration
  const loading = Boolean(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [barangaySearch, setBarangaySearch] = useState("");
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [formData, setFormData] = useState<YakakFormData>({
    barangay: "",
    resident_name: "",
    philhealth_no: "",
    membership_type: "individual",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter barangays based on search
  const filteredBarangays = MABINI_BARANGAYS.filter((b) =>
    b.toLowerCase().includes(barangaySearch.toLowerCase()),
  );

  useEffect(() => {
    // Reset resident name when barangay changes
    setFormData((prev) => ({ ...prev, resident_name: "" }));
  }, [formData.barangay]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.barangay) {
      newErrors.barangay = "Please select a barangay";
    }
    if (!formData.resident_name.trim()) {
      newErrors.resident_name = "Please enter resident name";
    }
    if (!formData.membership_type) {
      newErrors.membership_type = "Please select membership type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSuccess(true);
      setFormData({
        barangay: "",
        resident_name: "",
        philhealth_no: "",
        membership_type: "individual",
      });
      setBarangaySearch("");
      setShowBarangayDropdown(false);

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New YAKAP Application</CardTitle>
        <CardDescription>
          Register a resident for YAKAP (Kalusugan Para sa Lahat) health
          insurance coverage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Barangay Selection with Search */}
          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay *</Label>
            <div className="relative">
              <div
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-950"
                onClick={() => setShowBarangayDropdown(!showBarangayDropdown)}
              >
                {formData.barangay ? (
                  <div className="flex items-center justify-between">
                    <span>{formData.barangay}</span>
                    <X
                      className="h-4 w-4 text-gray-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, barangay: "" }));
                        setBarangaySearch("");
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-gray-500">Select a barangay...</span>
                )}
              </div>

              {showBarangayDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 dark:bg-gray-950 dark:border-gray-600">
                  <Input
                    placeholder="Search barangay..."
                    className="m-2 border rounded"
                    value={barangaySearch}
                    onChange={(e) => setBarangaySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredBarangays.length > 0 ? (
                      filteredBarangays.map((barangay) => (
                        <div
                          key={barangay}
                          className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, barangay }));
                            setShowBarangayDropdown(false);
                            setBarangaySearch("");
                          }}
                        >
                          {barangay}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No barangays found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.barangay && (
              <p className="text-sm text-red-600">{errors.barangay}</p>
            )}
          </div>

          {/* Resident Selection */}
          {/* Resident Name Input */}
          <div className="space-y-2">
            <Label htmlFor="resident_name">Resident Name *</Label>
            {!formData.barangay ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-200">
                Please select a barangay first
              </div>
            ) : (
              <Input
                id="resident_name"
                placeholder="Enter full name of resident"
                value={formData.resident_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    resident_name: e.target.value,
                  }))
                }
                className="w-full"
              />
            )}
            {errors.resident_name && (
              <p className="text-sm text-red-600">{errors.resident_name}</p>
            )}
          </div>

          {/* PhilHealth Number */}
          <div className="space-y-2">
            <Label htmlFor="philhealth_no">PhilHealth Number (Optional)</Label>
            <Input
              id="philhealth_no"
              placeholder="12-345678901-2"
              value={formData.philhealth_no}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  philhealth_no: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Format: XX-XXXXXXXXX-X (PhilHealth ID number if available)
            </p>
          </div>

          {/* Membership Type */}
          <div className="space-y-2">
            <Label htmlFor="membership_type">Membership Type *</Label>
            <Select
              value={formData.membership_type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  membership_type: value as YakakFormData["membership_type"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="senior">Senior Citizen</SelectItem>
                <SelectItem value="pwd">
                  Person with Disability (PWD)
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.membership_type && (
              <p className="text-sm text-red-600">{errors.membership_type}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex gap-3 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <p>YAKAP application submitted successfully!</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Submitting..." : "Submit YAKAP Application"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  barangay: "",
                  resident_name: "",
                  philhealth_no: "",
                  membership_type: "individual",
                });
                setBarangaySearch("");
                setShowBarangayDropdown(false);
                setError(null);
                setSuccess(false);
                setErrors({});
              }}
              disabled={isSubmitting || loading}
            >
              Clear
            </Button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            * Required fields. Fields are aligned with PhilHealth Konsulta
            Registration requirements.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
