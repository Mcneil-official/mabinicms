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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/format";
import type { User } from "@/lib/types";

interface StaffTableProps {
  users: User[];
  isLoading?: boolean;
  onRoleChange?: (role: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const roleColors: Record<string, { bg: string; text: string; label: string }> =
  {
    admin: {
      bg: "bg-red-50 dark:bg-red-950",
      text: "text-red-700 dark:text-red-200",
      label: "Administrator",
    },
    staff: {
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-700 dark:text-blue-200",
      label: "Staff",
    },
    user: {
      bg: "bg-green-50 dark:bg-green-950",
      text: "text-green-700 dark:text-green-200",
      label: "Health Worker",
    },
  };

export function StaffTable({
  users,
  isLoading = false,
  onRoleChange,
  onEdit,
  onDelete,
  onView,
}: StaffTableProps) {
  const [selectedRole, setSelectedRole] = useState("all");

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    onRoleChange?.(role);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage barangay health workers and administrators
          </CardDescription>
        </div>
        <Select value={selectedRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="user">Health Worker</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {users.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No staff members found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Barangay</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleColor = roleColors[user.role];
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${roleColor.bg} ${roleColor.text}`}
                          variant="outline"
                        >
                          {roleColor.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {user.assigned_barangay}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView?.(user.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(user.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete?.(user.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
