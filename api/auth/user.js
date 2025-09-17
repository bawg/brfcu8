// /api/auth/user.js
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
    // Get session token from cookie
    const cookies = req.headers.cookie || '';
    const authToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!authToken) {
      return res.status(401).json({ 
        error: 'No authentication token found' 
      });
    }

    // Decode session token
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString());
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid session token' 
      });
    }

    // Check if token is expired
    if (Date.now() > sessionData.exp) {
      return res.status(401).json({ 
        error: 'Session expired' 
      });
    }

    // Get user info from Firebase
    try {
      const userRecord = await admin.auth().getUser(sessionData.uid);
      
      return res.status(200).json({
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
          customClaims: userRecord.customClaims || {}
        }
      });
      
    } catch (userError) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

  } catch (error) {
    console.error('User info error:', error);
    return res.status(500).json({ 
      error: 'Failed to get user information' 
    });
  }
}