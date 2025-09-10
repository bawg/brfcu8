// /api/auth/verify.js
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
  // Allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
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
        authenticated: false,
        error: 'No authentication token found' 
      });
    }

    // Decode session token
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString());
    } catch (error) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'Invalid session token' 
      });
    }

    // Check if token is expired
    if (Date.now() > sessionData.exp) {
      // Clear expired cookie
      res.setHeader('Set-Cookie', [
        `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
      ]);
      
      return res.status(401).json({ 
        authenticated: false,
        error: 'Session expired' 
      });
    }

    // Verify user still exists in Firebase
    try {
      const userRecord = await admin.auth().getUser(sessionData.uid);
      
      return res.status(200).json({
        authenticated: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime
        }
      });
      
    } catch (userError) {
      // User no longer exists, clear cookie
      res.setHeader('Set-Cookie', [
        `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
      ]);
      
      return res.status(401).json({ 
        authenticated: false,
        error: 'User account no longer exists' 
      });
    }

  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ 
      authenticated: false,
      error: 'Verification failed' 
    });
  }
}
