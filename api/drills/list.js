// /api/drills/list.js
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
  // Allow GET requests
  if (req.method !== 'GET') {
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

    // Get query parameters for filtering and pagination
    const { skill, duration, search, limit = 50, offset = 0 } = req.query;

    const db = admin.firestore();
    let query = db.collection('drills');

    // Apply filters
    if (skill && skill !== 'All Skills') {
      query = query.where('skill', '==', skill);
    }

    if (duration && duration !== 'All Durations') {
      const durationNum = parseInt(duration);
      if (!isNaN(durationNum)) {
        query = query.where('duration', '==', durationNum);
      }
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    // Apply pagination
    query = query.limit(parseInt(limit));
    if (parseInt(offset) > 0) {
      query = query.offset(parseInt(offset));
    }

    const snapshot = await query.get();
    const drills = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const drill = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };

      // Apply search filter on the results if specified
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          drill.name.toLowerCase().includes(searchLower) ||
          drill.description.toLowerCase().includes(searchLower) ||
          drill.skill.toLowerCase().includes(searchLower) ||
          (drill.instructions && drill.instructions.toLowerCase().includes(searchLower))
        ) {
          drills.push(drill);
        }
      } else {
        drills.push(drill);
      }
    });

    // Get total count for pagination (optional, can be expensive)
    let totalCount = null;
    try {
      const countSnapshot = await db.collection('drills').count().get();
      totalCount = countSnapshot.data().count;
    } catch (countError) {
      console.warn('Could not get total count:', countError);
    }

    return res.status(200).json({
      success: true,
      drills,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: drills.length,
        totalCount
      },
      filters: {
        skill: skill || null,
        duration: duration || null,
        search: search || null
      }
    });

  } catch (error) {
    console.error('List drills error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch drills' 
    });
  }
}