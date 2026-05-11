# MQTT Push Topics — IoT Tracking Dashboard

Dokumentasi lengkap topic MQTT yang diterima oleh server dan diteruskan ke dashboard.

> **Arsitektur:** Device berkomunikasi via **MQTT protocol** → **RabbitMQ** (dengan MQTT plugin) → **API Server** memproses pesan → **WebSocket** meneruskan ke frontend dashboard secara real-time.

---

## Daftar Isi

1. [Arsitektur Alur Data](#1-arsitektur-alur-data)
2. [Koneksi MQTT ke RabbitMQ](#2-koneksi-mqtt-ke-rabbitmq)
3. [Topic: Position (GPS)](#3-topic-position-gps)
4. [Topic: Alert (Peringatan Device)](#4-topic-alert-peringatan-device)
5. [Topic: OBD Snapshot](#5-topic-obd-snapshot)
6. [Topic: OBD Fault Code (DTC)](#6-topic-obd-fault-code-dtc)
7. [WebSocket Event ke Frontend](#7-websocket-event-ke-frontend)
8. [Alert yang Di-generate Server](#8-alert-yang-di-generate-server)
9. [Contoh Script Publish (Node.js)](#9-contoh-script-publish-nodejs)
10. [Environment Variables](#10-environment-variables)

---

## 1. Arsitektur Alur Data

```
┌──────────────┐     MQTT      ┌─────────────────┐    AMQP    ┌─────────────────┐
│  IoT Device  │ ────────────▶ │  RabbitMQ Broker │ ─────────▶│   API Server    │
│  (IMEI GPS)  │               │  (MQTT Plugin)   │            │  (Express 5)    │
└──────────────┘               └─────────────────┘            └────────┬────────┘
                                                                        │
                                                              ┌─────────▼────────┐
                                                              │   PostgreSQL DB  │
                                                              │  - positions     │
                                                              │  - alerts        │
                                                              │  - obd_snapshots │
                                                              │  - obd_dtcs      │
                                                              └─────────┬────────┘
                                                                        │
                                                              ┌─────────▼────────┐
                                                              │    WebSocket     │
                                                              │  (Socket.io)     │
                                                              └─────────┬────────┘
                                                                        │
                                                              ┌─────────▼────────┐
                                                              │  React Dashboard │
                                                              │  (Frontend)      │
                                                              └──────────────────┘
```

**Queue Mapping di RabbitMQ:**

| Queue              | Routing Key Pattern     | Consumer Service          |
|--------------------|-------------------------|---------------------------|
| `iot.position.queue` | `device.#.position`   | `processIncomingLocation` |
| `iot.alert.queue`    | `device.#.alert`      | `processIncomingAlert`    |
| `iot.obd.queue`      | `device.#.obd`        | `processIncomingObd`      |
| `iot.dtc.queue`      | `device.#.dtc`        | `processIncomingDtc`      |

---

## 2. Koneksi MQTT ke RabbitMQ

RabbitMQ dikonfigurasi dengan MQTT plugin. Device terkoneksi via MQTT, bukan langsung AMQP.

| Parameter     | Value                            |
|---------------|----------------------------------|
| Host          | `localhost` (atau IP server)     |
| Port MQTT     | `1883`                           |
| Port MQTT TLS | `8883`                           |
| Username      | MQTT credentials dari RabbitMQ   |
| Password      | MQTT credentials dari RabbitMQ   |
| QoS           | 1 (at-least-once delivery)       |
| Exchange      | `amq.topic` (built-in)           |

> **Penting:** Semua topic menggunakan format `device.{IMEI}.{type}` — tanda titik (`.`) adalah separator, bukan garis miring (`/`). RabbitMQ MQTT plugin secara otomatis mengonversi `/` MQTT menjadi `.` AMQP.
>
> Saat publish via MQTT client (misalnya mosquitto), gunakan `/` sebagai separator:
> ```
> device/868020012345678/position
> ```
> RabbitMQ akan otomatis merouting ke queue `device.#.position`.

---

## 3. Topic: Position (GPS)

Digunakan untuk melaporkan posisi GPS perangkat secara real-time.

### Topic

```
device/{IMEI}/position
```

- **Routing Key AMQP:** `device.{IMEI}.position`
- **Queue:** `iot.position.queue`

### Payload Schema

```json
{
  "lat": number,           // Latitude (required) — contoh: -6.2088
  "lng": number,           // Longitude (required) — contoh: 106.8456
  "speed": number,         // Kecepatan (km/h) — contoh: 60
  "heading": number,       // Arah (0-359 derajat) — contoh: 180
  "altitude": number,      // Ketinggian (meter) — contoh: 15
  "satellites": number,    // Jumlah satelit GPS — contoh: 9
  "gsmSignal": number,     // Kekuatan sinyal GSM (10-31) — contoh: 21
  "batteryVoltage": number,// Tegangan baterai (Volt) — contoh: 12.4
  "accStatus": number,     // Status kunci kontak: 0=off, 1=on
  "mileage": number,       // Total jarak tempuh (km) — contoh: 12500
  "timestamp": string      // ISO 8601 — contoh: "2026-05-11T10:30:00.000Z"
}
```

### Contoh Payload

```json
{
  "lat": -6.2088,
  "lng": 106.8456,
  "speed": 60,
  "heading": 270,
  "altitude": 15,
  "satellites": 9,
  "gsmSignal": 21,
  "batteryVoltage": 12.4,
  "accStatus": 1,
  "mileage": 12500,
  "timestamp": "2026-05-11T10:30:00.000Z"
}
```

### Publish via MQTT (mosquitto_pub)

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "device/868020012345678/position" \
  -m '{
    "lat": -6.2088,
    "lng": 106.8456,
    "speed": 60,
    "heading": 270,
    "altitude": 15,
    "satellites": 9,
    "gsmSignal": 21,
    "batteryVoltage": 12.4,
    "accStatus": 1,
    "mileage": 12500,
    "timestamp": "2026-05-11T10:30:00.000Z"
  }'
```

### Publish via RabbitMQ HTTP API

```bash
curl -s -u guest:guest \
  -H "Content-Type: application/json" \
  -X POST http://localhost:15672/api/exchanges/%2F/amq.topic/publish \
  -d '{
    "routing_key": "device.868020012345678.position",
    "payload": "{\"lat\":-6.2088,\"lng\":106.8456,\"speed\":60,\"heading\":270,\"altitude\":15,\"satellites\":9,\"gsmSignal\":21,\"batteryVoltage\":12.4,\"accStatus\":1,\"mileage\":12500,\"timestamp\":\"2026-05-11T10:30:00.000Z\"}",
    "payload_encoding": "string",
    "properties": {}
  }'
```

### Efek di Dashboard

- Marker kendaraan bergerak di MapView secara real-time
- Update status `lastOnline` device
- Alert otomatis dideteksi server (overspeed, ACC on/off) — lihat [Bagian 8](#8-alert-yang-di-generate-server)

---

## 4. Topic: Alert (Peringatan Device)

Digunakan oleh device untuk melaporkan kondisi darurat atau anomali yang dideteksi langsung oleh hardware.

### Topic

```
device/{IMEI}/alert
```

- **Routing Key AMQP:** `device.{IMEI}.alert`
- **Queue:** `iot.alert.queue`

### Payload Schema

```json
{
  "type": string,      // Tipe alert (required) — lihat tabel di bawah
  "lat": number,       // Latitude lokasi kejadian
  "lng": number,       // Longitude lokasi kejadian
  "speed": number,     // Kecepatan saat alert (km/h)
  "timestamp": string  // ISO 8601 — kapan alert terjadi
}
```

### Tipe Alert yang Didukung

| Type                   | Severity   | Keterangan                          |
|------------------------|------------|-------------------------------------|
| `sos`                  | critical   | Tombol SOS ditekan oleh pengemudi   |
| `collision`            | critical   | Sensor tabrakan terdeteksi          |
| `vibration`            | warning    | Getaran tidak normal terdeteksi     |
| `sharp_turn_left`      | warning    | Belokan tajam ke kiri               |
| `sharp_turn_right`     | warning    | Belokan tajam ke kanan              |
| `sudden_acceleration`  | warning    | Akselerasi mendadak                 |
| `sudden_deceleration`  | warning    | Pengereman mendadak                 |
| `low_battery`          | warning    | Tegangan baterai rendah             |

### Contoh Payload: SOS

```json
{
  "type": "sos",
  "lat": -6.2088,
  "lng": 106.8456,
  "speed": 0,
  "timestamp": "2026-05-11T10:35:00.000Z"
}
```

### Contoh Payload: Tabrakan (Collision)

```json
{
  "type": "collision",
  "lat": -6.1751,
  "lng": 106.8650,
  "speed": 45,
  "timestamp": "2026-05-11T10:36:00.000Z"
}
```

### Contoh Payload: Baterai Lemah

```json
{
  "type": "low_battery",
  "lat": -6.2200,
  "lng": 106.8300,
  "speed": 0,
  "timestamp": "2026-05-11T11:00:00.000Z"
}
```

### Contoh Payload: Pengereman Mendadak

```json
{
  "type": "sudden_deceleration",
  "lat": -6.2500,
  "lng": 106.8200,
  "speed": 80,
  "timestamp": "2026-05-11T11:05:00.000Z"
}
```

### Publish via MQTT (mosquitto_pub)

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "device/868020012345678/alert" \
  -m '{
    "type": "sos",
    "lat": -6.2088,
    "lng": 106.8456,
    "speed": 0,
    "timestamp": "2026-05-11T10:35:00.000Z"
  }'
```

### Efek di Dashboard

- Alert muncul di panel Alert Map dengan marker merah/kuning sesuai severity
- Notifikasi real-time via WebSocket event `NEW_ALERT`
- Badge jumlah alert belum dibaca bertambah di top navigation

---

## 5. Topic: OBD Snapshot

Digunakan untuk mengirim data diagnostik mesin (OBD-II) secara periodik.

### Topic

```
device/{IMEI}/obd
```

- **Routing Key AMQP:** `device.{IMEI}.obd`
- **Queue:** `iot.obd.queue`

### Payload Schema

```json
{
  "timestamp": string,        // ISO 8601 — opsional, default server time
  "rpm": number,              // RPM mesin — contoh: 2500
  "engineLoad": number,       // Beban mesin (%) — contoh: 45.5
  "coolantTemp": number,      // Suhu coolant (°C) — contoh: 87
  "intakeTemp": number,       // Suhu udara masuk (°C) — contoh: 35
  "throttle": number,         // Posisi throttle (%) — contoh: 30.0
  "timingAdvance": number,    // Timing pengapian (°BTDC) — contoh: 12.5
  "mafRate": number,          // Mass air flow (g/s) — contoh: 8.2
  "fuelLevel": number,        // Level bahan bakar (%) — contoh: 65.0
  "fuelPressure": number,     // Tekanan bahan bakar (kPa) — contoh: 350
  "shortFuelTrim": number,    // Short term fuel trim (%) — contoh: -1.5
  "longFuelTrim": number,     // Long term fuel trim (%) — contoh: 3.2
  "vehicleSpeed": number,     // Kecepatan dari OBD (km/h) — contoh: 60
  "odometer": number,         // Odometer (km) — contoh: 75432
  "batteryVoltage": number,   // Tegangan aki (V) — contoh: 14.2
  "o2Voltage": number         // Tegangan sensor O2 (V) — contoh: 0.45
}
```

> Semua field bersifat opsional kecuali minimal satu data diagnostik. Field yang tidak tersedia cukup dihilangkan dari payload.

### Contoh Payload: Lengkap

```json
{
  "timestamp": "2026-05-11T10:30:00.000Z",
  "rpm": 2500,
  "engineLoad": 45.5,
  "coolantTemp": 87,
  "intakeTemp": 35,
  "throttle": 30.0,
  "timingAdvance": 12.5,
  "mafRate": 8.2,
  "fuelLevel": 65.0,
  "fuelPressure": 350,
  "shortFuelTrim": -1.5,
  "longFuelTrim": 3.2,
  "vehicleSpeed": 60,
  "odometer": 75432,
  "batteryVoltage": 14.2,
  "o2Voltage": 0.45
}
```

### Contoh Payload: Minimal

```json
{
  "timestamp": "2026-05-11T10:30:00.000Z",
  "rpm": 800,
  "coolantTemp": 90,
  "fuelLevel": 50.0,
  "batteryVoltage": 13.8
}
```

### Publish via MQTT (mosquitto_pub)

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "device/868020012345678/obd" \
  -m '{
    "timestamp": "2026-05-11T10:30:00.000Z",
    "rpm": 2500,
    "engineLoad": 45.5,
    "coolantTemp": 87,
    "intakeTemp": 35,
    "throttle": 30.0,
    "fuelLevel": 65.0,
    "batteryVoltage": 14.2,
    "vehicleSpeed": 60,
    "odometer": 75432
  }'
```

### REST API untuk Membaca Data OBD

Setelah data OBD masuk, dapat diakses via REST API:

```
GET /api/obd/{deviceId}/latest          — Snapshot terbaru
GET /api/obd/{deviceId}/history         — Riwayat (query: from, to, limit)
GET /api/obd/{deviceId}/dtc             — Daftar DTC aktif/semua
PUT /api/obd/{deviceId}/dtc/{id}/clear  — Clear satu DTC
PUT /api/obd/{deviceId}/dtc/clear-all   — Clear semua DTC aktif
```

---

## 6. Topic: OBD Fault Code (DTC)

Digunakan untuk melaporkan kode kerusakan OBD-II (Diagnostic Trouble Codes).

### Topic

```
device/{IMEI}/dtc
```

- **Routing Key AMQP:** `device.{IMEI}.dtc`
- **Queue:** `iot.dtc.queue`

### Payload Schema

```json
{
  "action": "detected" | "cleared",  // Aksi: terdeteksi atau dihapus
  "codes": [
    {
      "code": string,        // Kode DTC — contoh: "P0300"
      "description": string, // Deskripsi — opsional
      "severity": "critical" | "warning" | "info"  // default: warning
    }
  ]
}
```

### Konvensi Kode DTC

| Prefix | Sistem         | Contoh  |
|--------|----------------|---------|
| `P`    | Powertrain     | P0300   |
| `B`    | Body           | B0001   |
| `C`    | Chassis        | C0035   |
| `U`    | Network / Comm | U0100   |

### Contoh Payload: DTC Terdeteksi

```json
{
  "action": "detected",
  "codes": [
    {
      "code": "P0300",
      "description": "Random/Multiple Cylinder Misfire Detected",
      "severity": "critical"
    },
    {
      "code": "P0171",
      "description": "System Too Lean (Bank 1)",
      "severity": "warning"
    }
  ]
}
```

### Contoh Payload: DTC Dihapus (setelah perbaikan)

```json
{
  "action": "cleared",
  "codes": [
    {
      "code": "P0300"
    },
    {
      "code": "P0171"
    }
  ]
}
```

### Contoh Payload: Satu DTC Critical

```json
{
  "action": "detected",
  "codes": [
    {
      "code": "P0016",
      "description": "Crankshaft/Camshaft Position Correlation - Bank 1 Sensor A",
      "severity": "critical"
    }
  ]
}
```

### Publish via MQTT (mosquitto_pub)

```bash
# Report DTC baru
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "device/868020012345678/dtc" \
  -m '{
    "action": "detected",
    "codes": [
      {
        "code": "P0300",
        "description": "Random/Multiple Cylinder Misfire Detected",
        "severity": "critical"
      }
    ]
  }'

# Clear DTC setelah perbaikan
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "device/868020012345678/dtc" \
  -m '{
    "action": "cleared",
    "codes": [{ "code": "P0300" }]
  }'
```

---

## 7. WebSocket Event ke Frontend

Setelah API memproses pesan MQTT, data diteruskan ke dashboard via WebSocket.

### Koneksi WebSocket

```
ws://localhost:3000/api/ws/tracking?token={JWT_ACCESS_TOKEN}
```

### Event: LOCATION_UPDATE

Dikirim setiap ada data posisi baru.

```json
{
  "type": "LOCATION_UPDATE",
  "data": {
    "deviceId": "uuid-device",
    "lat": -6.2088,
    "lng": 106.8456,
    "speed": 60,
    "heading": 270,
    "altitude": 15,
    "satellites": 9,
    "gsmSignal": 21,
    "timestamp": "2026-05-11T10:30:00.000Z"
  }
}
```

### Event: NEW_ALERT

Dikirim setiap ada alert baru (dari device maupun dari server).

```json
{
  "type": "NEW_ALERT",
  "data": {
    "id": "uuid-alert",
    "deviceId": "uuid-device",
    "type": "sos",
    "severity": "critical",
    "message": "SOS alert from device 868020012345678",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "speed": 0,
    "createdAt": "2026-05-11T10:35:00.000Z"
  }
}
```

---

## 8. Alert yang Di-generate Server

Selain alert dari device (bagian 4), server juga otomatis mendeteksi alert berdasarkan data posisi yang masuk.

### Overspeed Alert

Dipicu saat `speed` melebihi `vehicle.maxSpeed` yang dikonfigurasi di database.

| Field      | Value                          |
|------------|--------------------------------|
| Type       | `overspeed`                    |
| Severity   | `warning`                      |
| Trigger    | `payload.speed > vehicle.maxSpeed` |

**Cara trigger via MQTT:** Kirim position dengan speed tinggi.

```json
{
  "lat": -6.2088,
  "lng": 106.8456,
  "speed": 150,
  "heading": 270,
  "accStatus": 1,
  "timestamp": "2026-05-11T10:30:00.000Z"
}
```

### ACC On Alert

Dipicu saat `accStatus` berubah dari `0` → `1` (kunci kontak dinyalakan).

| Field      | Value     |
|------------|-----------|
| Type       | `acc_on`  |
| Severity   | `info`    |

### ACC Off Alert

Dipicu saat `accStatus` berubah dari `1` → `0` (kunci kontak dimatikan).

| Field      | Value     |
|------------|-----------|
| Type       | `acc_off` |
| Severity   | `info`    |

> **Catatan:** Deteksi ACC bergantung pada posisi sebelumnya yang tersimpan di cache. Kiriman pertama tidak akan memicu alert ACC karena tidak ada data pembanding.

---

## 9. Contoh Script Publish (Node.js)

### Simulasi Posisi GPS Real-time

```javascript
// simulate-position.mjs
import fetch from 'node-fetch';

const RABBITMQ_URL = 'http://localhost:15672';
const RABBITMQ_USER = 'guest';
const RABBITMQ_PASS = 'guest';
const IMEI = '868020012345678';

async function publishPosition(lat, lng, speed) {
  const payload = {
    lat,
    lng,
    speed,
    heading: Math.floor(Math.random() * 360),
    altitude: 10 + Math.random() * 50,
    satellites: 8 + Math.floor(Math.random() * 4),
    gsmSignal: 15 + Math.floor(Math.random() * 16),
    batteryVoltage: 12.0 + Math.random() * 2,
    accStatus: 1,
    mileage: 12500,
    timestamp: new Date().toISOString(),
  };

  await fetch(`${RABBITMQ_URL}/api/exchanges/%2F/amq.topic/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASS}`).toString('base64')}`,
    },
    body: JSON.stringify({
      routing_key: `device.${IMEI}.position`,
      payload: JSON.stringify(payload),
      payload_encoding: 'string',
      properties: {},
    }),
  });

  console.log(`Published position: lat=${lat}, lng=${lng}, speed=${speed}`);
}

// Simulasi kendaraan bergerak
let lat = -6.2088;
let lng = 106.8456;

setInterval(async () => {
  lat += (Math.random() - 0.5) * 0.001;
  lng += (Math.random() - 0.5) * 0.001;
  const speed = 30 + Math.random() * 60;
  await publishPosition(lat, lng, speed);
}, 1000);
```

### Trigger Alert SOS

```javascript
// trigger-sos.mjs
import fetch from 'node-fetch';

const RABBITMQ_URL = 'http://localhost:15672';
const IMEI = '868020012345678';

const auth = Buffer.from('guest:guest').toString('base64');

const payload = {
  type: 'sos',
  lat: -6.2088,
  lng: 106.8456,
  speed: 0,
  timestamp: new Date().toISOString(),
};

await fetch(`${RABBITMQ_URL}/api/exchanges/%2F/amq.topic/publish`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  },
  body: JSON.stringify({
    routing_key: `device.${IMEI}.alert`,
    payload: JSON.stringify(payload),
    payload_encoding: 'string',
    properties: {},
  }),
});

console.log('SOS alert sent!');
```

### Kirim Data OBD

```javascript
// send-obd.mjs
import fetch from 'node-fetch';

const RABBITMQ_URL = 'http://localhost:15672';
const IMEI = '868020012345678';
const auth = Buffer.from('guest:guest').toString('base64');

const obdPayload = {
  timestamp: new Date().toISOString(),
  rpm: 2500,
  engineLoad: 45.5,
  coolantTemp: 87,
  intakeTemp: 35,
  throttle: 30.0,
  timingAdvance: 12.5,
  mafRate: 8.2,
  fuelLevel: 65.0,
  fuelPressure: 350,
  shortFuelTrim: -1.5,
  longFuelTrim: 3.2,
  vehicleSpeed: 60,
  odometer: 75432,
  batteryVoltage: 14.2,
  o2Voltage: 0.45,
};

await fetch(`${RABBITMQ_URL}/api/exchanges/%2F/amq.topic/publish`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  },
  body: JSON.stringify({
    routing_key: `device.${IMEI}.obd`,
    payload: JSON.stringify(obdPayload),
    payload_encoding: 'string',
    properties: {},
  }),
});

console.log('OBD snapshot sent!');
```

### Kirim DTC dan Trigger Alert Lengkap

```javascript
// full-simulation.mjs
// Jalankan: node scripts/full-simulation.mjs
import fetch from 'node-fetch';

const BASE = 'http://localhost:15672/api/exchanges/%2F/amq.topic/publish';
const AUTH = `Basic ${Buffer.from('guest:guest').toString('base64')}`;
const IMEI = '868020012345678';

async function publish(routingKey, payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: JSON.stringify({
      routing_key: routingKey,
      payload: JSON.stringify(payload),
      payload_encoding: 'string',
      properties: {},
    }),
  });
  console.log(`[${routingKey}] status: ${res.status}`);
}

// 1. Position normal
await publish(`device.${IMEI}.position`, {
  lat: -6.2088, lng: 106.8456, speed: 60, heading: 90,
  accStatus: 1, satellites: 9, gsmSignal: 21,
  batteryVoltage: 12.4, mileage: 12500,
  timestamp: new Date().toISOString(),
});

// 2. OBD snapshot
await publish(`device.${IMEI}.obd`, {
  rpm: 2500, engineLoad: 45.5, coolantTemp: 87,
  fuelLevel: 65.0, batteryVoltage: 14.2, vehicleSpeed: 60,
  timestamp: new Date().toISOString(),
});

// 3. DTC terdeteksi
await publish(`device.${IMEI}.dtc`, {
  action: 'detected',
  codes: [
    { code: 'P0300', description: 'Multiple Cylinder Misfire', severity: 'critical' },
    { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'warning' },
  ],
});

// 4. Alert SOS
await publish(`device.${IMEI}.alert`, {
  type: 'sos',
  lat: -6.2088, lng: 106.8456, speed: 0,
  timestamp: new Date().toISOString(),
});

console.log('Full simulation complete!');
```

### Script Stress Test yang Tersedia

Project sudah menyertakan script stress test:

```bash
# Simulasi banyak GPS position dari 36 IMEI
node scripts/stress-test.mjs [iterations] [delay_ms]
node scripts/stress-test.mjs 50 100        # 50 iterasi, interval 100ms
node scripts/stress-test.mjs 0             # Infinite (Ctrl+C untuk stop)

# Trigger semua tipe alert
node scripts/stress-test-alert.mjs [iterations] [delay_ms]
node scripts/stress-test-alert.mjs 10 200  # 10 iterasi, interval 200ms
```

---

## 10. Environment Variables

Konfigurasi yang diperlukan di `apps/api/.env`:

```env
# Database
DATABASE_URL=postgres://iot_admin:iot_secret@localhost:5432/iot_platform

# Redis (untuk cache posisi terbaru)
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:5173

# Server
API_PORT=3000
```

---

## Ringkasan Topic

| Topic MQTT                    | Routing Key AMQP              | Tujuan                           |
|-------------------------------|-------------------------------|----------------------------------|
| `device/{IMEI}/position`      | `device.{IMEI}.position`      | GPS position real-time           |
| `device/{IMEI}/alert`         | `device.{IMEI}.alert`         | Alert dari hardware device       |
| `device/{IMEI}/obd`           | `device.{IMEI}.obd`           | Data diagnostik mesin OBD-II     |
| `device/{IMEI}/dtc`           | `device.{IMEI}.dtc`           | Kode kerusakan DTC OBD           |

> **IMEI** adalah nomor identifikasi unik 15 digit dari modem GSM/GPS perangkat.
> Pastikan IMEI sudah terdaftar di database (`devices` table) agar pesan diproses.
