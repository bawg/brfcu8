// /api/auth/logout.js
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
  // Allow POST and GET requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie
    const cookies = req.headers.cookie || '';
    const authToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('auth-token='))
      ?.split('=')[1];

    // Clear the authentication cookie
    res.setHeader('Set-Cookie', [
      `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
    ]);

    if (authToken) {
      try {
        // Decode session token to get user info
        const sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString());
        
        // Optionally revoke all refresh tokens for this user in Firebase
        // This will sign out the user from all devices
        await admin.auth().revokeRefreshTokens(sessionData.uid);
        
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully'
        });
        
      } catch (decodeError) {
        // Token was invalid, but we still cleared the cookie
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear the cookie even if there's an error
    res.setHeader('Set-Cookie', [
      `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
    ]);
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}