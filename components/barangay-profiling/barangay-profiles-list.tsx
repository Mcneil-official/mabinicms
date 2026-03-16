"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  UserPlus,
  Loader2,
} from "lucide-react";
import type { BarangayProfileFormData } from "./barangay-profile-form";

export interface BarangayProfile extends BarangayProfileFormData {
  id: string;
  createdAt: string;
}

interface BarangayProfilesListProps {
  profiles: BarangayProfile[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (profile: BarangayProfile) => void;
  onView: (profile: BarangayProfile) => void;
  onDelete: (id: string) => void;
}

const CIVIL_STATUS_LABELS: Record<string, string> = {
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  separated: "Separated",
  annulled: "Annulled",
};

function countSelectedHistory(value: string): number {
  if (!value) return 0;
  return value
    .split("|")
    .map((v) => v.trim())
    .filter((v) => v && v !== "none").length;
}

export function BarangayProfilesList({
  profiles,
  isLoading = false,
  onAdd,
  onEdit,
  onView,
  onDelete,
}: BarangayProfilesListProps) {
  const [search, setSearch] = useState("");

  const filtered = profiles.filter((p) => {
    const fullName =
      `${p.lastName} ${p.firstName} ${p.middleName}`.toLowerCase();
    const q = search.toLowerCase();
    return (
      fullName.includes(q) ||
      p.philhealthNo.toLowerCase().includes(q) ||
      p.currentBarangay.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, PhilHealth No., or barangay…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={onAdd} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {/* Pregnancy Monitoring Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Pregnancy Monitoring Table
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Barangay</TableHead>
              <TableHead className="hidden md:table-cell">Pregnant</TableHead>
              <TableHead className="hidden lg:table-cell">AOG (Months)</TableHead>
              <TableHead className="hidden lg:table-cell">Gravida/Para</TableHead>
              <TableHead className="hidden lg:table-cell">Risk Level</TableHead>
              <TableHead className="hidden xl:table-cell">Prenatal Check-up</TableHead>
              <TableHead className="w-15">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading profiles…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  {search
                    ? "No profiles match your search."
                    : "No profiles added yet. Click \"Add Profile\" to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((profile) => (
                <TableRow
                  key={`preg-${profile.id}`}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => onView(profile)}
                >
                  <TableCell className="font-medium">
                    {[profile.lastName, profile.firstName, profile.middleName]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300">
                    {profile.currentBarangay || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={profile.isPregnant === "yes" ? "default" : "outline"}
                      className={
                        profile.isPregnant === "yes"
                          ? "bg-pink-600 hover:bg-pink-600"
                          : ""
                      }
                    >
                      {profile.isPregnant === "yes"
                        ? "Yes"
                        : profile.isPregnant === "no"
                          ? "No"
                          : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-300">
                    {profile.pregnancyMonths || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-300">
                    {profile.gravida || "—"}/{profile.para || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {profile.pregnancyRiskLevel ? (
                      <Badge
                        variant={
                          profile.pregnancyRiskLevel === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {profile.pregnancyRiskLevel}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-600 dark:text-slate-300">
                    {profile.prenatalCheckupDate || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(profile)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(profile)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          onClick={() => onDelete(profile.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Medical History Monitoring Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Medical History Monitoring Table
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Barangay</TableHead>
              <TableHead className="hidden lg:table-cell">Past Medical</TableHead>
              <TableHead className="hidden lg:table-cell">Family History</TableHead>
              <TableHead className="hidden xl:table-cell">Smoking</TableHead>
              <TableHead className="hidden xl:table-cell">Alcohol</TableHead>
              <TableHead className="hidden xl:table-cell">Illicit Drugs</TableHead>
              <TableHead className="hidden xl:table-cell">Sexually Active</TableHead>
              <TableHead className="w-15">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading profiles…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  {search
                    ? "No profiles match your search."
                    : "No profiles added yet. Click \"Add Profile\" to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((profile) => (
                <TableRow
                  key={`med-${profile.id}`}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => onView(profile)}
                >
                  <TableCell className="font-medium">
                    {[profile.lastName, profile.firstName, profile.middleName]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300">
                    {profile.currentBarangay || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-300">
                    {countSelectedHistory(profile.pastMedicalHistory)} item
                    {countSelectedHistory(profile.pastMedicalHistory) !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-300">
                    {countSelectedHistory(profile.familyHistory)} item
                    {countSelectedHistory(profile.familyHistory) !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-600 dark:text-slate-300 capitalize">
                    {profile.smokingStatus || "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-600 dark:text-slate-300 capitalize">
                    {profile.alcoholIntake || "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-600 dark:text-slate-300 capitalize">
                    {profile.illicitDrugs || "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-600 dark:text-slate-300 capitalize">
                    {profile.sexuallyActive || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(profile)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(profile)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          onClick={() => onDelete(profile.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
          Showing {filtered.length} of {profiles.length} profile
          {profiles.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
