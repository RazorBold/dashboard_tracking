import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';
import { db } from '../db';
import { reportTemplates, autoReports, devicePositions, devices } from '../db/schema';
import type { ReportTemplate, NewReportTemplate, AutoReport, NewAutoReport } from '../db/schema';

// ─── Report Templates ────────────────────────────────

export async function listReportTemplates(orgId: string): Promise<ReportTemplate[]> {
  return db
    .select()
    .from(reportTemplates)
    .where(eq(reportTemplates.organizationId, orgId))
    .orderBy(desc(reportTemplates.createdAt));
}

export async function createReportTemplate(
  data: Omit<NewReportTemplate, 'id' | 'createdAt'>,
): Promise<ReportTemplate> {
  const [row] = await db.insert(reportTemplates).values(data).returning();
  return row;
}

export async function deleteReportTemplate(id: string, orgId: string): Promise<boolean> {
  const rows = await db
    .delete(reportTemplates)
    .where(and(eq(reportTemplates.id, id), eq(reportTemplates.organizationId, orgId)))
    .returning({ id: reportTemplates.id });
  return rows.length > 0;
}

// ─── Run Report → CSV ────────────────────────────────

export async function runReport(id: string, orgId: string): Promise<{ csv: string; name: string }> {
  const [template] = await db
    .select()
    .from(reportTemplates)
    .where(and(eq(reportTemplates.id, id), eq(reportTemplates.organizationId, orgId)));

  if (!template) throw new Error('Report template not found');

  // Resolve device IDs to query
  let deviceIds: string[];
  if (template.deviceId) {
    deviceIds = [template.deviceId];
  } else {
    const orgDevices = await db
      .select({ id: devices.id })
      .from(devices)
      .where(eq(devices.organizationId, orgId));
    deviceIds = orgDevices.map((d) => d.id);
  }

  if (deviceIds.length === 0) {
    return { csv: 'No devices found\n', name: template.name };
  }

  // Device name lookup
  const deviceRows = await db
    .select({ id: devices.id, name: devices.name, imei: devices.imei })
    .from(devices)
    .where(inArray(devices.id, deviceIds));
  const deviceMap = new Map(deviceRows.map((d) => [d.id, d]));

  // Build position query conditions
  const posConditions = [inArray(devicePositions.deviceId, deviceIds)];
  if (template.dateFrom) posConditions.push(gte(devicePositions.timestamp, template.dateFrom));
  if (template.dateTo) posConditions.push(lte(devicePositions.timestamp, template.dateTo));

  const positions = await db
    .select()
    .from(devicePositions)
    .where(and(...posConditions))
    .orderBy(devicePositions.deviceId, devicePositions.timestamp);

  let csv: string;

  if (template.reportType === 'daily_activity') {
    // Group by date + device
    type DayKey = string;
    const buckets = new Map<DayKey, {
      date: string; deviceId: string; deviceName: string; points: number;
      maxSpeed: number; speedSum: number;
    }>();

    for (const p of positions) {
      const date = p.timestamp.toISOString().slice(0, 10);
      const key = `${date}__${p.deviceId}`;
      const dev = deviceMap.get(p.deviceId);
      if (!buckets.has(key)) {
        buckets.set(key, {
          date,
          deviceId: p.deviceId,
          deviceName: dev?.name ?? p.deviceId,
          points: 0,
          maxSpeed: 0,
          speedSum: 0,
        });
      }
      const b = buckets.get(key)!;
      b.points++;
      const spd = p.speed ?? 0;
      b.speedSum += spd;
      if (spd > b.maxSpeed) b.maxSpeed = spd;
    }

    const header = 'Date,Device,Points,Avg Speed (km/h),Max Speed (km/h)';
    const rows = [...buckets.values()]
      .sort((a, b) => a.date.localeCompare(b.date) || a.deviceName.localeCompare(b.deviceName))
      .map((b) => {
        const avg = b.points > 0 ? (b.speedSum / b.points).toFixed(1) : '0';
        return `${b.date},"${b.deviceName}",${b.points},${avg},${b.maxSpeed.toFixed(1)}`;
      });
    csv = [header, ...rows].join('\n');
  } else {
    // track_details — raw rows
    const header = 'Timestamp,Device,Latitude,Longitude,Speed (km/h),Satellites,GSM Signal';
    const rows = positions.map((p) => {
      const dev = deviceMap.get(p.deviceId);
      return [
        p.timestamp.toISOString(),
        `"${dev?.name ?? p.deviceId}"`,
        p.latitude.toFixed(6),
        p.longitude.toFixed(6),
        (p.speed ?? 0).toFixed(1),
        p.satellites ?? '',
        p.gsmSignal ?? '',
      ].join(',');
    });
    csv = [header, ...rows].join('\n');
  }

  return { csv, name: template.name };
}

// ─── Auto Reports ────────────────────────────────────

export async function listAutoReports(orgId: string): Promise<AutoReport[]> {
  return db
    .select()
    .from(autoReports)
    .where(eq(autoReports.organizationId, orgId))
    .orderBy(desc(autoReports.createdAt));
}

export async function createAutoReport(
  data: Omit<NewAutoReport, 'id' | 'createdAt'>,
): Promise<AutoReport> {
  const [row] = await db.insert(autoReports).values(data).returning();
  return row;
}

export async function toggleAutoReport(id: string, orgId: string): Promise<AutoReport | null> {
  const [current] = await db
    .select()
    .from(autoReports)
    .where(and(eq(autoReports.id, id), eq(autoReports.organizationId, orgId)));
  if (!current) return null;

  const [updated] = await db
    .update(autoReports)
    .set({ isActive: !current.isActive })
    .where(eq(autoReports.id, id))
    .returning();
  return updated;
}

export async function deleteAutoReport(id: string, orgId: string): Promise<boolean> {
  const rows = await db
    .delete(autoReports)
    .where(and(eq(autoReports.id, id), eq(autoReports.organizationId, orgId)))
    .returning({ id: autoReports.id });
  return rows.length > 0;
}
