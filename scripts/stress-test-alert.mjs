/**
 * Alert Stress Test — memicu semua jenis alert untuk semua IMEI
 *
 * Dua jalur alert:
 *   A. Via topic device/{IMEI}/position  → API deteksi server-side
 *        - accStatus false→true  → acc_on
 *        - accStatus true→false  → acc_off
 *        - speed > maxSpeed      → overspeed (butuh vehicle.maxSpeed di DB)
 *
 *   B. Via topic device/{IMEI}/alert     → device-side event langsung
 *        - sos, vibration, collision
 *        - sharp_turn_left, sharp_turn_right
 *        - sudden_acceleration, sudden_deceleration
 *        - low_battery
 *
 * Usage:
 *   node scripts/stress-test-alert.mjs              # 3 iterasi, delay 200ms
 *   node scripts/stress-test-alert.mjs 10           # 10 iterasi
 *   node scripts/stress-test-alert.mjs 10 100       # 10 iterasi, delay 100ms
 *   node scripts/stress-test-alert.mjs 0            # infinite (Ctrl+C untuk stop)
 *
 * Requires: RabbitMQ running + API dev server running
 */

import http from 'http';

// ─── Config ───────────────────────────────────────────────────────────────────
const RABBITMQ_HOST  = 'localhost';
const RABBITMQ_PORT  = 15672;
const RABBITMQ_USER  = 'admin';
const RABBITMQ_PASS  = 'admin123';

const MAX_ITERATIONS = parseInt(process.argv[2] ?? '3', 10);
const DELAY_MS       = parseInt(process.argv[3] ?? '200', 10);

const LAT_CENTER     =  -6.2;
const LNG_CENTER     = 106.8;
const JITTER         =   0.3;
const OVERSPEED_KMH  = 150;   // pasti trigger jika vehicle.maxSpeed < 150

// Alert types yang dikirim langsung dari device
const DEVICE_ALERT_TYPES = [
  'sos',
  'vibration',
  'collision',
  'sharp_turn_left',
  'sharp_turn_right',
  'sudden_acceleration',
  'sudden_deceleration',
  'low_battery',
];

// ─── IMEI List ────────────────────────────────────────────────────────────────
const IMEIS = [
  '863300400500002',
  '861100200300008',
  '865500600700001',
  '862200300400006',
  '861100200300005',
  '864400500600003',
  '862200300400003',
  '861100200300002',
  '863300400500008',
  '863300400500005',
  '865678901234567',
  '863300400500004',
  '869876543210987',
  '863300400500001',
  '861100200300007',
  '864400500600005',
  '862200300400005',
  '861100200300004',
  '864400500600002',
  '862200300400002',
  '861100200300001',
  '863300400500007',
  '862345678901234',
  '865500600700003',
  '861234567890123',
  '861100200300006',
  '864400500600004',
  '862200300400004',
  '861100200300003',
  '864400500600001',
  '862200300400001',
  '865500600700005',
  '864567890123456',
  '863300400500003',
  '867890123456789',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand    = (c, j) => +(c + (Math.random() * 2 - 1) * j).toFixed(6);
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick    = (arr)  => arr[Math.floor(Math.random() * arr.length)];
const sleep   = (ms)   => new Promise((r) => setTimeout(r, ms));
const AUTH    = Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASS}`).toString('base64');

function publishTo(routingKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      routing_key:      routingKey,
      payload:          JSON.stringify(payload),
      payload_encoding: 'string',
      properties:       { delivery_mode: 2 },
    });
    const req = http.request(
      {
        hostname: RABBITMQ_HOST,
        port:     RABBITMQ_PORT,
        path:     '/api/exchanges/%2F/amq.topic/publish',
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization:    `Basic ${AUTH}`,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(res.statusCode));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const publishPosition = (imei, payload) =>
  publishTo(`device.${imei}.position`, payload);

const publishAlert = (imei, payload) =>
  publishTo(`device.${imei}.alert`, payload);

// ─── Stats ────────────────────────────────────────────────────────────────────
let totalSent = 0, totalFailed = 0, alertsExpected = 0;
const start = Date.now();

function tick(ok, expectedAlerts = 0) {
  if (ok) { totalSent++; alertsExpected += expectedAlerts; }
  else totalFailed++;
}

function printProgress(iter) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.stdout.write(
    `\r[iter ${iter}] sent=${totalSent} failed=${totalFailed} alerts≈${alertsExpected} elapsed=${elapsed}s   `,
  );
}

// ─── Sequence A: position-based alerts ───────────────────────────────────────
async function sendPositionAlerts(imei) {
  const lat = rand(LAT_CENTER, JITTER);
  const lng = rand(LNG_CENTER, JITTER);

  // 1. Baseline: accStatus=false, normal speed
  tick(await publishPosition(imei, {
    lat, lng,
    speed: randInt(20, 60), heading: randInt(0, 359),
    altitude: randInt(0, 200), satellites: randInt(6, 12),
    gsmSignal: randInt(15, 31), accStatus: false,
    timestamp: new Date().toISOString(),
  }).catch(() => 0) === 200);
  if (DELAY_MS > 0) await sleep(DELAY_MS);

  // 2. Overspeed + ACC ON → overspeed + acc_on
  tick(await publishPosition(imei, {
    lat: rand(LAT_CENTER, JITTER), lng: rand(LNG_CENTER, JITTER),
    speed: OVERSPEED_KMH, heading: randInt(0, 359),
    altitude: randInt(0, 200), satellites: randInt(6, 12),
    gsmSignal: randInt(15, 31), accStatus: true,
    timestamp: new Date().toISOString(),
  }).catch(() => 0) === 200, 2);   // 2 alerts: overspeed + acc_on
  if (DELAY_MS > 0) await sleep(DELAY_MS);

  // 3. Normal speed + ACC OFF → acc_off
  tick(await publishPosition(imei, {
    lat: rand(LAT_CENTER, JITTER), lng: rand(LNG_CENTER, JITTER),
    speed: randInt(0, 30), heading: randInt(0, 359),
    altitude: randInt(0, 200), satellites: randInt(6, 12),
    gsmSignal: randInt(15, 31), accStatus: false,
    timestamp: new Date().toISOString(),
  }).catch(() => 0) === 200, 1);   // 1 alert: acc_off
}

// ─── Sequence B: device-side alert events ────────────────────────────────────
async function sendDeviceAlerts(imei) {
  // Kirim 2 random device alert per IMEI per iterasi
  for (let i = 0; i < 2; i++) {
    const type = pick(DEVICE_ALERT_TYPES);
    tick(await publishAlert(imei, {
      type,
      lat:       rand(LAT_CENTER, JITTER),
      lng:       rand(LNG_CENTER, JITTER),
      speed:     randInt(0, 120),
      timestamp: new Date().toISOString(),
    }).catch(() => 0) === 200, 1);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const infinite = MAX_ITERATIONS === 0;

  console.log('\nAlert Stress Test');
  console.log(`  IMEIs       : ${IMEIS.length}`);
  console.log(`  Iterations  : ${infinite ? '∞ (Ctrl+C to stop)' : MAX_ITERATIONS}`);
  console.log(`  Delay       : ${DELAY_MS}ms`);
  console.log(`  Overspeed   : ${OVERSPEED_KMH} km/h`);
  console.log(`  Per IMEI    : 3 position msgs (acc_on/off/overspeed) + 2 device alerts`);
  console.log(`  Topics      : device/{IMEI}/position  &  device/{IMEI}/alert`);
  console.log(`  Target      : http://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
  console.log('');

  let iteration = 0;
  while (infinite || iteration < MAX_ITERATIONS) {
    iteration++;

    for (const imei of IMEIS) {
      try {
        await sendPositionAlerts(imei);   // → acc_on, acc_off, overspeed
        await sendDeviceAlerts(imei);     // → sos/vibration/collision/etc
      } catch (err) {
        console.error(`\n  [ERR] ${imei}: ${err.message}`);
        totalFailed++;
      }
      printProgress(iteration);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n── Done ─────────────────────────────────────────────`);
  console.log(`  Messages sent    : ${totalSent}`);
  console.log(`  Messages failed  : ${totalFailed}`);
  console.log(`  Alerts expected  : ≈${alertsExpected}`);
  console.log(`    (overspeed hanya jika vehicle.maxSpeed < ${OVERSPEED_KMH} di DB)`);
  console.log(`  Elapsed          : ${elapsed}s`);
  console.log(`  Rate             : ${(totalSent / elapsed).toFixed(1)} msg/s`);
  console.log('');
  console.log('  Cek hasil di DB:');
  console.log("  SELECT type, severity, COUNT(*) FROM alerts GROUP BY type, severity ORDER BY COUNT(*) DESC;");
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
