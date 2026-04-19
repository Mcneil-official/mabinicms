"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, Copy, Check } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import {
  updateStaffUserAction,
  changeStaffUserPasswordAction,
} from "@/lib/actions/users";
import type { User } from "@/lib/types";

interface EditStaffDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  barangays: string[];
}

export function EditStaffDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
  barangays,
}: EditStaffDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    role: user?.role || "user",
    assigned_barangay: user?.assigned_barangay || "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.assigned_barangay) {
      setError("Barangay is required");
      return;
    }

    setIsLoading(true);

    const result = await updateStaffUserAction({
      id: user.id,
      username:
        formData.username !== user.username ? formData.username : undefined,
      role: formData.role !== user.role ? (formData.role as any) : undefined,
      assigned_barangay:
        formData.assigned_barangay !== user.assigned_barangay
          ? formData.assigned_barangay
          : undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to update user");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onSuccess?.();
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const result = await changeStaffUserPasswordAction({
      id: user.id,
      password: newPassword,
    });

    if (!result.success) {
      setError(result.error || "Failed to change password");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setNewPassword("");
    setConfirmPassword("");
    onSuccess?.();
  };

  const handleCopyPassword = () => {
    // In production, generate a temp password and send via email
    const tempPassword = Math.random().toString(36).slice(-12);
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update user details and permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {error && (
                <div className="flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Created
                    </p>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Last Updated
                    </p>
                    <p className="font-medium">{formatDate(user.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={isLoading}
                  minLength={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="edit-role" disabled={isLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Health Worker (BHW)</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">System Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-barangay">Assigned Barangay</Label>
                <Select
                  value={formData.assigned_barangay}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_barangay: value })
                  }
                >
                  <SelectTrigger id="edit-barangay" disabled={isLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <div className="flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6 text-sm text-blue-700 dark:text-blue-200">
                  <p>
                    Enter a new password for <strong>{user.username}</strong>.
                    They will need to use this password to log in.
                  </p>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
