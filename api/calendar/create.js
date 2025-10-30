// pages/api/calendar/create.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, type, date, time, location, duration, notes } = req.body;

    if (!name || !type || !date) {
      return res.status(400).json({ error: 'Name, type, and date are required' });
    }

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

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      eventId: docRef.id
    });


} catch (error) {
  console.error('Create calendar event error:', error);
  return res
    .status(500)
    .json({ error: String(error?.message || error) });   // <-- temporary debug
}
