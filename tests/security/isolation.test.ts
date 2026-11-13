import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createApp } from '../../server/src/app';

describe('Security & Data Isolation Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  const userA = '00000000-0000-0000-0000-00000000000a';
  const userB = '00000000-0000-0000-0000-00000000000b';

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

  it('rejects unauthenticated requests to private prescription endpoints with 401', async () => {
    const res = await fetch(`${baseUrl}/api/schedules`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unauthenticated requests to private first-aid items with 401', async () => {
    const res = await fetch(`${baseUrl}/api/first-aid/items`);
    expect(res.status).toBe(401);
  });

  it('enforces cross-user isolation on prescription schedules: User A cannot read User B schedule', async () => {
    // User B creates a prescription schedule
    const createRes = await fetch(`${baseUrl}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userB}`,
      },
      body: JSON.stringify({
        medicine_name: 'Metformin Hydrochloride 500mg IP',
        prescribed_dosage: '1 tablet with dinner',
        prescribed_times: [{ time: '20:30', label: 'Dinner' }],
      }),
    });
    expect(createRes.status).toBe(201);
    const scheduleId = (await createRes.json()).data.id;

    // User A attempts to read User B's schedule
    const accessRes = await fetch(`${baseUrl}/api/schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${userA}` },
    });
    expect(accessRes.status).toBe(404); // Kept 404 to avoid disclosing existence of other users' records

    // User A attempts to delete User B's schedule
    const deleteRes = await fetch(`${baseUrl}/api/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA}` },
    });
    expect(deleteRes.status).toBe(404);
  });

  it('enforces cross-user isolation on first-aid items: User A cannot read or delete User B item', async () => {
    // User B creates a first aid item
    const createRes = await fetch(`${baseUrl}/api/first-aid/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userB}`,
      },
      body: JSON.stringify({
        item_name: 'Private Sterile Dressing',
        quantity: 5,
        unit: 'item',
      }),
    });
    expect(createRes.status).toBe(201);
    const itemId = (await createRes.json()).data.id;

    // User A attempts to modify User B's item
    const patchRes = await fetch(`${baseUrl}/api/first-aid/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA}`,
      },
      body: JSON.stringify({ quantity: 999 }),
    });
    expect(patchRes.status).toBe(404);

    // User A attempts to delete User B's item
    const delRes = await fetch(`${baseUrl}/api/first-aid/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA}` },
    });
    expect(delRes.status).toBe(404);
  });

  it('rejects invalid coordinates on pharmacy search', async () => {
    const res = await fetch(`${baseUrl}/api/pharmacies/search?latitude=999&longitude=77`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid Indian mobile number on profile update', async () => {
    const res = await fetch(`${baseUrl}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA}`,
      },
      body: JSON.stringify({
        phone_e164: '12345',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
