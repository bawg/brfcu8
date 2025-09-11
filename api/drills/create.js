// /api/drills/create.js
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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const cookies = req.headers.cookie || '';
    const authToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Decode and verify session token
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString());
      if (Date.now() > sessionData.exp) {
        return res.status(401).json({ error: 'Session expired' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const { name, description, skill, duration, instructions, equipment } = req.body;

    // Validate required fields
    if (!name || !description || !skill || !duration) {
      return res.status(400).json({ 
        error: 'Name, description, skill, and duration are required' 
      });
    }

    // Create drill object
    const drill = {
      name,
      description,
      skill,
      duration: parseInt(duration),
      instructions: instructions || '',
      equipment: equipment || [],
      createdBy: sessionData.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const db = admin.firestore();
    const drillRef = await db.collection('drills').add(drill);

    return res.status(201).json({
      success: true,
      drill: {
        id: drillRef.id,
        ...drill,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Create drill error:', error);
    return res.status(500).json({ 
      error: 'Failed to create drill' 
    });
  }
}