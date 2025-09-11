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
  // Allow GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
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
      return res.status(401).json({ 
        authenticated: false,
        error: 'Session expired' 
      });
    }

    if (req.method === 'GET') {
      // Get user profile
      try {
        const userRecord = await admin.auth().getUser(sessionData.uid);
        
        return res.status(200).json({
          success: true,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            displayName: userRecord.displayName,
            createdAt: userRecord.metadata.creationTime,
            lastSignIn: userRecord.metadata.lastSignInTime
          }
        });
        
      } catch (userError) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }
    }

    if (req.method === 'PUT') {
      // Update user profile
      const { displayName, email } = req.body;
      
      const updateData = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          error: 'No valid fields to update' 
        });
      }

      try {
        const userRecord = await admin.auth().updateUser(sessionData.uid, updateData);
        
        return res.status(200).json({
          success: true,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            displayName: userRecord.displayName
          }
        });
        
      } catch (updateError) {
        console.error('Update user error:', updateError);
        return res.status(400).json({ 
          error: 'Failed to update user profile' 
        });
      }
    }

  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}