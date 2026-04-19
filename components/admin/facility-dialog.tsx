"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { AlertCircle } from "lucide-react";

interface Facility {
  id?: string;
  name: string;
  barangay: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  capacity?: number;
}

interface FacilityDialogProps {
  facility?: Facility | null;
  onSave: () => void;
  onClose: () => void;
}

export default function FacilityDialog({ facility, onSave, onClose }: FacilityDialogProps) {
  const [name, setName] = useState(facility?.name || "");
  const [barangay, setBarangay] = useState(facility?.barangay || "");
  const [latitude, setLatitude] = useState(facility?.latitude.toString() || "");
  const [longitude, setLongitude] = useState(facility?.longitude.toString() || "");
  const [phone, setPhone] = useState(facility?.phone || "");
  const [email, setEmail] = useState(facility?.email || "");
  const [capacity, setCapacity] = useState(facility?.capacity?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [barangays, setBarangays] = useState<string[]>([]);

  const isEditing = !!facility?.id;

  useEffect(() => {
    const loadBarangays = async () => {
      try {
        const response = await fetch("/api/admin/barangays");
        if (!response.ok) return;
        const payload = await response.json();
        setBarangays(payload.data || []);
      } catch (loadError) {
        console.error("Failed to load barangays", loadError);
      }
    };

    loadBarangays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !barangay || !latitude || !longitude) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const body = {
        name,
        barangay,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone || null,
        email: email || null,
        capacity: capacity ? parseInt(capacity) : null,
      };

      const response = isEditing
        ? await fetch(`/api/admin/facilities/${facility.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/facilities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save facility");
      }

      onSave();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setGeoError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setGeoError("");
        },
        () => {
          setGeoError("Failed to get location. Please enter coordinates manually.");
        }
      );
    } else {
      setGeoError("Geolocation is not supported. Please enter coordinates manually.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Facility" : "Add New Facility"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update facility details" : "Create a new health facility"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Facility Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Health Center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay *</Label>
            <Select value={barangay} onValueChange={setBarangay}>
              <SelectTrigger id="barangay">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned" disabled>
                  Select barangay
                </SelectItem>
                {barangays.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 10.2206"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 123.9047"
                />
              </div>
            </div>
            {geoError && (
              <div className="text-sm text-orange-600 mt-2">{geoError}</div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              className="mt-2 w-full"
            >
              📍 Use Current Location
            </Button>
          </div>

          {/* Contact Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +63-2-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., health@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Bed Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
