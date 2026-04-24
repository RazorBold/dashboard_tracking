import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { users } from './schema/users';
import { organizations } from './schema/organizations';
import { devices } from './schema/devices';
import { deviceGroups } from './schema/device-groups';
import { vehicles } from './schema/vehicles';
import { drivers } from './schema/drivers';
import { geofences } from './schema/geofences';

// ─── Seed Script ─────────────────────────────────────
async function seed() {
  const connectionString = process.env.DATABASE_URL || 'postgres://iot_admin:iot_secret@localhost:5432/iot_platform';
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('🌱 Starting seed...');

  // ─── 1. Create Organization ──────────────────────
  console.log('  📦 Creating organization...');
  const [org] = await db.insert(organizations).values({
    name: 'PT Demo Transport',
    slug: 'demo-transport',
    plan: 'pro',
    maxDevices: '50',
    contactEmail: 'admin@demotransport.com',
    contactPhone: '08123456789',
    address: 'Jl. Sisingamangaraja, Jakarta Selatan',
  }).returning();

  // ─── 2. Create Admin User ────────────────────────
  console.log('  👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const [adminUser] = await db.insert(users).values({
    name: 'Chandra Maulana',
    email: 'admin@demo.com',
    passwordHash,
    role: 'admin',
    organizationId: org.id,
  }).returning();

  // ─── 3. Create Operator User ─────────────────────
  console.log('  👤 Creating operator user...');
  const operatorHash = await bcrypt.hash('operator123', 12);
  await db.insert(users).values({
    name: 'Operator Demo',
    email: 'operator@demo.com',
    passwordHash: operatorHash,
    role: 'operator',
    organizationId: org.id,
  });

  // ─── 4. Create Device Group ──────────────────────
  console.log('  📂 Creating device group...');
  const [defaultGroup] = await db.insert(deviceGroups).values({
    name: 'Default group',
    description: 'Default device group',
    organizationId: org.id,
  }).returning();

  // ─── 5. Create Devices ───────────────────────────
  console.log('  📡 Creating devices...');
  const [device1] = await db.insert(devices).values([
    {
      name: 'Vario 160',
      imei: '352503095920796',
      model: 'GT06N',
      status: 'online',
      organizationId: org.id,
      groupId: defaultGroup.id,
      activatedAt: new Date('2022-11-13T18:56:46Z'),
      subscriptionExpiry: new Date('2032-11-14T00:00:00Z'),
      expiresAt: new Date('2032-11-14T00:00:00Z'),
      lastOnline: new Date(),
    },
    {
      name: 'Avanza Putih',
      imei: '861234567890123',
      model: 'GT06N',
      status: 'offline',
      organizationId: org.id,
      groupId: defaultGroup.id,
      activatedAt: new Date('2023-05-20T10:00:00Z'),
      subscriptionExpiry: new Date('2033-05-20T00:00:00Z'),
      expiresAt: new Date('2033-05-20T00:00:00Z'),
    },
    {
      name: 'Truck Box 01',
      imei: '869876543210987',
      model: 'TK119',
      status: 'offline',
      organizationId: org.id,
      groupId: defaultGroup.id,
      activatedAt: new Date('2024-01-10T08:00:00Z'),
      subscriptionExpiry: new Date('2034-01-10T00:00:00Z'),
      expiresAt: new Date('2034-01-10T00:00:00Z'),
    },
  ]).returning();

  // ─── 6. Create Vehicles ──────────────────────────
  console.log('  🚗 Creating vehicles...');
  await db.insert(vehicles).values([
    {
      plateNo: 'R 6076 IJ',
      type: 'motorcycle',
      make: 'Honda',
      model: 'Vario 160',
      maxSpeed: 120,
      deviceId: device1.id,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'none',
      accumulatedMileage: 71852,
      ownerName: 'Chandra Maulana',
      ownerPhone: '082321376118',
    },
    {
      plateNo: 'B 1234 ABC',
      type: 'car',
      make: 'Toyota',
      model: 'Avanza',
      maxSpeed: 150,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'active',
      insuranceExpiry: new Date('2027-06-15T00:00:00Z'),
      accumulatedMileage: 45230,
      ownerName: 'Budi Santoso',
      ownerPhone: '081234567890',
    },
    {
      plateNo: 'B 5678 DEF',
      type: 'truck',
      make: 'Mitsubishi',
      model: 'Colt Diesel',
      maxSpeed: 80,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'expiring_soon',
      insuranceExpiry: new Date('2026-06-01T00:00:00Z'),
      accumulatedMileage: 128450,
      ownerName: 'PT Demo Transport',
      ownerPhone: '08123456789',
    },
  ]);

  // ─── 7. Create Drivers ───────────────────────────
  console.log('  🧑‍✈️ Creating drivers...');
  await db.insert(drivers).values([
    {
      driverNo: 'DDN1044796',
      name: 'Chandra Maulana',
      phone: '082321376118',
      licenseNo: 'SIM-A-123456',
      licenseStatus: 'N/A',
      status: 'active',
      organizationId: org.id,
    },
    {
      driverNo: 'DDN1044797',
      name: 'Budi Santoso',
      phone: '081234567890',
      licenseNo: 'SIM-A-789012',
      registerPlace: 'Jakarta',
      registerDate: new Date('2023-01-15T00:00:00Z'),
      licenseExpiry: new Date('2028-01-15T00:00:00Z'),
      licenseStatus: 'Active',
      status: 'active',
      organizationId: org.id,
      fleetName: 'Fleet Jakarta',
    },
    {
      driverNo: 'DDN1044798',
      name: 'Ahmad Fauzi',
      phone: '087654321098',
      licenseNo: 'SIM-B2-345678',
      registerPlace: 'Bandung',
      registerDate: new Date('2022-06-20T00:00:00Z'),
      licenseExpiry: new Date('2027-06-20T00:00:00Z'),
      licenseStatus: 'Active',
      status: 'active',
      organizationId: org.id,
      fleetName: 'Fleet Jakarta',
    },
  ]);

  // ─── 8. Create Geofences ─────────────────────────
  console.log('  🗺️ Creating geofences...');
  await db.insert(geofences).values([
    {
      name: 'Kantor',
      type: 'circle',
      geometry: {
        center: { lat: -6.239437, lng: 106.798343 },
        radius: 200,
      },
      organizationId: org.id,
      description: 'Area kantor PT Demo Transport',
    },
    {
      name: 'Kontrakan',
      type: 'circle',
      geometry: {
        center: { lat: -6.245000, lng: 106.795000 },
        radius: 150,
      },
      organizationId: org.id,
      description: 'Area kontrakan / rumah',
    },
  ]);

  console.log('✅ Seed complete!');
  console.log(`
  📊 Summary:
  ├── 1 Organization: ${org.name}
  ├── 2 Users (admin@demo.com / admin123, operator@demo.com / operator123)
  ├── 1 Device Group: Default group
  ├── 3 Devices (Vario 160, Avanza Putih, Truck Box 01)
  ├── 3 Vehicles
  ├── 3 Drivers
  └── 2 Geofences (Kantor, Kontrakan)
  `);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
