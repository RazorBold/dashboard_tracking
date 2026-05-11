/**
 * RabbitMQ Stress Test — publishes GPS position for every IMEI in a loop
 *
 * Usage:
 *   node scripts/stress-test.mjs              # 10 iterations, 100ms delay
 *   node scripts/stress-test.mjs 50           # 50 iterations
 *   node scripts/stress-test.mjs 50 50        # 50 iterations, 50ms delay between messages
 *   node scripts/stress-test.mjs 0            # infinite loop (Ctrl+C to stop)
 *
 * Requires: RabbitMQ running on localhost:15672 (docker-compose up iot-rabbitmq)
 */

import http from 'http';

// ─── Config ───────────────────────────────────────────────────────────────────
const RABBITMQ_HOST = 'localhost';
const RABBITMQ_PORT = 15672;
const RABBITMQ_USER = 'admin';
const RABBITMQ_PASS = 'admin123';

const MAX_ITERATIONS = parseInt(process.argv[2] ?? '10', 10); // 0 = infinite
const DELAY_MS       = parseInt(process.argv[3] ?? '100', 10);

// GPS bounding box — area around Jabodetabek
const LAT_CENTER =  -6.2;
const LNG_CENTER = 106.8;
const LAT_JITTER =   0.5;  // ±0.5 degree
const LNG_JITTER =   0.5;

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
  '863300400500007',
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
const rand = (center, jitter) => +(center + (Math.random() * 2 - 1) * jitter).toFixed(6);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AUTH = Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASS}`).toString('base64');

function publish(imei, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      routing_key: `device.${imei}.position`,
      payload: JSON.stringify(payload),
      payload_encoding: 'string',
      properties: { delivery_mode: 2 }, // persistent
    });

    const req = http.request(
      {
        hostname: RABBITMQ_HOST,
        port: RABBITMQ_PORT,
        path: '/api/exchanges/%2F/amq.topic/publish',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Basic ${AUTH}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(res.statusCode));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
let totalSent = 0;
let totalFailed = 0;
const startTime = Date.now();

function printStats(iteration) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (totalSent / (elapsed || 1)).toFixed(1);
  process.stdout.write(
    `\r[iter ${iteration}] sent=${totalSent} failed=${totalFailed} elapsed=${elapsed}s rate=${rate}/s   `,
  );
}

// ─── Main Loop ────────────────────────────────────────────────────────────────
async function run() {
  const infinite = MAX_ITERATIONS === 0;
  console.log(`\nRabbitMQ Stress Test`);
  console.log(`  IMEIs      : ${IMEIS.length}`);
  console.log(`  Iterations : ${infinite ? '∞ (Ctrl+C to stop)' : MAX_ITERATIONS}`);
  console.log(`  Delay      : ${DELAY_MS}ms between messages`);
  console.log(`  Target     : http://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
  console.log('');

  let iteration = 0;

  while (infinite || iteration < MAX_ITERATIONS) {
    iteration++;

    for (const imei of IMEIS) {
      const payload = {
        imei,
        lat:        rand(LAT_CENTER, LAT_JITTER),
        lng:        rand(LNG_CENTER, LNG_JITTER),
        speed:      randInt(0, 120),
        heading:    randInt(0, 359),
        altitude:   randInt(0, 200),
        satellites: randInt(4, 12),
        gsmSignal:  randInt(10, 31),
        timestamp:  new Date().toISOString(),
      };

      try {
        const status = await publish(imei, payload);
        if (status === 200) {
          totalSent++;
        } else {
          totalFailed++;
          console.error(`\n  [WARN] IMEI ${imei} → HTTP ${status}`);
        }
      } catch (err) {
        totalFailed++;
        console.error(`\n  [ERR]  IMEI ${imei} → ${err.message}`);
      }

      if (DELAY_MS > 0) await sleep(DELAY_MS);
      printStats(iteration);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n── Done ──────────────────────────────────`);
  console.log(`  Total sent  : ${totalSent}`);
  console.log(`  Total failed: ${totalFailed}`);
  console.log(`  Elapsed     : ${elapsed}s`);
  console.log(`  Avg rate    : ${(totalSent / elapsed).toFixed(1)} msg/s`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
