# MabiniCare System Features

This document explains all the features of MabiniCare. It is divided into two main sections based on who uses them: **Staff** and **Health Workers**.

---

## Overview

The system has two types of users:

| User Type | Description |
|-----------|-------------|
| **Staff** | Office-based employees who manage the overall health system (admins, barangay admins) |
| **Health Workers** | Field-based employees who visit residents and record health data |

Each user type has their own dashboard with different features.

---

## Staff Features

Staff members log in at `/auth/login` and access the main dashboard.

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

### 10. Staff Management (Admin Only)
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
- **What it does**: Shows a quick overview of the worker's assignments
- **What you see**:
  - Your assigned barangay
  - Number of residents you serve
  - Coverage statistics (vaccination, maternal, senior care)
  - Map of health facilities in your area
  - Quick access to all features

### 2. My Assignments
- **What it does**: Shows your work summary
- **What you see**:
  - Total residents in your barangay
  - Number of vaccinations given
  - Maternal health records created
  - Senior care records created
  - Monthly activity summary

### 3. Residents
- **What it does**: Shows all residents in your barangay
- **What you can do**:
  - View list of all residents
  - Search by name
  - Filter by purok (village area) or age group
  - See contact information
  - Check PhilHealth numbers

### 4. Field Visits
- **What it does**: Shows your past home visits
- **What you see**:
  - List of all recorded visits
  - Type of visit (vaccination, maternal check, senior care)
  - Date of each visit
  - Status of each visit

### 5. Reports
- **What it does**: Shows your work statistics with charts
- **What you see**:
  - Summary numbers (total records, vaccinations, etc.)
  - Vaccination status pie chart
  - Service type breakdown
  - Monthly trend line chart

### 6. Announcements
- **What it does**: Create and manage announcements for workers
- **What you can do**:
  - Create new announcements
  - Add poster images
  - Select target barangays
  - Publish or save as draft
  - Edit or delete announcements

### 7. Medication Inventory
- **What it does**: Shows medicines available in your barangay
- **What you see**:
  - List of medicines allocated to your barangay
  - Current stock levels
  - Low stock alerts
  - Expiring medicine warnings

---

## Quick Comparison Table

| Feature | Staff | Health Worker |
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
| Staff management | ✅ (Admin) | ❌ |
| Barangay profiling | ✅ | ❌ |
| View assigned residents | ❌ | ✅ |
| Track field visits | ❌ | ✅ |
| View work reports | ❌ | ✅ |
| See assignment summary | ❌ | ✅ |

---

## How to Log In

| User Type | Login Page |
|-----------|------------|
| Staff / Admin | `/auth/login` |
| Health Worker | `/auth/workers` |

---

## Notes

- **Staff** members work in the office and manage the overall system
- **Health Workers** work in the field and record health data for residents
- Both user types can only see data for their assigned barangay (except admins who can see all)
- The system works offline for health workers using Progressive Web App (PWA) technology
