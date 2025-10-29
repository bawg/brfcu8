// pages/api/calendar/create.js
export const config = { api: { bodyParser: true } }; // ensure Node runtime, not Edge

const admin = require('firebase-admin');

function buildServiceAccount() {
  return {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    // If you stored \n as literal backslash-n, keep the replace. If you stored true newlines, REMOVE the replace.
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
}

function initAdminIfNeeded() {
  if (!admin.apps.length) {
    const svc = buildServiceAccount();
    // Quick validations to catch common issues
    if (!svc.project_id) throw new Error("FIREBASE_PROJECT_ID missing");
    if (!svc.client_email) throw new Error("FIREBASE_CLIENT_EMAIL missing");
    if (!svc.private_key) throw new Error("FIREBASE_PRIVATE_KEY missing or empty");
    if (!svc.private_key.includes("BEGIN PRIVATE KEY")) {
      throw new Error("FIREBASE_PRIVATE_KEY appears malformed (no BEGIN PRIVATE KEY)");
    }
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  }
  return admin;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Surface env presence for this single debug run
    console.log('envs', {
      hasProject: !!process.env.FIREBASE_PROJECT_ID,
      hasEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      keyLen: (process.env.FIREBASE_PRIVATE_KEY || '').length,
    });

    const { name, type, date, time, location, duration, notes } = req.body || {};
    if (!name || !type || !date) {
      return res.status(400).json({ error: 'Name, type, and date are required' });
    }

    const adm = initAdminIfNeeded();
    const db = adm.firestore();

    const ts = admin.firestore.FieldValue.serverTimestamp();
    const eventData = {
      name,
      type,
      date,
      time: time || '',
      location: location || '',
      duration: duration || '',
      notes: notes || '',
      createdAt: ts,
      updatedAt: ts
    };

    const docRef = await db.collection('calendar_events').add(eventData);
    return res.status(201).json({ success: true, message: 'Event created successfully', eventId: docRef.id });

  } catch (error) {
    console.error('Create calendar event error:', error);
    // TEMPORARY: return the real error so we know exactly what breaks
    return res.status(500).json({ error: String(error?.message || error) });
  }
}