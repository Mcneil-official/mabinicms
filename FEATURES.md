# MabiniCare System Features

This document explains all the features of MabiniCare. It is divided into two main sections based on who uses them: **Barangay Health Staff** and **Health Workers**.

---

## Overview

The system has two types of users:

| User Type | Description |
|-----------|-------------|
| **Barangay Health Staff** | Office-based employees who manage the overall health system (admins, barangay health supervisors) |
| **Health Workers** | Field-based employees who visit residents and record health data |

Each user type has their own dashboard with different features.

---

## Feature Categories

### Barangay Health Staff / Admin

| Category | Includes |
|----------|----------|
| Dashboard | Overview metrics, YAKAP activity, recent activity |
| Operations | Users, announcements, appointments & facilities |
| Health Data | Health indicators, medications, barangay profiling |
| Resources | Audit logs |

### Health Workers

| Category | Includes |
|----------|----------|
| Dashboard | Daily overview, assigned barangay, coverage snapshot |
| Field Operations | Data entry, residents |
| Monitoring | Reports, announcements, medication inventory |
| Quick Access | QR scan in the header |

---

## Barangay Health Staff Features

Barangay health staff members log in at `/auth/login` and access the main dashboard.

### 1. Main Dashboard
- **What it does**: Shows a summary of all health activities
- **What you see**: 
  - Number of pending submissions
  - Number of approved/pending YAKAP applications
  - Interactive map showing vaccination coverage across all barangays
  - Recent YAKAP applications table

### 2. YAKAP Applications
- **What it does**: Manages PhilHealth Konsulta (free health checkup) applications
- **What you can do**:
  - View all submitted applications
  - Approve or return applications
  - Filter by status (pending, approved, returned)
  - Create new applications for residents

### 3. Submissions
- **What it does**: Handles health concerns or requests from residents
- **What you can do**:
  - View all submitted health concerns
  - Review and process submissions
  - Approve or return submissions with notes
  - Filter by status

### 4. Appointments
- **What it does**: Manages health facility bookings
- **What you can do**:
  - View all booked appointments at health centers
  - See appointment status (booked, completed, cancelled)
  - Filter by date or status
  - See appointment counts and statistics

### 5. Announcements
- **What it does**: Sends important news to health workers
- **What you can do**:
  - Read announcements from the system
  - See unread count
  - Mark announcements as read

### 6. Health Facilities
- **What it does**: Shows information about health centers
- **What you see**:
  - List of all health facilities in the area
  - Address, contact info, and operating hours
  - Services offered (general and specialized)
  - Whether the facility is YAKAP-accredited

### 7. Health Indicators
- **What it does**: Shows health statistics and trends
- **What you see**:
  - Charts showing vaccination rates
  - Maternal health statistics
  - Disease tracking data
  - Trends over time

### 8. Medications
- **What it does**: Tracks medicine supplies across all barangays
- **What you can do**:
  - View central inventory of medicines
  - See which medicines are running low
  - Check expiring medicines
  - Allocate medicines to different barangays
  - View distribution history

### 9. Pregnancy Profiling
- **What it does**: Tracks pregnant residents
- **What you can do**:
  - Search for female residents
  - Register pregnancy profiles
  - View existing pregnancy records
  - Track prenatal visits
  - Filter by barangay

### 10. User Management (Admin Only)
- **What it does**: Manages user accounts
- **What you can do**:
  - Create new staff accounts
  - Edit existing user information
  - Delete user accounts
  - Assign roles and barangays
  - Filter users by role

### 11. Barangay Profiling
- **What it does**: Stores information about each barangay
- **What you can do**:
  - Add new barangay profiles
  - Edit barangay information
  - View population and health data
  - Delete profiles

---

## Health Worker Features

Health workers log in at `/auth/workers` and access the worker dashboard.

### 1. Worker Dashboard
- **What it does**: Shows a quick overview of the worker's daily work
- **What you see**:
  - Your assigned barangay
  - Number of residents you serve
  - Coverage statistics (vaccination, maternal, senior care)
  - Quick access to all features

### 2. Residents
- **What it does**: Shows all residents in your barangay
- **What you see**:
  - View list of all residents
  - Search by name
  - Filter by purok (village area) or age group
  - See contact information
  - Check PhilHealth numbers

### 3. Reports
- **What it does**: Shows your work statistics in text-based summaries
- **What you see**:
  - Summary numbers (total records, vaccinations, etc.)
  - Text-based vaccination status list
  - Ranked service type list
  - Monthly trend text summaries

### 4. Announcements
- **What it does**: Create and manage announcements for workers
- **What you can do**:
  - Create new announcements
  - Add poster images
  - Select target barangays
  - Publish or save as draft
  - Edit or delete announcements

### 5. Medication Inventory
- **What it does**: Shows medicines available in your barangay
- **What you see**:
  - List of medicines allocated to your barangay
  - Current stock levels
  - Low stock alerts
  - Expiring medicine warnings

---

## Quick Comparison Table

| Feature | Barangay Health Staff | Health Worker |
|---------|:-----:|:-------------:|
| View dashboard summary | ✅ | ✅ |
| Interactive health map | ✅ | ✅ |
| YAKAP applications | ✅ | ❌ |
| Review submissions | ✅ | ❌ |
| View appointments | ✅ | ❌ |
| Read announcements | ✅ | ❌ |
| Create announcements | ❌ | ✅ |
| View health facilities | ✅ | ✅ |
| Health indicators & analytics | ✅ | ❌ |
| Manage medications (all barangays) | ✅ | ❌ |
| View medications (own barangay) | ❌ | ✅ |
| Pregnancy profiling | ✅ | ❌ |
| User management | ✅ (Admin) | ❌ |
| Barangay profiling | ✅ | ❌ |
| View assigned residents | ❌ | ✅ |
| View work reports | ❌ | ✅ |

---

## How to Log In

| User Type | Login Page |
|-----------|------------|
| Barangay Health Staff / Admin | `/auth/login` |
| Health Worker | `/auth/workers` |

---

## Notes

- **Staff** members work in the office and manage the overall system
- **Health Workers** work in the field and record health data for residents
- Both user types can only see data for their assigned barangay (except admins who can see all)
- The system works offline for health workers using Progressive Web App (PWA) technology
