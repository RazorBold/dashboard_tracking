# 📋 IoT Dashboard Tracking Platform — Implementation Plan (PRD)

> Dokumen ini berisi rencana pengembangan fitur-fitur platform IoT Tracking,
> disusun bertahap berdasarkan prioritas dan dependensi antar modul.
> Setiap fase memiliki GitHub Issue tersendiri yang harus dibuat sebelum development dimulai.

---

## 🏛️ Arsitektur Referensi

Berdasarkan analisis referensi web **Tracksolid Pro**, platform ini memiliki **5 modul utama**:

| Menu Utama | Sub Menu | Deskripsi |
|------------|----------|-----------|
| **Monitor** | Objects, Alerts, Tracks, Multi-track | Live monitoring & tracking kendaraan |
| **Report** | Overview, My Report, Auto Report, Task Center | Laporan & analitik |
| **Device** | Device List | Manajemen perangkat GPS/IoT |
| **Fleet** | Dashboard, Driver, Vehicle, Check-in, Route Plan | Manajemen armada |
| **Video** | — | Live video dari DVR (opsional, fase akhir) |

---

## 📐 Fase Development

### ═══════════════════════════════════════════
### FASE 1: Authentication & Core Layout
### ═══════════════════════════════════════════

> **Prioritas: 🔴 CRITICAL**
> Fondasi yang harus selesai sebelum fitur lain bisa dikerjakan.

---

#### 📌 Issue #3 — Database Schema & Drizzle ORM Setup
**Branch:** `feature/database-schema`

**Deskripsi:**
Setup database schema dasar menggunakan Drizzle ORM + PostgreSQL 16.

**Tasks:**
- [ ] Buat schema `users` (id, email, password_hash, name, role, avatar, created_at, updated_at)
- [ ] Buat schema `sessions` / refresh_tokens (id, user_id, token, expires_at)
- [ ] Buat schema `organizations` / tenants (id, name, slug, plan, created_at)
- [ ] Buat schema `devices` (id, name, imei, model, org_id, status, activated_at, expires_at)
- [ ] Buat schema `vehicles` (id, plate_no, type, max_speed, device_id, org_id, status, insurance_status)
- [ ] Buat schema `drivers` (id, driver_no, name, license_no, phone, org_id, status, license_expiry)
- [ ] Buat relasi antar tabel
- [ ] Setup Drizzle config (drizzle.config.ts)
- [ ] Buat seed data demo
- [ ] Test `db:push` dan `db:seed`

**Acceptance Criteria:**
- Semua tabel bisa di-push ke PostgreSQL tanpa error
- Seed data berhasil dijalankan
- Drizzle Studio bisa membuka dan menampilkan data

---

#### 📌 Issue #4 — Backend Auth API (Login, Register, JWT)
**Branch:** `feature/auth-api`
**Depends on:** Issue #3

**Deskripsi:**
Implementasi REST API untuk authentication dengan JWT (access + refresh token).

**Tasks:**
- [ ] Setup Express.js server dengan middleware (cors, helmet, compression, morgan, cookie-parser)
- [ ] Buat endpoint `POST /api/auth/login` — login dengan email & password
- [ ] Buat endpoint `POST /api/auth/register` — registrasi user baru
- [ ] Buat endpoint `POST /api/auth/refresh` — refresh access token
- [ ] Buat endpoint `POST /api/auth/logout` — invalidate refresh token
- [ ] Buat endpoint `GET /api/auth/me` — get current user profile
- [ ] Implement JWT access token (15 menit) + refresh token (7 hari, httpOnly cookie)
- [ ] Implement password hashing dengan bcryptjs
- [ ] Buat auth middleware (verifyToken, requireRole)
- [ ] Input validation dengan Zod
- [ ] Error handling middleware
- [ ] Setup Pino logger
- [ ] Buat Swagger/OpenAPI documentation untuk auth endpoints

**Acceptance Criteria:**
- Login berhasil mengembalikan access token + set httpOnly cookie
- Protected route menolak request tanpa token valid
- Refresh token bisa memperpanjang access token
- Swagger UI bisa diakses di `/api/docs`

---

#### 📌 Issue #5 — Login Page UI (Admin Web)
**Branch:** `feature/login-ui`
**Depends on:** Issue #4

**Deskripsi:**
Halaman login untuk admin panel, mengacu pada referensi Tracksolid Pro.

**Layout Referensi:**
- Split screen: kiri = ilustrasi/branding (gradient biru), kanan = form login
- Logo di atas form
- Input: Account (email) + Password
- Checkbox "Remember me" + link "Forgot password?"
- Tombol Login (full-width, biru)
- Language selector (dropdown kanan atas)

**Tasks:**
- [ ] Setup React Router DOM (routes: /login, /dashboard, /404)
- [ ] Setup Zustand auth store (user, token, isAuthenticated, login, logout)
- [ ] Setup Axios instance dengan interceptor (auto-attach token, auto-refresh)
- [ ] Buat halaman Login dengan layout split-screen
- [ ] Kiri: gradient biru + ilustrasi tracking (3D map pin + kendaraan)
- [ ] Kanan: form login (email, password, remember me, forgot password)
- [ ] Implement form validation dengan React Hook Form + Zod
- [ ] Implement login flow (call API → store token → redirect ke dashboard)
- [ ] Handle error states (invalid credentials, server error)
- [ ] Loading state pada tombol login
- [ ] Responsive design (mobile: form saja, desktop: split screen)
- [ ] Protected route wrapper (redirect ke /login jika belum auth)
- [ ] Auto-redirect ke /dashboard jika sudah login

**Acceptance Criteria:**
- User bisa login dan ter-redirect ke dashboard
- Form menampilkan error jika credentials salah
- Refresh halaman tetap login (persist token)
- Mobile responsive

---

#### 📌 Issue #6 — App Shell & Navigation Layout
**Branch:** `feature/app-shell`
**Depends on:** Issue #5

**Deskripsi:**
Layout utama aplikasi setelah login: top navbar + sidebar kiri + main content area.

**Layout Referensi:**
- **Top Navbar:** Logo | Monitor | Report | Device | Video | Fleet | [notifications] [user avatar + dropdown]
- **Left Sidebar (per menu):**
  - Monitor: Objects, Alerts, Tracks, Multi-track
  - Report: Overview, My Report, Auto Report, Task Center
  - Fleet: Dashboard, Driver, Vehicle, Check-in, Route Planning
- **Main Content:** Area utama yang berubah sesuai menu

**Tasks:**
- [ ] Buat TopNavbar component (logo, menu items, notification bell, user dropdown)
- [ ] Buat LeftSidebar component (icon + label, active state, collapsible)
- [ ] Buat MainLayout wrapper (navbar + sidebar + outlet)
- [ ] Setup nested routing per modul (monitor/*, report/*, fleet/*, device/*)
- [ ] User dropdown: profile, settings, logout
- [ ] Notification badge (jumlah alert unread)
- [ ] Sidebar auto-switch berdasarkan top menu aktif
- [ ] Responsive: mobile = hamburger menu + drawer sidebar
- [ ] Breadcrumb navigation

**Acceptance Criteria:**
- Navigasi antar modul lancar tanpa full page reload
- Sidebar berubah otomatis sesuai top menu
- Mobile responsive dengan hamburger menu
- Logout menghapus session dan redirect ke login

---

### ═══════════════════════════════════════════
### FASE 2: Monitor — Live Tracking & Objects
### ═══════════════════════════════════════════

> **Prioritas: 🟠 HIGH**
> Fitur utama platform — monitoring real-time kendaraan di peta.

---

#### 📌 Issue #7 — Device & Vehicle CRUD API
**Branch:** `feature/device-vehicle-api`
**Depends on:** Issue #3

**Deskripsi:**
REST API untuk manajemen devices dan vehicles.

**Tasks:**
- [ ] CRUD endpoints untuk devices:
  - `GET /api/devices` — list semua device (dengan pagination, search, filter)
  - `GET /api/devices/:id` — detail device
  - `POST /api/devices` — tambah device (import by IMEI)
  - `PUT /api/devices/:id` — update device
  - `DELETE /api/devices/:id` — hapus device
- [ ] CRUD endpoints untuk vehicles:
  - `GET /api/vehicles` — list semua vehicle
  - `GET /api/vehicles/:id` — detail vehicle
  - `POST /api/vehicles` — tambah vehicle
  - `PUT /api/vehicles/:id` — update vehicle (bind device, set max speed)
  - `DELETE /api/vehicles/:id` — hapus vehicle
- [ ] Bind/unbind device ke vehicle
- [ ] Device groups (CRUD + assign device ke group)
- [ ] Export data (CSV/Excel)
- [ ] Swagger docs

---

#### 📌 Issue #8 — MQTT Integration & Real-time Data
**Branch:** `feature/mqtt-realtime`
**Depends on:** Issue #7

**Deskripsi:**
Integrasi MQTT broker untuk menerima data GPS real-time dari perangkat IoT.

**Tasks:**
- [ ] Setup MQTT client di backend (connect ke Mosquitto)
- [ ] Subscribe ke topic device: `device/{imei}/position`
- [ ] Parse incoming GPS data (lat, lng, speed, heading, altitude, satellites, timestamp)
- [ ] Simpan posisi terbaru ke Redis (cache) + PostgreSQL (history)
- [ ] Buat schema `device_positions` (id, device_id, lat, lng, speed, heading, altitude, timestamp)
- [ ] WebSocket endpoint untuk push update ke frontend: `GET /api/ws/tracking`
- [ ] Kirim posisi terbaru semua device milik user via WebSocket
- [ ] Endpoint `GET /api/devices/:id/position` — posisi terbaru dari Redis
- [ ] Endpoint `GET /api/devices/:id/positions?from=&to=` — history posisi

---

#### 📌 Issue #9 — Monitor: Objects Panel (Device List + Map)
**Branch:** `feature/monitor-objects`
**Depends on:** Issue #6, #8

**Deskripsi:**
Halaman utama Monitor → Objects: panel kiri daftar device + peta di kanan.

**Layout Referensi:**
- **Kiri:** Search bar (by name/IMEI), "Add group" button, filter (All/Alert/Favorite/Offline), device list per group
- **Device card:** Icon status (merah=offline, hijau=online), nama, last update time, action icons (favorite, edit, driver assign, show on map)
- **Kanan:** Peta full (Leaflet/OpenStreetMap), address search bar, map type dropdown (Default/Satellite)
- **Map controls:** zoom, fullscreen, layer toggle, geolocation
- **Klik device:** Tampilkan marker di peta + info popup

**Tasks:**
- [ ] Integrasi Leaflet.js + OpenStreetMap tiles
- [ ] Buat DeviceListPanel component (search, filter, group, device cards)
- [ ] Buat MapView component (full map, markers, popups)
- [ ] Real-time marker update via WebSocket/MQTT
- [ ] Device card: klik → zoom peta ke lokasi device
- [ ] Device card: icon status (online/offline/alert)
- [ ] Device card: action menu (move to group, live, device command, common address)
- [ ] Map marker dengan label nama device
- [ ] Auto-refresh interval selector (8s, 14s, 25s, dll)
- [ ] Address search on map
- [ ] Collapsible left panel (toggle arrow)

---

#### 📌 Issue #10 — Device Detail Sidebar (Right Panel)
**Branch:** `feature/device-detail-sidebar`
**Depends on:** Issue #9

**Deskripsi:**
Panel detail kanan yang muncul saat klik device di peta/list.

**Layout Referensi:**
- **Header:** Device name, IMEI, close button
- **Status badge:** "Parked (ACC: OFF)" / "Moving" + duration
- **Address:** Alamat lengkap dari reverse geocoding
- **Coordinates:** Lat/Lng dengan toggle DMS/Decimal
- **Device info:** GNSS type, visible satellites, cellular signal, last online, last fix
- **Today's Activity:** Mileage, battery voltage
- **Vehicle info:** Owner name, phone, make, model, license plate, VIN, SN, accumulated mileage
- **Bottom tabs:** Live | Tracks | Device | Command | Configure | Share
- **Dashboard setting** button

**Tasks:**
- [ ] Buat DeviceDetailSidebar component (slide from right)
- [ ] Reverse geocoding API integration (Nominatim/OpenStreetMap)
- [ ] Display device status, address, coordinates, device info
- [ ] Display today's activity stats
- [ ] Display linked vehicle info
- [ ] Bottom tab navigation (Live, Tracks, Device, Command, Configure, Share)
- [ ] Unit switching toggle (DMS ↔ Decimal coordinates)
- [ ] Responsive overlay pada mobile

---

### ═══════════════════════════════════════════
### FASE 3: Monitor — Alerts & Tracks
### ═══════════════════════════════════════════

> **Prioritas: 🟡 MEDIUM-HIGH**
> Alert system dan history tracking.

---

#### 📌 Issue #11 — Alerts System API & Real-time
**Branch:** `feature/alerts-api`
**Depends on:** Issue #8

**Deskripsi:**
Backend untuk alert system — deteksi event dan notifikasi.

**Tasks:**
- [ ] Buat schema `alerts` (id, device_id, type, severity, message, location, read, created_at)
- [ ] Alert types: ACC ON/OFF, Vibration, Overspeed, Enter/Exit Geo-fence, Collision, Sharp Turn, Sudden Acceleration/Deceleration
- [ ] Alert detection engine (process incoming MQTT data → trigger alerts)
- [ ] Geo-fence schema + CRUD (polygon/circle zones)
- [ ] Speed limit alert berdasarkan vehicle max_speed setting
- [ ] Push alert ke frontend via WebSocket
- [ ] CRUD endpoints:
  - `GET /api/alerts` — list alerts (filter by device, type, date range, read status)
  - `PUT /api/alerts/:id/read` — mark as read
  - `PUT /api/alerts/read-all` — mark all as read
  - `GET /api/alerts/count` — unread count (untuk badge)

---

#### 📌 Issue #12 — Monitor: Alerts Page UI
**Branch:** `feature/alerts-ui`
**Depends on:** Issue #11, #9

**Deskripsi:**
Halaman Monitor → Alerts.

**Layout Referensi:**
- **Kiri panel:**
  - Device selector dropdown
  - Alert type filter (Driving behavior, Overspeed, ACC, Geo-fence, dll)
  - Date range picker (Start Date – End Date)
  - Search button
  - "All read" button
  - Alert cards list (scrollable): type label, device name, timestamp, mark-read icon
- **Tengah:** Peta dengan marker lokasi alert
- **Kanan:** Alert detail panel (Device, IMEI, Alert type, Address, Time, Event pictures, Processed by, Driver info)

**Tasks:**
- [ ] Buat AlertsPage layout (3-column: filter, map, detail)
- [ ] Alert type filter dropdown dengan checkboxes (Driving behavior group, individual alerts)
- [ ] Date range picker component
- [ ] Alert card list (infinite scroll / pagination)
- [ ] Klik alert → zoom peta ke lokasi + show detail panel
- [ ] Alert detail panel (semua info)
- [ ] Mark as read (individual + all)
- [ ] Real-time new alert notification (push to top of list)
- [ ] Alert count badge di sidebar navigation

---

#### 📌 Issue #13 — Tracks: History Playback
**Branch:** `feature/tracks-history`
**Depends on:** Issue #8, #9

**Deskripsi:**
Halaman Monitor → Tracks: playback history perjalanan device.

**Layout Referensi:**
- **Kiri panel:**
  - Device selector (dropdown IMEI/name)
  - Mode selector (All)
  - Date range picker + preset (Last 3 days, Today, Yesterday, Last 7 days)
  - "put away" toggle
  - Search + Reset buttons
  - Trip summary: total distance (km), avg speed (km/h), Details button
  - Trip list: start time + address, "Total X trips" expandable, end time + address
- **Map area:**
  - Track polyline (cyan/blue colored path)
  - Start marker (green) + End marker (red)
  - Speed/Replay controls (play, speed slider)
  - Parking time filter
  - Alert type overlay filter
  - Display options: track, fix points, driving behavior, geofence, POI
- **Playback bar:** Play/pause, speed control, timestamp display

**Tasks:**
- [ ] Buat TracksPage layout (left panel + map)
- [ ] Device selector + date range picker
- [ ] Fetch position history dari API
- [ ] Render track polyline di peta (warna berdasarkan kecepatan)
- [ ] Start/End markers dengan info popup
- [ ] Trip list dengan expand/collapse
- [ ] Playback controls (play, pause, speed 1x/2x/4x/8x)
- [ ] Animate marker bergerak sepanjang track saat playback
- [ ] Display options toggles (track, fix, behavior, geofence, POI)
- [ ] Parking time filter
- [ ] Trip details panel

---

#### 📌 Issue #14 — Multi-Track View
**Branch:** `feature/multi-track`
**Depends on:** Issue #13

**Deskripsi:**
Halaman Monitor → Multi-track: tampilkan track dari multiple device sekaligus.

**Tasks:**
- [ ] Multi-device selector (checkboxes)
- [ ] Positioning accuracy filter
- [ ] Tampilkan multiple track polylines di peta (warna berbeda per device)
- [ ] Display track checkbox per device
- [ ] Speed label per track
- [ ] Combined trip summary

---

### ═══════════════════════════════════════════
### FASE 4: Device Management
### ═══════════════════════════════════════════

> **Prioritas: 🟡 MEDIUM**

---

#### 📌 Issue #15 — Device Management Page UI
**Branch:** `feature/device-management-ui`
**Depends on:** Issue #7, #6

**Deskripsi:**
Halaman Device: manajemen perangkat GPS/IoT.

**Layout Referensi:**
- **Search bar:** IMEI (multi-line), Device name, Device model dropdown, Search + Reset buttons, Advanced Search
- **Action buttons row 1:** Import device, Renew, Sell/move, Update user expiration
- **Action buttons row 2:** Send Command, Set working mode, Batch settings, Bind device
- **Action buttons row 3:** Disable, Enable, Batch operations, Set group, Allow activation
- **Export buttons:** Export, Export all
- **Table columns:** No, Device name, IMEI (link), Device Model, Activated time, Subscription Expiration, Expiration Date(U), Actions (edit, assign, settings, logs)

**Tasks:**
- [ ] Buat DeviceManagementPage
- [ ] Search/filter form (IMEI, name, model)
- [ ] Data table dengan React Table (sortable, selectable rows)
- [ ] Pagination
- [ ] Action buttons toolbar
- [ ] Import device modal (single + bulk by IMEI)
- [ ] Edit device modal
- [ ] Bind device to user/vehicle modal
- [ ] Send command modal
- [ ] Set working mode modal
- [ ] Export to CSV/Excel
- [ ] Batch operations (select multiple → action)

---

### ═══════════════════════════════════════════
### FASE 5: Fleet Management
### ═══════════════════════════════════════════

> **Prioritas: 🟡 MEDIUM**

---

#### 📌 Issue #16 — Fleet Dashboard UI
**Branch:** `feature/fleet-dashboard`
**Depends on:** Issue #6, #7, #11

**Deskripsi:**
Halaman Fleet → Dashboard: overview statistik armada.

**Layout Referensi:**
- **Top cards:** Total Drivers + Total Vehicles (biru), Driven distance (km), Total driving time (H), Total Fuel Consumption (L)
- **Reminder panel:** Driving license reminder, Insurance reminder (donut chart: Normal/Expired/Expiring soon)
- **Motion Statistics:** Bar chart (exercise/idling/parked duration per device)
- **Alarm type ratio:** Donut chart (ACC OFF, ACC ON, Exit geo-fence, Enter geo-fence, Vibration alert, Overspeed)
- **Alarm statistics ranking:** Table (Vehicle tab, Alarm tab) — Ranking, Number plate, Alert Times
- **Fuel consumption statistics:** Bar chart (Total Fuel, Fuel/100km)
- **Mileage statistics:** Bar chart (Total mileage, Average daily mileage)
- **Time filter:** This week / Last 7 days per card

**Tasks:**
- [ ] Buat FleetDashboardPage
- [ ] Summary cards (drivers, vehicles, distance, driving time, fuel)
- [ ] API endpoints untuk dashboard statistics
- [ ] Reminder donut chart (Recharts)
- [ ] Motion statistics bar chart
- [ ] Alarm type ratio donut chart
- [ ] Alarm statistics ranking table
- [ ] Fuel consumption chart
- [ ] Mileage statistics chart
- [ ] Time range filter per widget (This week / Last 7 days / Last 30 days)

---

#### 📌 Issue #17 — Driver Management Page
**Branch:** `feature/driver-management`
**Depends on:** Issue #6

**Deskripsi:**
Halaman Fleet → Driver: CRUD data driver.

**Layout Referensi:**
- **Search:** Driver No./Name, Register Place, License Expired checkbox
- **Action buttons:** Add, Batch operations, Fleet Management, Associated Fleet
- **Table columns:** No, Driver No, Driver Name, License No, RFID Card No, KC208, Register Place, Register Date, Expired Date, License Status, Driving license reminder, Status, Fleet Name, Action (Edit, Delete)
- **Export** button

**Tasks:**
- [ ] Driver CRUD API endpoints
- [ ] Buat DriverManagementPage
- [ ] Search/filter form
- [ ] Data table with sorting & pagination
- [ ] Add/Edit driver modal (form with validation)
- [ ] Delete driver confirmation
- [ ] Fleet assignment
- [ ] License expiry reminder logic
- [ ] Export to CSV

---

#### 📌 Issue #18 — Vehicle Management Page
**Branch:** `feature/vehicle-management`
**Depends on:** Issue #7, #6

**Deskripsi:**
Halaman Fleet → Vehicle: CRUD data kendaraan.

**Layout Referensi:**
- **Search:** IMEI, Vehicle No, Status dropdown, Include sub-account checkbox
- **Action buttons:** Add, Batch operations
- **Table columns:** No, Vehicle No, Vehicle Type, Max Speed, Device Name, Device IMEI, Status, Insurance status, Insurance reminder, Action (Edit, Delete)
- **Export** button

**Tasks:**
- [ ] Buat VehicleManagementPage
- [ ] Search/filter form
- [ ] Data table
- [ ] Add/Edit vehicle modal
- [ ] Bind device to vehicle
- [ ] Insurance reminder logic
- [ ] Export

---

### ═══════════════════════════════════════════
### FASE 6: Report System
### ═══════════════════════════════════════════

> **Prioritas: 🟢 MEDIUM-LOW**

---

#### 📌 Issue #19 — Report Overview Page
**Branch:** `feature/report-overview`
**Depends on:** Issue #7, #6

**Deskripsi:**
Halaman Report → Overview: ringkasan status semua device.

**Layout Referensi:**
- **Tabs:** Device Overview | Motion Overview | Alert Overview
- **Device Overview:**
  - Circular progress charts: Total, Activated, Inactivated, Expired, Expiring soon
  - Device table: No, Device Name, Address, Mileage, GPS Positioning, GSM, Speed, State, Group, Position Time

**Tasks:**
- [ ] Buat ReportOverviewPage
- [ ] Tab navigation (Device, Motion, Alert)
- [ ] Circular progress/donut charts (Recharts)
- [ ] Device summary table
- [ ] API endpoints untuk report overview data

---

#### 📌 Issue #20 — My Report & Auto Report
**Branch:** `feature/reports-custom`
**Depends on:** Issue #19

**Deskripsi:**
Halaman Report → My Report (custom report) dan Auto Report (scheduled report).

**Layout Referensi My Report:**
- Add button, report list (sidebar)
- Form: Report Name, Report Type (Daily activity/Track Details), Account, Device, Time range, Position type

**Layout Referensi Auto Report:**
- Add button, report list
- Form: Report Name, Report Type, Account, Device, Frequency (Monthly/Weekly/Every day), Execution Time, Report Query Conditions, Email Address

**Tasks:**
- [ ] Report templates schema (id, name, type, filters, user_id)
- [ ] Auto report schema (id, name, type, frequency, schedule, email, user_id)
- [ ] CRUD API untuk My Report
- [ ] CRUD API untuk Auto Report
- [ ] Report generator engine (query data → format → output)
- [ ] My Report page UI (list + create form)
- [ ] Auto Report page UI (list + create form with schedule config)
- [ ] Email sending for auto reports (optional, bisa pakai placeholder dulu)

---

### ═══════════════════════════════════════════
### FASE 7: Advanced Features
### ═══════════════════════════════════════════

> **Prioritas: 🔵 LOW**
> Fitur tambahan untuk melengkapi platform.

---

#### 📌 Issue #21 — Geo-fence Management
**Branch:** `feature/geofence`
**Depends on:** Issue #9, #11

**Tasks:**
- [ ] Geo-fence CRUD (polygon/circle drawing on map)
- [ ] Assign geo-fence ke device/vehicle
- [ ] Enter/Exit geo-fence alert integration
- [ ] Visual geo-fence overlay on map

---

#### 📌 Issue #22 — Check-in & Route Planning
**Branch:** `feature/checkin-route`
**Depends on:** Issue #9

**Tasks:**
- [ ] Check-in points management (CRUD)
- [ ] Route planning (waypoints, optimasi)
- [ ] Route compliance monitoring

---

#### 📌 Issue #23 — Device Commands & Configuration
**Branch:** `feature/device-commands`
**Depends on:** Issue #8

**Tasks:**
- [ ] Send command ke device via MQTT
- [ ] Common commands: restart, set interval, set APN
- [ ] Device configuration panel
- [ ] Command history/log

---

#### 📌 Issue #24 — Tenant Portal (Multi-tenant)
**Branch:** `feature/tenant-portal`
**Depends on:** Fase 1-5

**Tasks:**
- [ ] Tenant-specific login & dashboard
- [ ] Data isolation per tenant
- [ ] Tenant admin can only see their own devices/vehicles/drivers
- [ ] Sub-account management

---

#### 📌 Issue #25 — User Settings & Profile
**Branch:** `feature/user-settings`
**Depends on:** Issue #5

**Tasks:**
- [ ] Profile page (edit name, avatar, password)
- [ ] Notification preferences
- [ ] Language selector (i18n)
- [ ] Timezone settings
- [ ] Dashboard customization (widget layout)

---

## 📅 Timeline Estimasi

| Fase | Fitur | Issues | Estimasi |
|------|-------|--------|----------|
| **1** | Auth & Layout | #3, #4, #5, #6 | 1–2 minggu |
| **2** | Monitor: Objects & Map | #7, #8, #9, #10 | 2–3 minggu |
| **3** | Alerts & Tracks | #11, #12, #13, #14 | 2–3 minggu |
| **4** | Device Management | #15 | 1 minggu |
| **5** | Fleet Management | #16, #17, #18 | 1–2 minggu |
| **6** | Report System | #19, #20 | 1–2 minggu |
| **7** | Advanced Features | #21–#25 | 2–3 minggu |
| | **Total** | **23 issues** | **~10–16 minggu** |

---

## 🔀 Git Workflow per Issue

```
1. gh issue create             → Buat GitHub Issue dengan detail tasks
2. git checkout main           → Pastikan di branch main terbaru
3. git pull origin main        → Pull latest
4. git checkout -b feature/X   → Buat feature branch
5. ... develop & commit ...    → Commit dengan pesan: "feat: ... (ref #N)"
6. git push origin feature/X   → Push feature branch
7. gh pr create --base main    → Buat Pull Request
8. Review & merge              → Merge ke main
9. Sync staging & production   → Setelah testing
```

### Commit Convention:
```
feat: add login page UI (#5)
fix: resolve token refresh race condition (#4)
chore: update database schema (#3)
docs: update API documentation (#7)
style: improve login page responsive layout (#5)
refactor: extract auth middleware (#4)
test: add unit tests for auth service (#4)
```

---

## ✅ Langkah Selanjutnya

Mulai dari **Fase 1** → **Issue #3 (Database Schema)**, kemudian lanjut ke Issue #4, #5, #6 secara berurutan.

> **Catatan:** Issue number yang tertulis di dokumen ini (#3 dst) adalah **rencana**. Nomor asli akan ditentukan saat issue dibuat di GitHub.
