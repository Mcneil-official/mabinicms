"use client";

import { UsersManagementTable } from "@/components/admin/users-management-table";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <UsersManagementTable />
    </div>
  );
}
