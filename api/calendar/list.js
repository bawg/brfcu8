// pages/api/calendar/list.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional query params: limit, order
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    let q = db.collection('calendar_events').orderBy('createdAt', order);
    if (limit) q = q.limit(limit);

    const snap = await q.get();

    const events = snap.docs.map(doc => {
      const d = doc.data() || {};
      const createdAt =
        d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null;
      const updatedAt =
        d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null;

      return {
        id: doc.id,
        name: d.name || '',
        type: d.type || '',
        date: d.date || '',
        time: d.time || '',
        location: d.location || '',
        duration: d.duration || '',
        notes: d.notes || '',
        createdAt,
        updatedAt
      };
    });

    return res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    console.error('List calendar events error:', error);
    return res.status(500).json({ error: 'Failed to list calendar events' });
  }
}