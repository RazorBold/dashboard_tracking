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
import { devicePositions } from './schema/device-positions';

// ─── Seed Script ─────────────────────────────────────
async function seed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgres://iot_admin:iot_secret@localhost:5432/iot_platform';
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('🌱 Starting seed...');
  console.log('⚠️  Clearing existing data...');

  // Clear in dependency order
  await db.delete(devicePositions);
  await db.delete(vehicles);
  await db.delete(drivers);
  await db.delete(geofences);
  await db.delete(devices);
  await db.delete(deviceGroups);
  await db.delete(users);
  await db.delete(organizations);

  // ─── 1. Organization ────────────────────────────────
  console.log('  📦 Creating organization...');
  const [org] = await db
    .insert(organizations)
    .values({
      name: 'PT Demo Transport',
      slug: 'demo-transport',
      plan: 'pro',
      maxDevices: '50',
      contactEmail: 'admin@demotransport.com',
      contactPhone: '08123456789',
      address: 'Jl. Sisingamangaraja, Jakarta Selatan',
    })
    .returning();

  // ─── 2. Users ───────────────────────────────────────
  console.log('  👤 Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  await db.insert(users).values({
    name: 'Chandra Maulana',
    email: 'admin@demo.com',
    passwordHash,
    role: 'admin',
    organizationId: org.id,
  });

  const operatorHash = await bcrypt.hash('operator123', 12);
  await db.insert(users).values({
    name: 'Operator Demo',
    email: 'operator@demo.com',
    passwordHash: operatorHash,
    role: 'operator',
    organizationId: org.id,
  });

  // ─── 3. Device Groups ───────────────────────────────
  console.log('  📂 Creating device groups...');
  const [jakartaGroup] = await db
    .insert(deviceGroups)
    .values({
      name: 'Fleet Jakarta',
      description: 'Kendaraan area DKI Jakarta',
      organizationId: org.id,
    })
    .returning();

  const [jatimGroup] = await db
    .insert(deviceGroups)
    .values({
      name: 'Fleet Jawa Timur',
      description: 'Kendaraan area Jawa Timur',
      organizationId: org.id,
    })
    .returning();

  // ─── 4. Devices ─────────────────────────────────────
  console.log('  📡 Creating devices...');
  const now = new Date();

  const insertedDevices = await db
    .insert(devices)
    .values([
      {
        name: 'Vario 160 – CM',
        imei: '352503095920796',
        model: 'GT06N',
        status: 'online',
        organizationId: org.id,
        groupId: jakartaGroup.id,
        activatedAt: new Date('2022-11-13T18:56:46Z'),
        subscriptionExpiry: new Date('2032-11-14T00:00:00Z'),
        expiresAt: new Date('2032-11-14T00:00:00Z'),
        lastOnline: now,
      },
      {
        name: 'Avanza B-1234-ABC',
        imei: '861234567890123',
        model: 'GT06N',
        status: 'online',
        organizationId: org.id,
        groupId: jakartaGroup.id,
        activatedAt: new Date('2023-05-20T10:00:00Z'),
        subscriptionExpiry: new Date('2033-05-20T00:00:00Z'),
        expiresAt: new Date('2033-05-20T00:00:00Z'),
        lastOnline: now,
      },
      {
        name: 'Truck Box B-5678-DEF',
        imei: '869876543210987',
        model: 'TK119',
        status: 'offline',
        organizationId: org.id,
        groupId: jakartaGroup.id,
        activatedAt: new Date('2024-01-10T08:00:00Z'),
        subscriptionExpiry: new Date('2034-01-10T00:00:00Z'),
        expiresAt: new Date('2034-01-10T00:00:00Z'),
        lastOnline: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3h ago
      },
      {
        name: 'Innova B-9012-GHI',
        imei: '864567890123456',
        model: 'GT06N',
        status: 'online',
        organizationId: org.id,
        groupId: jakartaGroup.id,
        activatedAt: new Date('2023-08-01T00:00:00Z'),
        subscriptionExpiry: new Date('2033-08-01T00:00:00Z'),
        expiresAt: new Date('2033-08-01T00:00:00Z'),
        lastOnline: now,
      },
      {
        name: 'Bus Pariwisata W-1234',
        imei: '867890123456789',
        model: 'TK103B',
        status: 'online',
        organizationId: org.id,
        groupId: jatimGroup.id,
        activatedAt: new Date('2023-03-15T00:00:00Z'),
        subscriptionExpiry: new Date('2033-03-15T00:00:00Z'),
        expiresAt: new Date('2033-03-15T00:00:00Z'),
        lastOnline: now,
      },
      {
        name: 'Tronton W-5678-JKL',
        imei: '862345678901234',
        model: 'TK119',
        status: 'offline',
        organizationId: org.id,
        groupId: jatimGroup.id,
        activatedAt: new Date('2022-07-20T00:00:00Z'),
        subscriptionExpiry: new Date('2032-07-20T00:00:00Z'),
        expiresAt: new Date('2032-07-20T00:00:00Z'),
        lastOnline: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h ago
      },
      {
        name: 'Pick-up L-3344-MNO',
        imei: '865678901234567',
        model: 'GT06N',
        status: 'inactive',
        organizationId: org.id,
        groupId: jatimGroup.id,
        activatedAt: new Date('2021-11-01T00:00:00Z'),
        subscriptionExpiry: new Date('2031-11-01T00:00:00Z'),
        expiresAt: new Date('2031-11-01T00:00:00Z'),
      },
      {
        name: 'Motor Kurir Z-0099',
        imei: '868901234567890',
        model: 'GT06N',
        status: 'online',
        organizationId: org.id,
        groupId: jakartaGroup.id,
        activatedAt: new Date('2024-06-01T00:00:00Z'),
        subscriptionExpiry: new Date('2034-06-01T00:00:00Z'),
        expiresAt: new Date('2034-06-01T00:00:00Z'),
        lastOnline: now,
      },
    ])
    .returning();

  // ─── 5. Device Positions (GPS coordinates) ──────────
  console.log('  📍 Creating device positions...');

  // GPS coordinates of real locations in Indonesia
  const positionData = [
    // Vario 160 – CM → area Kebayoran Baru, Jakarta Selatan (moving ~40 km/h)
    { device: insertedDevices[0], lat: -6.2394, lng: 106.7983, speed: 42, heading: 90 },
    // Avanza → area Sudirman, Jakarta Pusat (parked)
    { device: insertedDevices[1], lat: -6.2088, lng: 106.8179, speed: 0, heading: 0 },
    // Truck Box → Pelabuhan Tanjung Priok (last seen 3h ago)
    { device: insertedDevices[2], lat: -6.1018, lng: 106.8817, speed: 0, heading: 0 },
    // Innova → Tol Jagorawi km 10 (moving)
    { device: insertedDevices[3], lat: -6.3270, lng: 106.8723, speed: 95, heading: 130 },
    // Bus Pariwisata → Surabaya, Jl. Pemuda
    { device: insertedDevices[4], lat: -7.2575, lng: 112.7521, speed: 28, heading: 270 },
    // Tronton → Pelabuhan Tanjung Perak, Surabaya (parked 8h ago)
    { device: insertedDevices[5], lat: -7.1977, lng: 112.7309, speed: 0, heading: 0 },
    // Pick-up → Malang (inactive, old position)
    { device: insertedDevices[6], lat: -7.9666, lng: 112.6326, speed: 0, heading: 0 },
    // Motor Kurir → Gojek area Tangerang Selatan (moving fast)
    { device: insertedDevices[7], lat: -6.2896, lng: 106.7172, speed: 65, heading: 45 },
  ];

  for (const p of positionData) {
    const ts = new Date(now.getTime() - Math.floor(Math.random() * 5 * 60 * 1000)); // within last 5min
    await db.insert(devicePositions).values({
      deviceId: p.device.id,
      latitude: p.lat,
      longitude: p.lng,
      speed: p.speed,
      heading: p.heading,
      satellites: 8 + Math.floor(Math.random() * 6),
      gsmSignal: 70 + Math.floor(Math.random() * 30),
      batteryVoltage: 12 + Math.random() * 0.5,
      accStatus: p.speed > 0 ? 1 : 0,
      timestamp: ts,
    });
  }

  // ─── 6. Vehicles ────────────────────────────────────
  console.log('  🚗 Creating vehicles...');
  await db.insert(vehicles).values([
    {
      plateNo: 'R 6076 IJ',
      type: 'motorcycle',
      make: 'Honda',
      model: 'Vario 160',
      maxSpeed: 120,
      deviceId: insertedDevices[0].id,
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
      deviceId: insertedDevices[1].id,
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
      deviceId: insertedDevices[2].id,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'expiring_soon',
      insuranceExpiry: new Date('2026-06-01T00:00:00Z'),
      accumulatedMileage: 128450,
      ownerName: 'PT Demo Transport',
      ownerPhone: '08123456789',
    },
    {
      plateNo: 'B 9012 GHI',
      type: 'car',
      make: 'Toyota',
      model: 'Innova',
      maxSpeed: 160,
      deviceId: insertedDevices[3].id,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'active',
      insuranceExpiry: new Date('2028-01-01T00:00:00Z'),
      accumulatedMileage: 33100,
      ownerName: 'Dewi Rahayu',
      ownerPhone: '085678901234',
    },
    {
      plateNo: 'W 1234 JKL',
      type: 'bus',
      make: 'Mercedes-Benz',
      model: 'OF 1723',
      maxSpeed: 100,
      deviceId: insertedDevices[4].id,
      organizationId: org.id,
      status: 'active',
      insuranceStatus: 'active',
      insuranceExpiry: new Date('2027-09-15T00:00:00Z'),
      accumulatedMileage: 256800,
      ownerName: 'PT Demo Transport',
      ownerPhone: '08123456789',
    },
  ]);

  // ─── 7. Drivers ─────────────────────────────────────
  console.log('  🧑‍✈️ Creating drivers...');
  await db.insert(drivers).values([
    {
      driverNo: 'DDN1044796',
      name: 'Chandra Maulana',
      phone: '082321376118',
      licenseNo: 'SIM-A-123456',
      licenseStatus: 'Active',
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
      registerPlace: 'Surabaya',
      registerDate: new Date('2022-06-20T00:00:00Z'),
      licenseExpiry: new Date('2027-06-20T00:00:00Z'),
      licenseStatus: 'Active',
      status: 'active',
      organizationId: org.id,
      fleetName: 'Fleet Jawa Timur',
    },
  ]);

  // ─── 8. Geofences ───────────────────────────────────
  console.log('  🗺️ Creating geofences...');
  await db.insert(geofences).values([
    {
      name: 'Kantor Pusat',
      type: 'circle',
      geometry: { center: { lat: -6.2394, lng: 106.7983 }, radius: 200 },
      organizationId: org.id,
      description: 'Area kantor PT Demo Transport, Kebayoran Baru',
    },
    {
      name: 'Depot Surabaya',
      type: 'circle',
      geometry: { center: { lat: -7.1977, lng: 112.7309 }, radius: 500 },
      organizationId: org.id,
      description: 'Area depot Surabaya dekat Tanjung Perak',
    },
  ]);

  console.log('\n✅ Seed complete!');
  console.log(`
  📊 Summary:
  ├── 1 Organization : PT Demo Transport
  ├── 2 Users        : admin@demo.com / admin123  |  operator@demo.com / operator123
  ├── 2 Device Groups: Fleet Jakarta, Fleet Jawa Timur
  ├── 8 Devices      : 5 online, 2 offline, 1 inactive
  ├── 8 Positions    : Jakarta (4), Surabaya (2), Tangerang (1), Malang (1)
  ├── 5 Vehicles
  ├── 3 Drivers
  └── 2 Geofences
  `);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
