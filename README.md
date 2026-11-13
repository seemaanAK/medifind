# MediFind – Medicine Availability & Healthcare Assistance Finder

MediFind is a responsive, trustworthy, privacy-conscious healthcare assistance application designed specifically for users in India. It enables users to discover nearby licensed pharmacies, search verified pharmacopoeia drug information, organize private prescription-based dosage schedules, track household first-aid kit supplies and expiry dates, and access region-aware emergency medical helplines.

---

## 1. Key Features & India-First Design

### 🇮🇳 India Regional Configuration
- **Currency:** Indian Rupee (`₹`, `INR`) with Indian numbering format (e.g. `1,00,000`).
- **Locale & Time Zone:** `en-IN` formatting with `Asia/Kolkata` (IST) timestamp rendering.
- **Phone Number Validation:** Strict 10-digit Indian mobile validation (`+91`, starting with digits `6–9`) using `libphonenumber-js`.
- **PIN Code Validation:** Standard 6-digit Indian Postal Index Number validation.
- **Geographic Coverage:** Full registry of 28 Indian States and 8 Union Territories.

### 📍 Transparent Pharmacy Discovery & Geolocation
- **Explicit Geolocation Consent:** Browser location is requested strictly following explicit user action ("Use My Current Location") with an upfront privacy explanation. Coordinates are kept in memory and never stored or tracked.
- **Manual Location Alternative:** Search by Indian State, City, Area, or 6-digit PIN code without requiring GPS.
- **Accurate Distance Calculation:** Uses the Haversine formula to compute straight-line distance, explicitly labeled as `(straight-line)`.
- **Honest Stock Status:** Distinguishes verified stock from unverified availability (`Stock Confirmed`, `Out of Stock`, `Availability not verified`). Never fabricates live inventory.

### 🚨 Emergency Assistance 24/7
- **Nationwide Emergency Response (112):** Prominently highlights India's single emergency number (ERSS - Police, Fire, Ambulance) under the Ministry of Home Affairs.
- **Regional & Specialized Helplines:** State-filtered directory for 108 (Ambulance), 102 (Janani Shishu Suraksha maternal ambulance), 104 (Health advice helpline), and 1066 / 011-26589391 (National Poison Information Centre at AIIMS New Delhi).
- **Public & Immediate:** Fully accessible without authentication; click-to-call `tel:` links trigger device calling interfaces.

### 💊 Verified Medicine Information Monograph
- **Official Pharmacopoeia Sources:** Information sourced from Central Drugs Standard Control Organisation (CDSCO), National List of Essential Medicines (NLEM), and Indian Pharmacopoeia (IP).
- **Comprehensive Details:** Active ingredients, approved indications, precautions, black-box warnings, and manufacturer-recommended storage conditions.
- **Safety Safeguard:** No AI-generated diagnoses or prescribing; clear clinical disclaimers reminding users to consult registered physicians.

### 📅 Prescription-Based Medicine Schedule
- **Strictly User-Entered:** Reminders and dosage times are entered strictly from a doctor's written prescription instructions. Ambiguous instructions are never guessed or reinterpreted.
- **Daily Administration Tracker:** Today's doses view with IST timing and taken/skipped tracking.
- **Device Reminders:** Browser Notification permission controls.
- **Private Data Isolation:** User-owned records protected by Row Level Security (RLS) in the database.

### 🩹 First-Aid Kit Inventory & Guidance
- **Inventory Tracking:** Record supplies, quantities, units, and expiry dates.
- **Expiry Monitoring:** Visual indicators for expired items, supplies expiring within 30 days, and replenishment alerts.
- **Verified Educational Content:** Non-diagnostic, step-by-step guidance from the Indian Red Cross Society and Ministry of Health (minor cuts, superficial thermal burns, heat exhaustion vs. heatstroke).

---

## 2. Technology Stack

- **Frontend:** React 19, Vite, TypeScript, React Router 7, Tailwind CSS, Lucide React icons.
- **Backend API:** Node.js, Express, TypeScript, Zod schema validation, CORS, security headers.
- **Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) policies and Supabase Auth.
- **Optional AI Integration:** `@google/genai` on the server for source-grounded, non-diagnostic educational summaries.
- **Testing:** Vitest, testing unit utilities, API integration routes, and cross-user data isolation.

---

## 3. Project Structure

```text
Medifind/
├── public/                 # Static assets
├── src/
│   ├── app/                # Router and layout configuration
│   ├── components/
│   │   ├── layout/         # SiteHeader, SiteNavigation, Footer, AppLayout
│   │   ├── shared/         # ProtectedRoute, MedicalDisclaimer
│   │   └── feedback/       # LoadingState, ErrorState, EmptyState, ConfirmDialog
│   ├── hooks/              # useAuth, useLocationPermission
│   ├── lib/                # supabase.ts, api-client.ts, config.ts
│   ├── pages/              # Home, Medicines, MedicineDetail, MedicineInformation,
│   │                       # Emergency, FirstAid, Schedule, Profile, auth/*
│   ├── schemas/            # Zod validation schemas
│   ├── types/              # TypeScript interface definitions
│   └── utils/              # phone.ts, currency.ts, dates.ts, location.ts
├── server/
│   └── src/
│       ├── app.ts          # Express application setup
│       ├── server.ts       # Server listener
│       ├── config/         # Server configuration
│       ├── middleware/     # requireAuth, errorHandler
│       ├── routes/         # health, medicines, pharmacies, emergency, firstAid, schedules, profile, ai
│       ├── services/       # gemini.service.ts
│       └── data/           # store.ts, seedData.ts
├── supabase/
│   ├── migrations/         # 20261114000000_initial_schema.sql (PostgreSQL schema with RLS)
│   └── seed.sql            # Authentic emergency contacts, CDSCO monographs, pharmacies
├── tests/
│   ├── unit/               # Phone, PIN, Haversine, currency, date tests
│   ├── integration/        # Express API endpoints integration tests
│   └── security/           # Cross-user isolation and authorization tests
├── .env.example            # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following variables:

```dotenv
# Frontend (Exposed via Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_API_BASE_URL=http://localhost:3001

# Backend (Private, Server-Only)
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional Google Gemini AI (Server-side plain-language summarization)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Security
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> **Note:** MediFind operates gracefully in local development even if Supabase or Gemini credentials are not yet configured:
> - The backend uses an in-memory repository preloaded with authentic seed data.
> - The frontend provides an interactive demonstration mode for testing authenticated features (prescriptions, first-aid inventory, profile).

---

## 5. Database Setup & Supabase Migrations

To apply the production database schema and seed data to your Supabase PostgreSQL instance:

1. Using the Supabase CLI:
   ```bash
   supabase db reset
   ```
   Or execute the migrations directly in the Supabase SQL Editor:
   - Run `supabase/migrations/20261114000000_initial_schema.sql`
   - Run `supabase/seed.sql`

### Database Security & Row Level Security (RLS)
- **Profiles:** Users can only view and update their own profile (`(select auth.uid()) = id`).
- **Prescription Schedules:** Users can only select, insert, update, and delete their own schedules (`(select auth.uid()) = user_id`).
- **Dose Events:** Verified against both the user's ID and ownership of the referenced schedule.
- **First-Aid Items:** Users can only view and edit their own inventory.
- **Emergency Contacts & Medicines:** Public read-only access for verified records; mutations restricted to administrative service roles.
- **Admin Audit Log:** Denies all direct access to ordinary authenticated and anonymous users.

---

## 6. How to Run

### Install Dependencies
```bash
npm install
```

### Start the Backend API Server
In one terminal:
```bash
npm run server
```
The server will start on `http://localhost:3001`.
Health check: `http://localhost:3001/api/health`

### Start the Frontend Application
In a second terminal:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Testing & Build Verification

### Run the Automated Test Suite
```bash
npm run test
```
Runs 30 unit, integration, and security tests covering:
- Indian mobile phone and PIN code validation
- INR currency formatting and Haversine distance calculations
- Expiry date status logic
- API endpoints (`/api/health`, `/api/medicines`, `/api/pharmacies/search`, `/api/emergency-contacts`, `/api/first-aid/articles`)
- Cross-user data isolation (preventing User A from reading or modifying User B's schedules or inventory)

### Run Linting
```bash
npm run lint
```

### Run Production Build
```bash
npm run build
```
Type-checks all TypeScript files (`tsc -b`) and generates production bundles in `dist/`.

---

## 8. Healthcare Safety Notice

> **Medical Disclaimer:** MediFind is an informational and organizational tool. It does not provide medical diagnoses, prescribe treatments, calculate personalized dosages, or replace consultation with a qualified doctor or pharmacist.
> 
> **Emergency Warning:** In case of suspected heart attack, severe trauma, breathing difficulty, poisoning, or any other life-threatening medical emergency, call **112** immediately. Do not delay emergency medical care while using this application.
