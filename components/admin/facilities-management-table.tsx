"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import FacilityDialog from "@/components/admin/facility-dialog";
import DeleteFacilityDialog from "@/components/admin/delete-facility-dialog";

interface Facility {
  id: string;
  name: string;
  barangay: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  capacity?: number;
  operating_hours?: Record<string, string>;
  created_at: string;
}

export function FacilitiesManagementTable() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("");
  const [total, setTotal] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);

  useEffect(() => {
    fetchFacilities();
  }, [page, search, barangay]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        barangay,
      });

      const response = await fetch(`/api/admin/facilities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFacilities(data.facilities);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilitySaved = () => {
    fetchFacilities();
    setShowAddDialog(false);
    setEditingFacility(null);
  };

  const handleFacilityDeleted = () => {
    fetchFacilities();
    setDeletingFacility(null);
  };

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Health Facilities</h2>
          <p className="text-muted-foreground">Manage health centers and clinics</p>
        </div>
        <Button onClick={() => { setEditingFacility(null); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Facility
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Search facilities..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 min-w-[200px]"
            />
            <Select value={barangay} onValueChange={(b) => { setBarangay(b); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Barangays</SelectItem>
                <SelectItem value="Barangay 1">Barangay 1</SelectItem>
                <SelectItem value="Barangay 2">Barangay 2</SelectItem>
                <SelectItem value="Barangay 3">Barangay 3</SelectItem>
                <SelectItem value="Barangay 4">Barangay 4</SelectItem>
                <SelectItem value="Barangay 5">Barangay 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Facilities Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">Loading facilities...</div>
          ) : facilities.length === 0 ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              No facilities found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Barangay</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell>{facility.barangay}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{facility.phone || "—"}</TableCell>
                      <TableCell>{facility.capacity || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingFacility(facility); setShowAddDialog(true); }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingFacility(facility)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Facility Dialog */}
      {showAddDialog && (
        <FacilityDialog
          facility={editingFacility}
          onSave={handleFacilitySaved}
          onClose={() => {
            setShowAddDialog(false);
            setEditingFacility(null);
          }}
        />
      )}

      {/* Delete Facility Dialog */}
      {deletingFacility && (
        <DeleteFacilityDialog
          facility={deletingFacility}
          onDelete={handleFacilityDeleted}
          onClose={() => setDeletingFacility(null)}
        />
      )}
    </div>
  );
}
