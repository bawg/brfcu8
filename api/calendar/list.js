// /api/calendar/list.js
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Missing Firebase environment variables');
      return res.status(500).json({ 
        error: 'Service not properly configured. Please check environment variables.' 
      });
    }

    // Get Firestore instance
    const db = admin.firestore();
    
    // Fetch all calendar events from the 'calendar_events' collection
    const eventsSnapshot = await db.collection('calendar_events').get();
    
    // Transform Firestore documents to plain objects
    const events = [];
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        name: data.name || '',
        type: data.type || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        duration: data.duration || '',
        notes: data.notes || data.details || '',
        // Include any additional fields that might exist
        ...data
      });
    });

    // Sort events by date (ascending)
    events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      message: error.message 
    });
  }
}
