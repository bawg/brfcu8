export const config = { api: { bodyParser: true } };

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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Delete request body:', typeof req.body, req.body);

    const { id } = req.body;

    // Validate id
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Get reference to the document
    const docRef = db.collection('calendar_events').doc(id);
    
    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete the document
    await docRef.delete();

    return res.status(200).json({ 
      success: true, 
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
}