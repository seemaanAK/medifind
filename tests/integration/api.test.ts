import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createApp } from '../../server/src/app';

describe('MediFind Backend API Endpoints', () => {
  let server: http.Server;
  let baseUrl: string;
  const testUserToken = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /api/health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('medifind-api');
  });

  it('GET /api/medicines searches verified medicines by query', async () => {
    const res = await fetch(`${baseUrl}/api/medicines?query=Paracetamol`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toContain('Paracetamol');
    expect(body.data[0].verification_status).toBe('verified');
    expect(body.data[0].source_name).toContain('CDSCO');
  });

  it('GET /api/medicines/:medicineId returns specific verified monograph', async () => {
    const res = await fetch(`${baseUrl}/api/medicines/22222222-0000-0000-0000-000000000001`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Paracetamol 500mg IP Tablet');
    expect(body.data.active_ingredients).toBeInstanceOf(Array);
    expect(body.data.storage_information).toBeDefined();
  });

  it('GET /api/emergency-contacts always returns nationwide 112', async () => {
    const res = await fetch(`${baseUrl}/api/emergency-contacts`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    const contact112 = body.data.find((c: any) => c.phone_number === '112');
    expect(contact112).toBeDefined();
    expect(contact112.coverage_type).toBe('nationwide');
    expect(contact112.verification_status).toBe('verified');
  });

  it('GET /api/emergency-contacts?state=Delhi filters regional contacts', async () => {
    const res = await fetch(`${baseUrl}/api/emergency-contacts?state=Delhi`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const numbers = body.data.map((c: any) => c.phone_number);
    expect(numbers).toContain('112');
    expect(numbers).toContain('108'); // 108 is verified in Delhi
  });

  it('GET /api/pharmacies/search calculates straight-line distance when coordinates provided', async () => {
    // Connaught Place Delhi coords: 28.6315, 77.2167
    const res = await fetch(`${baseUrl}/api/pharmacies/search?latitude=28.63&longitude=77.21&radiusKm=10`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].distance_km).toBeDefined();
    expect(body.data[0].distance_km).toBeLessThan(10);
    // Availability is honest (unknown or verified, never fake stock)
    expect(body.data[0].availability_status).toBe('unknown');
  });

  it('GET /api/first-aid/articles returns verified educational articles', async () => {
    const res = await fetch(`${baseUrl}/api/first-aid/articles`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].source_name).toBeDefined();
    expect(body.data[0].verification_status).toBe('verified');
  });

  it('Prescription schedules CRUD workflow with auth token', async () => {
    // 1. Create schedule
    const createRes = await fetch(`${baseUrl}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        medicine_name: 'Amoxicillin 500mg IP Capsule',
        prescribed_dosage: '1 capsule three times daily for 5 days',
        prescribed_times: [
          { time: '08:00', label: 'Morning' },
          { time: '14:00', label: 'Afternoon' },
          { time: '20:00', label: 'Night' },
        ],
        start_date: '2026-11-14',
        end_date: '2026-11-19',
        clinician_name: 'Dr. S. Patel (MBBS)',
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.data.id).toBeDefined();
    expect(created.data.medicine_name).toBe('Amoxicillin 500mg IP Capsule');
    const scheduleId = created.data.id;

    // 2. Read schedule
    const getRes = await fetch(`${baseUrl}/api/schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    expect(getRes.status).toBe(200);

    // 3. Delete schedule
    const delRes = await fetch(`${baseUrl}/api/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    expect(delRes.status).toBe(200);
  });
});
