# MabiniCare - Barangay Health Dashboard

A comprehensive, GIS-enabled community health information system built with Next.js and Supabase.

## Features

- **User Management** - Create/Edit/Delete user accounts
- **Facilities** - Manage health centers and schedules
- **Submissions** - Process health concerns
- **YAKAP** - Handle PhilHealth Konsulta applications
- **Health Workers Dashboard** - GIS-enabled health metrics visualization
- **Barangay GIS Map** - Interactive vaccination coverage mapping

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Maps**: Leaflet.js / react-leaflet
- **Language**: TypeScript

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup

Open Supabase SQL Editor and run `SUPABASE_SETUP.sql`:

```bash
# This creates:
# - 8 tables (users, residents, health_facilities, etc.)
# - Baseline healthcare data
# - All required indexes
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

### Tables

| Table                    | Description            |
| ------------------------ | ---------------------- |
| `users`                  | User accounts          |
| `residents`              | Resident registry      |
| `health_facilities`      | Health center info     |
| `facility_schedules`     | Service schedules      |
| `personnel_availability` | Personnel availability |
| `submissions`            | Health concerns        |
| `yakap_applications`     | Insurance applications |
| `activity_logs`          | Audit trail            |

### SQL Files

- `SUPABASE_SETUP.sql` - Complete database setup (copy-paste ready)
- `SUPABASE_SCHEMA.sql` - Detailed schema documentation
- `SQL_QUICK_REFERENCE.sql` - 50+ common queries

---

## Project Structure

```
app/
  dashboard/
    staff/             # User management (admin only)
    facilities/        # Health facilities
    submissions/       # Health concerns
    yakap/             # YAKAP applications
    health-workers/    # Health workers dashboard

components/
  dashboard/
    barangay-gis-map.tsx           # Leaflet map component
    barangay-stats-panel.tsx       # Stats side panel
    chart-components.tsx           # Recharts visualizations
    health-metrics-cards.tsx       # Metric cards
  yakap/
    yakap-form-step.tsx            # Multi-step YAKAP form

lib/
  actions/             # Server actions (CRUD operations)
    users.ts
    facilities.ts
    submissions.ts
    yakap.ts
  queries/             # Database queries
    residents.ts
    facilities.ts
    submissions.ts
    yakap.ts
    health-indicators.ts
  services/
    yakap.service.ts   # YAKAP business logic

migrations/            # Database migrations
```

---

## Services

### User Management

- Create/Edit/Delete user accounts
- Filter by role/barangay
- View user list

### Facilities Management

- Add/Update/Delete health centers
- Manage service schedules
- Track personnel availability

### Submissions

- Submit health concerns
- Approve/Return submissions
- Track status

### YAKAP (PhilHealth Konsulta)

3-step form for insurance applications:

1. Personal Information
2. Health Declaration
3. Document Upload

---

## GIS Map Feature

Interactive barangay-level map with:

- **Color-coded coverage**:
  - Red (0-40%): Critical
  - Orange (40-60%): Low
  - Blue (60-80%): Moderate
  - Green (80-100%): Good

- **Interactive elements**:
  - Hover tooltips
  - Click for detailed stats
  - Side panel with health metrics

---

## Health Workers Dashboard

Real-time health metrics:

- Vaccination coverage by barangay
- Maternal health monitoring
- Senior citizen assistance tracking
- Pending health interventions
- Underserved area identification

---

## API Reference

### Server Actions

```typescript
// Staff
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/lib/actions/users";

// Facilities
import {
  createFacilityAction,
  updateFacilityAction,
  deleteFacilityAction,
} from "@/lib/actions/facilities";

// Submissions
import {
  createSubmissionAction,
  approveSubmissionAction,
} from "@/lib/actions/submissions";

// YAKAP
import {
  createYakapApplicationAction,
  approveYakapAction,
} from "@/lib/actions/yakap";
```

### Query Functions

```typescript
// Residents
import {
  getResidents,
  getResidentById,
  getResidentsByBarangay,
} from "@/lib/queries/residents";

// Facilities
import {
  getFacilities,
  getFacilityById,
  getFacilitySchedules,
} from "@/lib/queries/facilities";

// Health Indicators
import {
  getVaccinationCoverageByBarangay,
  getMaternalHealthStats,
} from "@/lib/queries/health-indicators";
```

---

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Self-hosted

```bash
npm run build
npm start
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)
- [Leaflet](https://leafletjs.com/)
