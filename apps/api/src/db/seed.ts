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
import { alerts } from './schema/alerts';

type AlertType = 'acc_on' | 'acc_off' | 'vibration' | 'overspeed' | 'enter_geofence' | 'exit_geofence' | 'collision' | 'sharp_turn_left' | 'sharp_turn_right' | 'sudden_acceleration' | 'sudden_deceleration' | 'low_battery' | 'sos';
type AlertSeverity = 'info' | 'warning' | 'critical';

type FleetKey = 'jkt' | 'jtm' | 'bdg' | 'bli' | 'sumut';
type DeviceStatus = 'online' | 'offline' | 'inactive' | 'expired';
type VehicleType = 'car' | 'motorcycle' | 'truck' | 'bus' | 'van' | 'other';

interface DeviceSeed {
  name: string;
  imei: string;
  model: string;
  status: DeviceStatus;
  fleet: FleetKey;
  vehicleType: VehicleType;
  plateNo: string;
  make: string;
  vehicleModel: string;
  ownerName: string;
  hoursOffline?: number;
}

const FLEET_CENTERS: Record<FleetKey, { lat: number; lng: number }> = {
  jkt: { lat: -6.2088, lng: 106.8456 },
  jtm: { lat: -7.2575, lng: 112.7521 },
  bdg: { lat: -6.9175, lng: 107.6191 },
  bli: { lat: -8.4095, lng: 115.1889 },
  sumut: { lat: 3.5952, lng: 98.6722 },
};

const DEVICE_SEEDS: DeviceSeed[] = [
  // ─── Fleet Jakarta (12) ─────────────────────────────────────────
  { name: 'Vario 160 – CM',         imei: '352503095920796', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'motorcycle', plateNo: 'R 6076 IJ',    make: 'Honda',      vehicleModel: 'Vario 160',     ownerName: 'Chandra Maulana' },
  { name: 'Avanza B-1234-ABC',      imei: '861234567890123', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 1234 ABC',   make: 'Toyota',     vehicleModel: 'Avanza',        ownerName: 'Budi Santoso' },
  { name: 'Truck Box B-5678-DEF',   imei: '869876543210987', model: 'TK119',  status: 'offline',  fleet: 'jkt', vehicleType: 'truck',      plateNo: 'B 5678 DEF',   make: 'Mitsubishi', vehicleModel: 'Colt Diesel',   ownerName: 'PT Demo Transport', hoursOffline: 3 },
  { name: 'Innova B-9012-GHI',      imei: '864567890123456', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 9012 GHI',   make: 'Toyota',     vehicleModel: 'Innova',        ownerName: 'Dewi Rahayu' },
  { name: 'Xpander B-3456-JKL',     imei: '861100200300001', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 3456 JKL',   make: 'Mitsubishi', vehicleModel: 'Xpander',       ownerName: 'Andi Pratama' },
  { name: 'Fortuner B-7890-MNO',    imei: '861100200300002', model: 'GV300',  status: 'online',   fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 7890 MNO',   make: 'Toyota',     vehicleModel: 'Fortuner',      ownerName: 'Hendra Wijaya' },
  { name: 'Hilux B-2233-PQR',       imei: '861100200300003', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 2233 PQR',   make: 'Toyota',     vehicleModel: 'Hilux',         ownerName: 'PT Logistik Nusantara' },
  { name: 'Hino Dutro B-4455-STU',  imei: '861100200300004', model: 'TK119',  status: 'online',   fleet: 'jkt', vehicleType: 'truck',      plateNo: 'B 4455 STU',   make: 'Hino',       vehicleModel: 'Dutro',         ownerName: 'PT Demo Transport' },
  { name: 'Pajero Sport B-6677-VWX',imei: '861100200300005', model: 'GV300',  status: 'inactive', fleet: 'jkt', vehicleType: 'car',        plateNo: 'B 6677 VWX',   make: 'Mitsubishi', vehicleModel: 'Pajero Sport',  ownerName: 'Maya Sari' },
  { name: 'NMAX B-8899-YZA',        imei: '861100200300006', model: 'GT06N',  status: 'expired',  fleet: 'jkt', vehicleType: 'motorcycle', plateNo: 'B 8899 YZA',   make: 'Yamaha',     vehicleModel: 'NMAX',          ownerName: 'Eko Saputra' },
  { name: 'Granmax B-1100-BCD',     imei: '861100200300007', model: 'GT06N',  status: 'online',   fleet: 'jkt', vehicleType: 'van',        plateNo: 'B 1100 BCD',   make: 'Daihatsu',   vehicleModel: 'Granmax',       ownerName: 'PT Logistik Nusantara' },
  { name: 'Beat B-3344-EFG',        imei: '861100200300008', model: 'GT06N',  status: 'offline',  fleet: 'jkt', vehicleType: 'motorcycle', plateNo: 'B 3344 EFG',   make: 'Honda',      vehicleModel: 'Beat',          ownerName: 'Rina Kurniawati', hoursOffline: 12 },

  // ─── Fleet Jawa Timur (10) ──────────────────────────────────────
  { name: 'Bus Pariwisata W-1234',   imei: '867890123456789', model: 'TK103B', status: 'online',  fleet: 'jtm', vehicleType: 'bus',        plateNo: 'W 1234 JKL',   make: 'Mercedes-Benz', vehicleModel: 'OF 1723',    ownerName: 'PT Demo Transport' },
  { name: 'Tronton W-5678-JKL',      imei: '862345678901234', model: 'TK119',  status: 'offline', fleet: 'jtm', vehicleType: 'truck',      plateNo: 'W 5678 JKL',   make: 'Volvo',         vehicleModel: 'FM',         ownerName: 'PT Logistik Jatim', hoursOffline: 8 },
  { name: 'Pick-up L-3344-MNO',      imei: '865678901234567', model: 'GT06N',  status: 'inactive',fleet: 'jtm', vehicleType: 'van',        plateNo: 'L 3344 MNO',   make: 'Daihatsu',      vehicleModel: 'Gran Max',   ownerName: 'Ahmad Fauzi' },
  { name: 'Avanza N-1122-ABC SUB',   imei: '862200300400001', model: 'GT06N',  status: 'online',  fleet: 'jtm', vehicleType: 'car',        plateNo: 'N 1122 ABC',   make: 'Toyota',        vehicleModel: 'Avanza',     ownerName: 'Joko Prasetyo' },
  { name: 'Innova N-3344-DEF SUB',   imei: '862200300400002', model: 'GT06N',  status: 'online',  fleet: 'jtm', vehicleType: 'car',        plateNo: 'N 3344 DEF',   make: 'Toyota',        vehicleModel: 'Innova',     ownerName: 'Siti Aminah' },
  { name: 'Xpander N-5566-GHI MLG',  imei: '862200300400003', model: 'GT06N',  status: 'online',  fleet: 'jtm', vehicleType: 'car',        plateNo: 'N 5566 GHI',   make: 'Mitsubishi',    vehicleModel: 'Xpander',    ownerName: 'Bambang Suryadi' },
  { name: 'Hilux W-7788-JKL SDA',    imei: '862200300400004', model: 'GT06N',  status: 'offline', fleet: 'jtm', vehicleType: 'car',        plateNo: 'W 7788 JKL',   make: 'Toyota',        vehicleModel: 'Hilux',      ownerName: 'PT Sidoarjo Trans', hoursOffline: 5 },
  { name: 'Bus Hino N-9900-MNO',     imei: '862200300400005', model: 'TK103B', status: 'online',  fleet: 'jtm', vehicleType: 'bus',        plateNo: 'N 9900 MNO',   make: 'Hino',          vehicleModel: 'RN285',      ownerName: 'PT Demo Transport' },
  { name: 'Colt Diesel N-2233-PQR',  imei: '862200300400006', model: 'TK119',  status: 'online',  fleet: 'jtm', vehicleType: 'truck',      plateNo: 'N 2233 PQR',   make: 'Mitsubishi',    vehicleModel: 'Colt Diesel',ownerName: 'PT Logistik Jatim' },
  { name: 'Fortuner W-4455-STU',     imei: '862200300400007', model: 'GV300',  status: 'online',  fleet: 'jtm', vehicleType: 'car',        plateNo: 'W 4455 STU',   make: 'Toyota',        vehicleModel: 'Fortuner',   ownerName: 'Dian Permata' },

  // ─── Fleet Bandung (8) ──────────────────────────────────────────
  { name: 'Avanza D-1234-ABC BDG',   imei: '863300400500001', model: 'GT06N',  status: 'online',  fleet: 'bdg', vehicleType: 'car',        plateNo: 'D 1234 ABC',   make: 'Toyota',        vehicleModel: 'Avanza',     ownerName: 'Asep Sunandar' },
  { name: 'Innova D-5678-DEF Dago',  imei: '863300400500002', model: 'GT06N',  status: 'online',  fleet: 'bdg', vehicleType: 'car',        plateNo: 'D 5678 DEF',   make: 'Toyota',        vehicleModel: 'Innova',     ownerName: 'Neneng Hasanah' },
  { name: 'Hilux D-9012-GHI Pst',    imei: '863300400500003', model: 'GT06N',  status: 'online',  fleet: 'bdg', vehicleType: 'car',        plateNo: 'D 9012 GHI',   make: 'Toyota',        vehicleModel: 'Hilux',      ownerName: 'PT Bandung Trans' },
  { name: 'Vario D-3456-JKL Chmps',  imei: '863300400500004', model: 'GT06N',  status: 'online',  fleet: 'bdg', vehicleType: 'motorcycle', plateNo: 'D 3456 JKL',   make: 'Honda',         vehicleModel: 'Vario 160',  ownerName: 'Iqbal Maulana' },
  { name: 'Xenia D-7890-MNO',        imei: '863300400500005', model: 'GT06N',  status: 'online',  fleet: 'bdg', vehicleType: 'car',        plateNo: 'D 7890 MNO',   make: 'Daihatsu',      vehicleModel: 'Xenia',      ownerName: 'Rian Hidayat' },
  { name: 'Fuso D-2233-PQR',         imei: '863300400500006', model: 'TK119',  status: 'online',  fleet: 'bdg', vehicleType: 'truck',      plateNo: 'D 2233 PQR',   make: 'Mitsubishi',    vehicleModel: 'Fuso',       ownerName: 'PT Cargo Bandung' },
  { name: 'Xpander D-4455-STU',      imei: '863300400500007', model: 'GT06N',  status: 'offline', fleet: 'bdg', vehicleType: 'car',        plateNo: 'D 4455 STU',   make: 'Mitsubishi',    vehicleModel: 'Xpander',    ownerName: 'Sri Wahyuni', hoursOffline: 4 },
  { name: 'NMAX D-6677-VWX',         imei: '863300400500008', model: 'GT06N',  status: 'offline', fleet: 'bdg', vehicleType: 'motorcycle', plateNo: 'D 6677 VWX',   make: 'Yamaha',        vehicleModel: 'NMAX',       ownerName: 'Fajar Nugroho', hoursOffline: 16 },

  // ─── Fleet Bali (5) ─────────────────────────────────────────────
  { name: 'Innova DK-1234-ABC DPS',  imei: '864400500600001', model: 'GT06N',  status: 'online',  fleet: 'bli', vehicleType: 'car',        plateNo: 'DK 1234 ABC',  make: 'Toyota',        vehicleModel: 'Innova',     ownerName: 'I Made Wirawan' },
  { name: 'Avanza DK-5678-DEF Kuta', imei: '864400500600002', model: 'GT06N',  status: 'online',  fleet: 'bli', vehicleType: 'car',        plateNo: 'DK 5678 DEF',  make: 'Toyota',        vehicleModel: 'Avanza',     ownerName: 'Ni Kadek Sari' },
  { name: 'Vario DK-9012-GHI Ubud',  imei: '864400500600003', model: 'GT06N',  status: 'online',  fleet: 'bli', vehicleType: 'motorcycle', plateNo: 'DK 9012 GHI',  make: 'Honda',         vehicleModel: 'Vario 160',  ownerName: 'I Wayan Adi' },
  { name: 'Hilux DK-3456-JKL Sanur', imei: '864400500600004', model: 'GT06N',  status: 'online',  fleet: 'bli', vehicleType: 'car',        plateNo: 'DK 3456 JKL',  make: 'Toyota',        vehicleModel: 'Hilux',      ownerName: 'PT Bali Logistik' },
  { name: 'Bus Pariwisata DK-7890',  imei: '864400500600005', model: 'TK103B', status: 'offline', fleet: 'bli', vehicleType: 'bus',        plateNo: 'DK 7890 MNO',  make: 'Hino',          vehicleModel: 'RN285',      ownerName: 'PT Bali Tours', hoursOffline: 6 },

  // ─── Fleet Sumatera Utara (5) ───────────────────────────────────
  { name: 'Avanza BK-1234-ABC MDN',  imei: '865500600700001', model: 'GT06N',  status: 'online',  fleet: 'sumut', vehicleType: 'car',      plateNo: 'BK 1234 ABC',  make: 'Toyota',        vehicleModel: 'Avanza',     ownerName: 'Marbun Siregar' },
  { name: 'Innova BK-5678-DEF Pln',  imei: '865500600700002', model: 'GT06N',  status: 'online',  fleet: 'sumut', vehicleType: 'car',      plateNo: 'BK 5678 DEF',  make: 'Toyota',        vehicleModel: 'Innova',     ownerName: 'Ratna Sari Dewi' },
  { name: 'Tronton BK-9012-GHI Bln', imei: '865500600700003', model: 'TK119',  status: 'online',  fleet: 'sumut', vehicleType: 'truck',    plateNo: 'BK 9012 GHI',  make: 'Volvo',         vehicleModel: 'FM',         ownerName: 'PT Sumut Cargo' },
  { name: 'Hilux BK-3456-JKL',       imei: '865500600700004', model: 'GT06N',  status: 'offline', fleet: 'sumut', vehicleType: 'car',      plateNo: 'BK 3456 JKL',  make: 'Toyota',        vehicleModel: 'Hilux',      ownerName: 'PT Logistik Medan', hoursOffline: 10 },
  { name: 'Pajero BK-7890-MNO',      imei: '865500600700005', model: 'GV300',  status: 'expired', fleet: 'sumut', vehicleType: 'car',      plateNo: 'BK 7890 MNO',  make: 'Mitsubishi',    vehicleModel: 'Pajero Sport',ownerName: 'Surya Tanjung' },
];

const INSURANCE_MIX: Array<'active' | 'expiring_soon' | 'expired' | 'none'> = [
  'active','active','active','active','active','active',
  'expiring_soon','expiring_soon',
  'expired',
  'none','none',
];

function jitter(): number {
  return (Math.random() - 0.5) * 0.05; // ± 0.025 deg ≈ ± 2.7 km
}

async function seed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgres://iot_admin:iot_secret@localhost:5432/iot_platform';
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('🌱 Starting seed...');
  console.log('⚠️  Clearing existing data...');

  // Clear in dependency order
  await db.delete(alerts);
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
      maxDevices: '100',
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
  const [grpJkt] = await db.insert(deviceGroups).values({
    name: 'Fleet Jakarta', description: 'Kendaraan area DKI Jakarta', organizationId: org.id,
  }).returning();
  const [grpJtm] = await db.insert(deviceGroups).values({
    name: 'Fleet Jawa Timur', description: 'Kendaraan area Jawa Timur', organizationId: org.id,
  }).returning();
  const [grpBdg] = await db.insert(deviceGroups).values({
    name: 'Fleet Bandung', description: 'Kendaraan area Bandung & Jawa Barat', organizationId: org.id,
  }).returning();
  const [grpBli] = await db.insert(deviceGroups).values({
    name: 'Fleet Bali', description: 'Kendaraan area Bali', organizationId: org.id,
  }).returning();
  const [grpSum] = await db.insert(deviceGroups).values({
    name: 'Fleet Sumatera Utara', description: 'Kendaraan area Sumatera Utara', organizationId: org.id,
  }).returning();

  const groupIdByFleet: Record<FleetKey, string> = {
    jkt: grpJkt.id, jtm: grpJtm.id, bdg: grpBdg.id, bli: grpBli.id, sumut: grpSum.id,
  };

  // ─── 4. Devices ─────────────────────────────────────
  console.log(`  📡 Creating ${DEVICE_SEEDS.length} devices...`);
  const now = new Date();

  const insertedDevices = await db.insert(devices).values(
    DEVICE_SEEDS.map((s, i) => ({
      name: s.name,
      imei: s.imei,
      model: s.model,
      status: s.status,
      organizationId: org.id,
      groupId: groupIdByFleet[s.fleet],
      activatedAt: new Date(2022 + (i % 3), i % 12, 1 + (i % 27)),
      subscriptionExpiry: new Date(2032 + (i % 3), i % 12, 1 + (i % 27)),
      expiresAt: new Date(2032 + (i % 3), i % 12, 1 + (i % 27)),
      lastOnline:
        s.status === 'online' ? now :
        s.status === 'offline' ? new Date(now.getTime() - (s.hoursOffline ?? 6) * 60 * 60 * 1000) :
        s.status === 'inactive' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) :
        null, // expired
    })),
  ).returning();

  // ─── 5. Device Positions ────────────────────────────
  console.log(`  📍 Creating ${insertedDevices.length} device positions...`);
  for (let i = 0; i < insertedDevices.length; i++) {
    const seed = DEVICE_SEEDS[i];
    const dev = insertedDevices[i];
    const center = FLEET_CENTERS[seed.fleet];
    const isMoving = seed.status === 'online' && Math.random() > 0.3;
    const ts = new Date(now.getTime() - Math.floor(Math.random() * 5 * 60 * 1000));

    await db.insert(devicePositions).values({
      deviceId: dev.id,
      latitude: center.lat + jitter(),
      longitude: center.lng + jitter(),
      speed: isMoving ? Math.floor(Math.random() * 80) + 5 : 0,
      heading: Math.floor(Math.random() * 360),
      altitude: 10 + Math.floor(Math.random() * 200),
      satellites: 8 + Math.floor(Math.random() * 6),
      gsmSignal: 70 + Math.floor(Math.random() * 30),
      batteryVoltage: 12 + Math.random() * 0.5,
      accStatus: isMoving ? 1 : 0,
      mileage: Math.floor(Math.random() * 300000),
      timestamp: ts,
    });
  }

  // ─── 6. Vehicles (one per device) ───────────────────
  console.log(`  🚗 Creating ${DEVICE_SEEDS.length} vehicles...`);
  await db.insert(vehicles).values(
    DEVICE_SEEDS.map((s, i) => {
      const insurance = INSURANCE_MIX[i % INSURANCE_MIX.length];
      const maxSpeedByType: Record<VehicleType, number> = {
        motorcycle: 120, car: 160, truck: 80, bus: 100, van: 130, other: 100,
      };
      return {
        plateNo: s.plateNo,
        type: s.vehicleType,
        make: s.make,
        model: s.vehicleModel,
        maxSpeed: maxSpeedByType[s.vehicleType],
        deviceId: insertedDevices[i].id,
        organizationId: org.id,
        status: s.status === 'inactive' || s.status === 'expired' ? 'inactive' as const : 'active' as const,
        insuranceStatus: insurance,
        insuranceExpiry: insurance === 'none' ? null : new Date(2026 + (i % 4), i % 12, 1 + (i % 27)),
        accumulatedMileage: 5000 + Math.floor(Math.random() * 245000),
        ownerName: s.ownerName,
        ownerPhone: `08${(1000000000 + i * 12345).toString().slice(0, 10)}`,
      };
    }),
  );

  // ─── 7. Drivers (20) ────────────────────────────────
  console.log('  🧑‍✈️ Creating drivers...');
  const driverNames = [
    'Chandra Maulana','Budi Santoso','Ahmad Fauzi','Joko Prasetyo','Siti Aminah',
    'Bambang Suryadi','Dewi Rahayu','Andi Pratama','Hendra Wijaya','Maya Sari',
    'Rina Kurniawati','Eko Saputra','Asep Sunandar','Iqbal Maulana','Rian Hidayat',
    'I Made Wirawan','Ni Kadek Sari','I Wayan Adi','Marbun Siregar','Ratna Sari Dewi',
  ];
  const fleetNames = ['Fleet Jakarta','Fleet Jakarta','Fleet Jakarta','Fleet Jakarta','Fleet Jakarta',
                      'Fleet Jawa Timur','Fleet Jawa Timur','Fleet Jawa Timur','Fleet Jawa Timur',
                      'Fleet Bandung','Fleet Bandung','Fleet Bandung',
                      'Fleet Bali','Fleet Bali','Fleet Bali',
                      'Fleet Sumatera Utara','Fleet Sumatera Utara','Fleet Sumatera Utara',
                      'Fleet Jakarta','Fleet Jawa Timur'];
  const licenseStatuses = ['Active','Active','Active','Active','Active',
                           'Active','Active','Active','Active','Active',
                           'Active','Active','Active','Active','Active',
                           'Expiring','Expiring','Active','Active','Expired'];

  await db.insert(drivers).values(
    driverNames.map((name, i) => ({
      driverNo: `DDN104480${i.toString().padStart(2, '0')}`,
      name,
      phone: `08${(2000000000 + i * 7777).toString().slice(0, 10)}`,
      licenseNo: `SIM-${i % 2 === 0 ? 'A' : 'B2'}-${(100000 + i * 1234).toString()}`,
      registerPlace: ['Jakarta','Surabaya','Bandung','Denpasar','Medan'][i % 5],
      registerDate: new Date(2020 + (i % 5), i % 12, 1 + (i % 27)),
      licenseExpiry: licenseStatuses[i] === 'Expired'
        ? new Date(2025, 0, 15)
        : licenseStatuses[i] === 'Expiring'
          ? new Date(2026, 5, 1)
          : new Date(2028 + (i % 3), i % 12, 1 + (i % 27)),
      licenseStatus: licenseStatuses[i],
      status: 'active' as const,
      organizationId: org.id,
      fleetName: fleetNames[i],
    })),
  );

  // ─── 8. Geofences (8) ───────────────────────────────
  console.log('  🗺️ Creating geofences...');
  await db.insert(geofences).values([
    { name: 'Kantor Pusat Jakarta',  type: 'circle', geometry: { center: { lat: -6.2394, lng: 106.7983 }, radius: 200 }, organizationId: org.id, description: 'Area kantor PT Demo Transport, Kebayoran Baru' },
    { name: 'Pool Cibitung',         type: 'circle', geometry: { center: { lat: -6.2647, lng: 107.0828 }, radius: 400 }, organizationId: org.id, description: 'Pool kendaraan Cibitung, Bekasi' },
    { name: 'Pool Pulogebang',       type: 'circle', geometry: { center: { lat: -6.2014, lng: 106.9433 }, radius: 350 }, organizationId: org.id, description: 'Pool kendaraan Pulogebang, Jakarta Timur' },
    { name: 'Depot Surabaya',        type: 'circle', geometry: { center: { lat: -7.1977, lng: 112.7309 }, radius: 500 }, organizationId: org.id, description: 'Area depot Surabaya dekat Tanjung Perak' },
    { name: 'Depot Bandung',         type: 'circle', geometry: { center: { lat: -6.9039, lng: 107.6186 }, radius: 300 }, organizationId: org.id, description: 'Depot Bandung area Pasteur' },
    { name: 'Terminal Ubung Bali',   type: 'circle', geometry: { center: { lat: -8.6378, lng: 115.2103 }, radius: 250 }, organizationId: org.id, description: 'Terminal Ubung, Denpasar' },
    { name: 'Pelabuhan Belawan',     type: 'circle', geometry: { center: { lat: 3.7833,  lng: 98.6833  }, radius: 600 }, organizationId: org.id, description: 'Pelabuhan Belawan, Medan' },
    { name: 'Depot Medan',           type: 'circle', geometry: { center: { lat: 3.5952,  lng: 98.6722  }, radius: 350 }, organizationId: org.id, description: 'Depot Medan kota' },
  ]);

  // ─── 9. Position History (for Tracks playback) ──────
  console.log('  🗺️  Creating position history tracks...');

  // 5 Jakarta online devices get full 24h route history
  const trackDevices = insertedDevices.slice(0, 5); // First 5 = Jakarta online fleet

  // Route waypoints for each device (lat, lng deltas from Jakarta center)
  const ROUTES: Array<Array<[number, number]>> = [
    // Route 0: Kebayoran → Monas → Kemayoran → Kelapa Gading (car, busy city)
    [[-6.2394,106.7983],[-6.2200,106.8100],[-6.2088,106.8456],[-6.1900,106.8600],[-6.1850,106.8800],[-6.1900,106.9100],[-6.2000,106.9300]],
    // Route 1: Pulogadung → PIK → Pluit → Pantai Indah (truck, north Jakarta)
    [[-6.1901,106.9002],[-6.1200,106.8000],[-6.1050,106.7800],[-6.1100,106.7500],[-6.1200,106.7200],[-6.1500,106.7000]],
    // Route 2: Bekasi → Cawang → Pancoran → Pondok Indah (van, east-south)
    [[-6.2350,106.9900],[-6.2400,106.9200],[-6.2500,106.8700],[-6.2600,106.8200],[-6.2700,106.7900],[-6.2900,106.7700]],
    // Route 3: Thamrin → Semanggi → TB Simatupang → Lebak Bulus (car, south)
    [[-6.1900,106.8200],[-6.2100,106.8100],[-6.2400,106.8100],[-6.2700,106.8050],[-6.2900,106.7850],[-6.3100,106.7750]],
    // Route 4: Grogol → Tomang → Slipi → Kemanggisan (car, west corridor)
    [[-6.1650,106.7900],[-6.1800,106.7950],[-6.1900,106.8000],[-6.2000,106.7950],[-6.2050,106.7850],[-6.2100,106.7700]],
  ];

  const now24h = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

  for (let di = 0; di < trackDevices.length; di++) {
    const dev = trackDevices[di];
    const route = ROUTES[di % ROUTES.length];
    const totalPoints = 80;
    const intervalMs = (24 * 60 * 60 * 1000) / totalPoints; // ~18 min between points

    // Simulate: drive first half, stop at midpoint for 4h, drive second half
    const stopStart = Math.floor(totalPoints * 0.35);
    const stopEnd = Math.floor(totalPoints * 0.55);

    const posValues: Array<{
      deviceId: string; latitude: number; longitude: number;
      speed: number; heading: number; altitude: number;
      satellites: number; gsmSignal: number; batteryVoltage: number;
      accStatus: number; mileage: number; timestamp: Date;
    }> = [];

    let segIdx = 0;
    let mileage = 5000 + di * 15000;

    for (let pi = 0; pi < totalPoints; pi++) {
      const ts = new Date(now24h.getTime() + pi * intervalMs);
      const isStopped = pi >= stopStart && pi <= stopEnd;

      // Progress along route segments
      const progress = pi / (totalPoints - 1);
      segIdx = Math.min(Math.floor(progress * (route.length - 1)), route.length - 2);
      const segProgress = (progress * (route.length - 1)) - segIdx;

      const [lat1, lng1] = route[segIdx];
      const [lat2, lng2] = route[segIdx + 1];
      const baseLat = lat1 + (lat2 - lat1) * segProgress;
      const baseLng = lng1 + (lng2 - lng1) * segProgress;

      // Small noise
      const noiseLat = (Math.random() - 0.5) * 0.0008;
      const noiseLng = (Math.random() - 0.5) * 0.0008;

      const speed = isStopped ? 0 : 15 + Math.floor(Math.random() * 65);
      const heading = isStopped ? 0 : Math.floor(Math.random() * 360);
      if (!isStopped) mileage += speed * (intervalMs / 3600000);

      posValues.push({
        deviceId: dev.id,
        latitude: baseLat + noiseLat,
        longitude: baseLng + noiseLng,
        speed,
        heading,
        altitude: 5 + Math.floor(Math.random() * 40),
        satellites: 8 + Math.floor(Math.random() * 6),
        gsmSignal: 60 + Math.floor(Math.random() * 40),
        batteryVoltage: 12.0 + Math.random() * 0.8,
        accStatus: isStopped ? 0 : 1,
        mileage: Math.floor(mileage),
        timestamp: ts,
      });
    }

    await db.insert(devicePositions).values(posValues);
    console.log(`     Device ${di + 1}/${trackDevices.length}: ${posValues.length} positions inserted`);
  }

  // ─── 10. Alerts (50) ─────────────────────────────────
  console.log('  🚨 Creating alerts...');

  const ALERT_TEMPLATES: Array<{
    type: AlertType;
    severity: AlertSeverity;
    message: (speed?: number) => string;
    needsSpeed: boolean;
  }> = [
    { type: 'overspeed',            severity: 'warning',  needsSpeed: true,  message: (s) => `Vehicle exceeded speed limit: ${s} km/h (Limit: 80 km/h)` },
    { type: 'overspeed',            severity: 'critical', needsSpeed: true,  message: (s) => `Severe overspeed: ${s} km/h (Limit: 80 km/h)` },
    { type: 'acc_on',               severity: 'info',     needsSpeed: false, message: () => 'Engine turned ON' },
    { type: 'acc_off',              severity: 'info',     needsSpeed: false, message: () => 'Engine turned OFF' },
    { type: 'vibration',            severity: 'warning',  needsSpeed: false, message: () => 'Vibration detected — possible tampering or collision' },
    { type: 'collision',            severity: 'critical', needsSpeed: false, message: () => 'Collision detected! Immediate attention required' },
    { type: 'sharp_turn_left',      severity: 'warning',  needsSpeed: false, message: () => 'Sharp left turn detected' },
    { type: 'sharp_turn_right',     severity: 'warning',  needsSpeed: false, message: () => 'Sharp right turn detected' },
    { type: 'sudden_acceleration',  severity: 'warning',  needsSpeed: false, message: () => 'Sudden acceleration detected' },
    { type: 'sudden_deceleration',  severity: 'warning',  needsSpeed: false, message: () => 'Sudden braking detected' },
    { type: 'enter_geofence',       severity: 'info',     needsSpeed: false, message: () => 'Vehicle entered geo-fence zone: Pool Cibitung' },
    { type: 'exit_geofence',        severity: 'info',     needsSpeed: false, message: () => 'Vehicle exited geo-fence zone: Kantor Pusat Jakarta' },
    { type: 'low_battery',          severity: 'warning',  needsSpeed: false, message: () => 'GPS device battery low: 11.8V' },
    { type: 'sos',                  severity: 'critical', needsSpeed: false, message: () => 'SOS button pressed! Emergency assistance needed' },
  ];

  // Only use online/offline devices (that have a valid org & position)
  const eligibleDevices = insertedDevices.filter((_, i) =>
    DEVICE_SEEDS[i].status === 'online' || DEVICE_SEEDS[i].status === 'offline'
  );

  const alertValues: Array<{
    deviceId: string;
    organizationId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < 50; i++) {
    const dev = eligibleDevices[i % eligibleDevices.length];
    const seedData = DEVICE_SEEDS[insertedDevices.indexOf(dev)];
    const center = FLEET_CENTERS[seedData.fleet];
    const tpl = ALERT_TEMPLATES[i % ALERT_TEMPLATES.length];
    const speed = tpl.needsSpeed ? 85 + Math.floor(Math.random() * 55) : null;

    // Spread timestamps over last 48h — ~40% unread (more visible in UI)
    const minsAgo = Math.floor(Math.random() * 48 * 60);
    const createdAt = new Date(now.getTime() - minsAgo * 60 * 1000);
    const isRead = i % 5 !== 0 && i % 7 !== 0; // ~37% unread

    alertValues.push({
      deviceId: dev.id,
      organizationId: org.id,
      type: tpl.type,
      severity: tpl.severity,
      message: tpl.message(speed ?? undefined),
      latitude: center.lat + jitter(),
      longitude: center.lng + jitter(),
      speed,
      isRead,
      createdAt,
    });
  }

  // Sort by createdAt desc so most recent are first
  alertValues.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  await db.insert(alerts).values(alertValues);

  const unreadCount = alertValues.filter((a) => !a.isRead).length;
  console.log(`     ${alertValues.length} alerts inserted (${unreadCount} unread)`);

  console.log('\n✅ Seed complete!');
  const onlineCount  = DEVICE_SEEDS.filter((d) => d.status === 'online').length;
  const offlineCount = DEVICE_SEEDS.filter((d) => d.status === 'offline').length;
  const inactiveCount= DEVICE_SEEDS.filter((d) => d.status === 'inactive').length;
  const expiredCount = DEVICE_SEEDS.filter((d) => d.status === 'expired').length;

  console.log(`
  📊 Summary:
  ├── 1 Organization : PT Demo Transport
  ├── 2 Users        : admin@demo.com / admin123  |  operator@demo.com / operator123
  ├── 5 Device Groups: Jakarta, Jawa Timur, Bandung, Bali, Sumatera Utara
  ├── ${DEVICE_SEEDS.length} Devices     : ${onlineCount} online, ${offlineCount} offline, ${inactiveCount} inactive, ${expiredCount} expired
  ├── ${DEVICE_SEEDS.length} Positions   : Jakarta, Surabaya, Bandung, Bali, Medan (+ 400 history pts)
  ├── ${DEVICE_SEEDS.length} Vehicles
  ├── 20 Drivers
  ├── 8 Geofences
  └── 50 Alerts     : ${alertValues.filter(a => !a.isRead).length} unread, spread over last 48h
  `);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
